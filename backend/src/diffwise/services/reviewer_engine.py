from __future__ import annotations

import json
import re
import time
import uuid
import httpx
from src.diffwise.core.config import settings
from src.diffwise.domain.entities import (
    InlineReviewComment,
    LintViolation,
    MergeStatus,
    ParsedDiff,
    PullRequestReview,
    SeverityLevel,
)
from src.diffwise.services.linter_engine import lint_parsed_diff


class UpstreamOllamaError(Exception):
    """Raised when upstream Ollama inference fails."""
    pass


async def review_pull_request(
    pr_number: int,
    title: str,
    author: str,
    base_branch: str,
    head_branch: str,
    diff_text: str,
    parsed_diff: ParsedDiff,
    model: str = "qwen2.5:0.5b",
) -> PullRequestReview:
    """
    Coordinates multi-stage PR review:
    1. Runs fast rule-based AST & boundary linter
    2. Invokes local GPU Ollama for semantic code review
    3. Merges violations & comments into unified PullRequestReview
    """
    start_time = time.perf_counter()
    violations = lint_parsed_diff(parsed_diff)

    # Base risk score from rule violations
    base_risk = 0
    for v in violations:
        if v.severity == SeverityLevel.CRITICAL:
            base_risk += 35
        elif v.severity == SeverityLevel.WARNING:
            base_risk += 15
        else:
            base_risk += 5

    # Truncate diff summary for prompt context (within GPU memory budget)
    diff_summary_lines = []
    for file in parsed_diff.files:
        diff_summary_lines.append(f"File: {file.new_path} (+{file.additions}/-{file.deletions})")
        for hunk in file.hunks:
            for line in hunk.lines:
                if line.line_type.value in ("ADD", "DELETE"):
                    num = line.new_line_number or line.old_line_number or 0
                    prefix = "+" if line.line_type.value == "ADD" else "-"
                    diff_summary_lines.append(f"  L{num} {prefix} {line.content}")

    diff_context = "\n".join(diff_summary_lines[:200])

    system_instruction = (
        "You are DiffWise, a senior principal software architect and automated PR reviewer. "
        "Analyze the provided Git diff for architecture flaws, security risks, and breaking changes. "
        "Provide an executive summary, evaluate overall risk score (0-100), and state whether the PR should be APPROVED or BLOCKED."
    )
    user_prompt = (
        f"PR Title: {title}\n"
        f"Author: {author}\n"
        f"Branches: {head_branch} -> {base_branch}\n\n"
        f"Git Diff:\n{diff_context}\n\n"
        f"Architectural Lint Violations Detected: {len(violations)}\n"
        f"Please provide your architectural review summary and recommendations."
    )

    url = f"{settings.LLM_BASE_URL.rstrip('/')}/chat/completions"
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.2,
        "max_tokens": 2048,
    }
    headers = {
        "Authorization": f"Bearer {settings.LLM_API_KEY}",
        "Content-Type": "application/json",
    }

    ai_summary = ""
    try:
        async with httpx.AsyncClient(timeout=settings.LLM_TIMEOUT_SECONDS) as client:
            resp = await client.post(url, json=payload, headers=headers)
        if resp.status_code == 200:
            data = resp.json()
            ai_summary = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
        else:
            raise UpstreamOllamaError(f"Ollama returned HTTP {resp.status_code}: {resp.text}")
    except httpx.RequestError as exc:
        raise UpstreamOllamaError(f"Failed to connect to local GPU Ollama at {url}: {exc}") from exc

    # Synthesize comments from lint violations
    inline_comments: list[InlineReviewComment] = []
    for idx, v in enumerate(violations):
        inline_comments.append(
            InlineReviewComment(
                id=f"comm_{idx + 1}_{v.rule_id.lower()}",
                file_path=v.file_path,
                line_number=v.line_number,
                severity=v.severity,
                title=f"Architectural Violation: {v.rule_id}",
                comment=v.message,
                code_suggestion=v.suggested_fix,
            )
        )

    # Calculate final risk score (clamped between 0 and 100)
    risk_score = min(100, max(10, base_risk + (20 if "security" in title.lower() or "auth" in title.lower() else 5)))

    # Determine merge gate status
    if any(v.severity == SeverityLevel.CRITICAL for v in violations) or risk_score >= 70:
        merge_status = MergeStatus.BLOCKED
    elif risk_score >= 40:
        merge_status = MergeStatus.NEEDS_REVISION
    else:
        merge_status = MergeStatus.APPROVED

    latency_ms = round((time.perf_counter() - start_time) * 1000, 2)

    return PullRequestReview(
        id=f"rev_{uuid.uuid4().hex[:8]}",
        pr_number=pr_number,
        title=title,
        author=author,
        base_branch=base_branch,
        head_branch=head_branch,
        risk_score=risk_score,
        merge_status=merge_status,
        summary=ai_summary or "Architectural review completed with rule-based verification.",
        files=parsed_diff.files,
        violations=violations,
        comments=inline_comments,
        latency_ms=latency_ms,
        reviewed_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        model=model,
    )
