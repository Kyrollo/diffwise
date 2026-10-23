from __future__ import annotations

from enum import Enum
from typing import Any
from pydantic import BaseModel, Field


class SeverityLevel(str, Enum):
    CRITICAL = "CRITICAL"
    WARNING = "WARNING"
    INFO = "INFO"


class MergeStatus(str, Enum):
    APPROVED = "APPROVED"
    BLOCKED = "BLOCKED"
    NEEDS_REVISION = "NEEDS_REVISION"


class RuleType(str, Enum):
    BOUNDARY = "BOUNDARY"
    SECURITY = "SECURITY"
    SCHEMA = "SCHEMA"
    COMPLEXITY = "COMPLEXITY"


class DiffLineType(str, Enum):
    ADD = "ADD"
    DELETE = "DELETE"
    CONTEXT = "CONTEXT"


class DiffLine(BaseModel):
    line_type: DiffLineType
    content: str
    old_line_number: int | None = None
    new_line_number: int | None = None


class DiffHunk(BaseModel):
    header: str
    old_start: int
    old_lines: int
    new_start: int
    new_lines: int
    lines: list[DiffLine] = Field(default_factory=list)


class DiffFile(BaseModel):
    old_path: str
    new_path: str
    status: str  # modified, added, deleted
    additions: int = 0
    deletions: int = 0
    hunks: list[DiffHunk] = Field(default_factory=list)


class ParsedDiff(BaseModel):
    files: list[DiffFile] = Field(default_factory=list)
    total_additions: int = 0
    total_deletions: int = 0
    total_files: int = 0


class LintViolation(BaseModel):
    rule_id: str
    file_path: str
    line_number: int
    severity: SeverityLevel
    message: str
    suggested_fix: str | None = None


class InlineReviewComment(BaseModel):
    id: str
    file_path: str
    line_number: int
    severity: SeverityLevel
    title: str
    comment: str
    code_suggestion: str | None = None


class ArchitectureRule(BaseModel):
    id: str
    name: str
    description: str
    rule_type: RuleType
    pattern: str
    severity: SeverityLevel
    enabled: bool = True


class PullRequestReview(BaseModel):
    id: str
    pr_number: int
    title: str
    author: str
    base_branch: str
    head_branch: str
    risk_score: int  # 0 to 100
    merge_status: MergeStatus
    summary: str
    files: list[DiffFile] = Field(default_factory=list)
    violations: list[LintViolation] = Field(default_factory=list)
    comments: list[InlineReviewComment] = Field(default_factory=list)
    latency_ms: float = 0.0
    reviewed_at: str = ""
    model: str = "qwen2.5:0.5b"
