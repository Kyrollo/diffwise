from __future__ import annotations

from fastapi import APIRouter
from .health import router as health_router
from .auth import router as auth_router
from .reviews import router as reviews_router
from .rules import router as rules_router
from .files import router as files_router

api_v1_router = APIRouter()
api_v1_router.include_router(health_router)
api_v1_router.include_router(auth_router)
api_v1_router.include_router(reviews_router)
api_v1_router.include_router(rules_router)
api_v1_router.include_router(files_router)


@api_v1_router.get("/info", tags=["info"])
async def get_system_info() -> dict[str, str]:
    return {
        "name": "Diffwise",
        "slug": "diffwise",
        "archetype": "GitHub-native dev tool",
        "version": "1.0.0",
        "description": "Semantic Pull Request Reviewer & Architecture Linter: unified git diff parsing, boundary violation checking, and local GPU LLM code review",
    }
