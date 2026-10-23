from __future__ import annotations

from fastapi import APIRouter, HTTPException
from src.diffwise.domain.entities import ArchitectureRule
from src.diffwise.services.store import store

router = APIRouter(prefix="/rules", tags=["rules"])


@router.get("", response_model=list[ArchitectureRule])
async def list_rules() -> list[ArchitectureRule]:
    """Retrieve all architecture boundary and security linter rules."""
    return list(store.rules.values())


@router.post("", response_model=ArchitectureRule)
async def create_or_update_rule(rule: ArchitectureRule) -> ArchitectureRule:
    """Register or update an architecture linter rule."""
    store.rules[rule.id] = rule
    return rule


@router.put("/{rule_id}/toggle", response_model=ArchitectureRule)
async def toggle_rule(rule_id: str) -> ArchitectureRule:
    """Toggle enable/disable status for an architecture rule."""
    rule = store.rules.get(rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail=f"Rule {rule_id} not found")
    rule.enabled = not rule.enabled
    return rule
