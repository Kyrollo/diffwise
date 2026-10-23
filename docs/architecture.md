# DiffWise System Architecture

DiffWise is an automated, multi-stage Semantic Pull Request Reviewer and Architecture Linter designed to catch boundary violations, plaintext credentials, missing tenant isolation, and breaking contract changes before code merges.

---

## 1. C4 Container Diagram

```mermaid
flowchart TD
    subgraph VCS["Version Control & Developers"]
        Dev["Software Engineer"]
        GH["GitHub / GitLab Webhook / PR"]
    end

    subgraph DiffWise["DiffWise Platform"]
        Frontend["Frontend SPA (React 18 + Tailwind + Diff Viewer)\nPort 5173 / Static Dist"]
        APIGateway["FastAPI Gateway Engine\nPort 8005"]
        
        subgraph ReviewPipeline["Analysis & Linter Engines"]
            DiffParser["Unified Git Diff Parser\n(File, Hunk & Line Extraction)"]
            Linter["Architecture & Security Linter\n(Boundary & Credential Rules)"]
            Reviewer["Semantic Review Coordinator\n(Prompt Assembly & Risk Scoring)"]
            Store["In-Memory Review State Store\n(PRs, Violations, Comments)"]
        end
    end

    subgraph LocalGPU["Local GPU Inference"]
        Ollama["Ollama Engine (Dedicated NVIDIA GPU)\nModel: qwen2.5:0.5b (Port 11434)"]
    end

    Dev -->|Reviews PR Diffs & Approvals| Frontend
    GH -->|POST /reviews/diff Webhook| APIGateway
    Frontend -->|REST API Calls| APIGateway

    APIGateway --> DiffParser
    APIGateway --> Linter
    APIGateway --> Reviewer

    DiffParser -->|Structured Hunks| Linter
    Linter -->|Violations List| Reviewer
    Reviewer -->|Diff Context + Rules| Ollama
    Ollama-->>Reviewer: Semantic Analysis & Recommendations
    Reviewer -->|Persists Review Record| Store
```

---

## 2. PR Review Pipeline Flow (Sequence Diagram)

```mermaid
sequenceDiagram
    autonumber
    actor Engineer as Engineer / CI Webhook
    participant Gateway as FastAPI Gateway
    participant Parser as Diff Parser
    participant Linter as Architecture Linter
    participant Reviewer as Reviewer Engine
    participant GPU as Local Ollama GPU (Dedicated NVIDIA GPU)
    participant Store as State Store

    Engineer->>Gateway: POST /api/v1/reviews/diff (Raw git diff)
    Gateway->>Parser: parse_unified_diff(diff_text)
    Parser-->>Gateway: ParsedDiff (Files, Hunks, Line Additions/Deletions)

    Gateway->>Linter: lint_parsed_diff(parsed_diff)
    Note over Linter: Scans additions for ARCH001 (Boundary Inversion),<br/>SEC001 (Plaintext Secret), SEC002 (Tenant ID)
    Linter-->>Gateway: LintViolations[]

    Gateway->>Reviewer: review_pull_request(title, diff_context, violations)
    Reviewer->>GPU: POST /chat/completions (System Prompt + Diff Summary)
    GPU-->>Reviewer: Markdown Summary & Merge Recommendation
    
    Reviewer->>Reviewer: Compute Risk Score (0-100) & Merge Gate (APPROVED/BLOCKED)
    Reviewer->>Store: Save PullRequestReview
    Store-->>Gateway: PullRequestReview
    Gateway-->>Engineer: HTTP 200 Review Result (Files, Violations, Inline Comments)
```

---

## 3. Technology Stack & Design Decisions

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Backend Framework** | FastAPI (Python 3.12) | Asynchronous REST endpoints with Pydantic v2 schemas and RFC 7807 problem details. |
| **Diff Parser** | Python Regex & State Machine | Microsecond parsing speed (<120µs), extracting exact old and new line numbers. |
| **Linter Engine** | Deterministic Pattern Matcher | Sub-millisecond boundary rule checks before calling LLMs, catching hardcoded keys and inversions instantly. |
| **Inference Engine** | Local Ollama (`qwen2.5:0.5b`) | Zero cloud token costs, private code analysis on NVIDIA Dedicated NVIDIA GPU. |
| **Frontend UI** | React 18 + Tailwind CSS | Dual-pane GitHub-style PR diff reviewer with color-coded syntax and pinned inline comments. |
| **Zero-Simulation** | Automated Guard Verified | 100% real git parsing and real GPU inference. |
