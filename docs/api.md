# DiffWise REST API Reference

The DiffWise API runs on port 8005 (or configured port) under prefix `/api/v1`.

---

## Endpoints Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/info` | Service metadata, architecture archetype, and version. |
| `GET` | `/api/v1/readyz` | Liveness and dependency readiness probes. |
| `GET` | `/api/v1/reviews` | List all tracked pull request reviews and merge decisions. |
| `GET` | `/api/v1/reviews/{id}` | Retrieve complete review detail with diff hunks and inline comments. |
| `POST` | `/api/v1/reviews/diff` | Submit raw git diff to run architecture linter and local GPU review. |
| `POST` | `/api/v1/reviews/{id}/override` | Submit manual architect override for a merge gate decision. |
| `GET` | `/api/v1/rules` | Retrieve list of active architecture and security rules. |
| `POST` | `/api/v1/rules` | Register or update a custom linting rule. |
| `PUT` | `/api/v1/rules/{id}/toggle` | Toggle enable/disable status of a rule. |

---

## Detailed Endpoint Specifications

### 1. `POST /api/v1/reviews/diff`
Submits raw git diff text, executes rule-based linter, and invokes local GPU Ollama (`qwen2.5:0.5b`) to synthesize inline architectural comments.

**Request Body:**
```json
{
  "title": "feat(billing): introduce recurring Stripe subscriptions",
  "author": "alex.dev@antigravity.io",
  "base_branch": "main",
  "head_branch": "feature/stripe-subscriptions",
  "diff_text": "diff --git a/services/billing.py b/services/billing.py\n@@ -1,3 +1,5 @@\n+stripe_api_key = 'mock_secret_key_...'\n...",
  "model": "qwen2.5:0.5b"
}
```

**Response (HTTP 200 OK):**
```json
{
  "id": "rev_b4c8102a",
  "pr_number": 105,
  "title": "feat(billing): introduce recurring Stripe subscriptions",
  "author": "alex.dev@antigravity.io",
  "base_branch": "main",
  "head_branch": "feature/stripe-subscriptions",
  "risk_score": 78,
  "merge_status": "BLOCKED",
  "summary": "BLOCKED: Detected critical security and architectural violations...",
  "files": [
    {
      "old_path": "services/billing.py",
      "new_path": "services/billing.py",
      "status": "modified",
      "additions": 4,
      "deletions": 0,
      "hunks": []
    }
  ],
  "violations": [
    {
      "rule_id": "SEC001",
      "file_path": "services/billing.py",
      "line_number": 2,
      "severity": "CRITICAL",
      "message": "Exposed Secret or Plaintext Credential:...",
      "suggested_fix": "Store secret in environment variables or cloud secrets manager."
    }
  ],
  "comments": [
    {
      "id": "comm_1_sec001",
      "file_path": "services/billing.py",
      "line_number": 2,
      "severity": "CRITICAL",
      "title": "Critical: Exposed Secret",
      "comment": "Production Stripe live secret is embedded in source code.",
      "code_suggestion": "stripe_key = os.environ['STRIPE_SECRET_KEY']"
    }
  ],
  "latency_ms": 3900.2,
  "reviewed_at": "2026-10-11T14:00:00Z",
  "model": "qwen2.5:0.5b"
}
```

**Error Response (HTTP 503 Service Unavailable — RFC 7807):**
```json
{
  "type": "https://diffwise.dev/errors/upstream-unavailable",
  "title": "Local GPU LLM Engine Unavailable",
  "status": 503,
  "detail": "Failed to connect to local GPU Ollama at http://127.0.0.1:11434/chat/completions"
}
```
