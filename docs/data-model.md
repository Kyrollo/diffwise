# DiffWise Data Model

This document outlines the domain entities, relationships, and data structures utilized by DiffWise for git diff parsing, architecture linting, and automated pull request reviews.

---

## 1. Domain Entity Relationship Diagram

```mermaid
classDiagram
    class PullRequestReview {
        +string id
        +int pr_number
        +string title
        +string author
        +string base_branch
        +string head_branch
        +int risk_score
        +MergeStatus merge_status
        +string summary
        +list~DiffFile~ files
        +list~LintViolation~ violations
        +list~InlineReviewComment~ comments
        +float latency_ms
        +string reviewed_at
        +string model
    }

    class DiffFile {
        +string old_path
        +string new_path
        +string status
        +int additions
        +int deletions
        +list~DiffHunk~ hunks
    }

    class DiffHunk {
        +string header
        +int old_start
        +int old_lines
        +int new_start
        +int new_lines
        +list~DiffLine~ lines
    }

    class DiffLine {
        +DiffLineType line_type
        +string content
        +int old_line_number
        +int new_line_number
    }

    class LintViolation {
        +string rule_id
        +string file_path
        +int line_number
        +SeverityLevel severity
        +string message
        +string suggested_fix
    }

    class InlineReviewComment {
        +string id
        +string file_path
        +int line_number
        +SeverityLevel severity
        +string title
        +string comment
        +string code_suggestion
    }

    class ArchitectureRule {
        +string id
        +string name
        +string description
        +RuleType rule_type
        +string pattern
        +SeverityLevel severity
        +bool enabled
    }

    PullRequestReview "1" *-- "many" DiffFile : contains
    PullRequestReview "1" *-- "many" LintViolation : flags
    PullRequestReview "1" *-- "many" InlineReviewComment : annotates
    DiffFile "1" *-- "many" DiffHunk : contains
    DiffHunk "1" *-- "many" DiffLine : lines
    LintViolation --> ArchitectureRule : triggered_by
```

---

## 2. Enums and Classification

### MergeStatus
- `APPROVED`: PR meets all architectural standards; risk score < 40 with 0 critical violations.
- `NEEDS_REVISION`: Moderate architectural warnings or missing tenant filters (risk 40-69).
- `BLOCKED`: Critical boundary inversions or plaintext credentials detected (risk >= 70).

### SeverityLevel
- `CRITICAL`: Immediate security vulnerability, secret leak, or layer inversion (blocking).
- `WARNING`: Architectural drift, missing tenant_id filter, or wildcard import.
- `INFO`: Style recommendation or minor optimization.

### RuleType
- `BOUNDARY`: Clean Architecture layer boundaries (e.g. Domain must not import API/Controller).
- `SECURITY`: Secret token exposure, authentication bypasses, tenant isolation.
- `SCHEMA`: Dangerous DDL operations or irreversible column drops.
- `COMPLEXITY`: Cyclomatic complexity spikes in PR additions.
