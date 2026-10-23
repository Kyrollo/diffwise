from __future__ import annotations

import random
from typing import Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from src.diffwise.domain.entities import MergeStatus, PullRequestReview
from src.diffwise.services.diff_parser import parse_unified_diff
from src.diffwise.services.reviewer_engine import UpstreamOllamaError, review_pull_request
from src.diffwise.services.store import store

router = APIRouter(prefix="/reviews", tags=["reviews"])


class DiffReviewRequest(BaseModel):
    title: str
    author: str = "engineer@antigravity.io"
    base_branch: str = "main"
    head_branch: str = "feature/change"
    diff_text: str
    pr_number: Optional[int] = None
    model: str = "qwen2.5:0.5b"


class OverrideRequest(BaseModel):
    status: MergeStatus
    justification: str


@router.get("", response_model=list[PullRequestReview])
async def list_reviews() -> list[PullRequestReview]:
    """List all tracked pull request reviews."""
    return list(store.reviews.values())


@router.get("/{review_id}", response_model=PullRequestReview)
async def get_review(review_id: str) -> PullRequestReview:
    """Retrieve detailed pull request review with files, diff hunks, and line annotations."""
    review = store.reviews.get(review_id)
    if not review:
        raise HTTPException(status_code=404, detail=f"Review {review_id} not found")
    return review


@router.post("/diff", response_model=PullRequestReview)
async def submit_diff_review(req: DiffReviewRequest) -> PullRequestReview:
    """
    Submits a raw unified Git diff or PR to execute architecture linting and local GPU LLM semantic review.
    """
    if not req.diff_text.strip():
        raise HTTPException(status_code=400, detail="Empty git diff provided")

    parsed_diff = parse_unified_diff(req.diff_text)
    pr_num = req.pr_number or random.randint(104, 999)

    try:
        review = await review_pull_request(
            pr_number=pr_num,
            title=req.title,
            author=req.author,
            base_branch=req.base_branch,
            head_branch=req.head_branch,
            diff_text=req.diff_text,
            parsed_diff=parsed_diff,
            model=req.model,
        )
        store.reviews[review.id] = review
        return review
    except UpstreamOllamaError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "type": "https://diffwise.dev/errors/upstream-unavailable",
                "title": "Local GPU LLM Engine Unavailable",
                "status": 503,
                "detail": str(exc),
            },
        )


@router.post("/{review_id}/override", response_model=PullRequestReview)
async def override_merge_status(review_id: str, req: OverrideRequest) -> PullRequestReview:
    """Architectural signoff override for a review."""
    review = store.reviews.get(review_id)
    if not review:
        raise HTTPException(status_code=404, detail=f"Review {review_id} not found")

    review.merge_status = req.status
    review.summary += f"\n\n[MANUAL OVERRIDE by Architect]: Status changed to {req.status.value}. Justification: {req.justification}"
    return review
