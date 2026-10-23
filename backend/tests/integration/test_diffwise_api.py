from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_reviews(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/reviews")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 2
    assert any(r["pr_number"] == 101 for r in data)


@pytest.mark.asyncio
async def test_get_review_detail(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/reviews/pr-101")
    assert resp.status_code == 200
    review = resp.json()
    assert review["id"] == "pr-101"
    assert review["merge_status"] == "BLOCKED"
    assert review["risk_score"] >= 70
    assert len(review["violations"]) >= 2
    assert len(review["comments"]) >= 2
    assert len(review["files"]) >= 1


@pytest.mark.asyncio
async def test_override_review(client: AsyncClient) -> None:
    resp = await client.post(
        "/api/v1/reviews/pr-101/override",
        json={"status": "APPROVED", "justification": "Approved exception for staging test sandbox."},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["merge_status"] == "APPROVED"
    assert "MANUAL OVERRIDE" in data["summary"]


@pytest.mark.asyncio
async def test_list_and_toggle_rules(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/rules")
    assert resp.status_code == 200
    rules = resp.json()
    assert len(rules) >= 5

    # Toggle ARCH001
    resp_toggle = await client.put("/api/v1/rules/ARCH001/toggle")
    assert resp_toggle.status_code == 200
    updated = resp_toggle.json()
    assert updated["id"] == "ARCH001"
    assert updated["enabled"] is False

    # Toggle back
    resp_toggle2 = await client.put("/api/v1/rules/ARCH001/toggle")
    assert resp_toggle2.status_code == 200
    assert resp_toggle2.json()["enabled"] is True
