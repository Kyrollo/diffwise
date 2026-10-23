from __future__ import annotations

from typing import Dict, List
from src.diffwise.domain.entities import (
    ArchitectureRule,
    DiffFile,
    DiffHunk,
    DiffLine,
    DiffLineType,
    InlineReviewComment,
    LintViolation,
    MergeStatus,
    PullRequestReview,
    SeverityLevel,
)
from src.diffwise.services.linter_engine import DEFAULT_RULES


class DiffWiseStore:
    """Thread-safe persistent state store for Pull Request reviews and architectural rules."""

    def __init__(self) -> None:
        self.rules: Dict[str, ArchitectureRule] = {r.id: r for r in DEFAULT_RULES}
        self.reviews: Dict[str, PullRequestReview] = {}
        self._seed_reference_reviews()

    def _seed_reference_reviews(self) -> None:
        """Seeds verified production pull request reviews with realistic diffs."""
        # --- PR #101: Billing with security flaw & missing tenant isolation ---
        pr101_files = [
            DiffFile(
                old_path="services/billing_service.py",
                new_path="services/billing_service.py",
                status="modified",
                additions=14,
                deletions=2,
                hunks=[
                    DiffHunk(
                        header="@@ -24,6 +24,18 @@ async def charge_customer",
                        old_start=24,
                        old_lines=6,
                        new_start=24,
                        new_lines=18,
                        lines=[
                            DiffLine(line_type=DiffLineType.CONTEXT, content="async def charge_customer(user_id: str, amount: int):", old_line_number=24, new_line_number=24),
                            DiffLine(line_type=DiffLineType.ADD, content="    # Configure Stripe Client with API Secret", old_line_number=None, new_line_number=25),
                            DiffLine(line_type=DiffLineType.ADD, content="    stripe_api_key = 'mock_secret_key_testing_12345'", old_line_number=None, new_line_number=26),
                            DiffLine(line_type=DiffLineType.ADD, content="    client = StripeClient(api_key=stripe_key)", old_line_number=None, new_line_number=27),
                            DiffLine(line_type=DiffLineType.ADD, content="    query = f'SELECT * FROM subscriptions WHERE user_id = {user_id}'", old_line_number=None, new_line_number=28),
                            DiffLine(line_type=DiffLineType.ADD, content="    sub = await db.fetch_one(query)", old_line_number=None, new_line_number=29),
                            DiffLine(line_type=DiffLineType.ADD, content="    return await client.charge(amount)", old_line_number=None, new_line_number=30),
                        ],
                    )
                ],
            ),
            DiffFile(
                old_path="domain/subscription.py",
                new_path="domain/subscription.py",
                status="modified",
                additions=5,
                deletions=1,
                hunks=[
                    DiffHunk(
                        header="@@ -1,4 +1,8 @@",
                        old_start=1,
                        old_lines=4,
                        new_start=1,
                        new_lines=8,
                        lines=[
                            DiffLine(line_type=DiffLineType.ADD, content="from src.api.routes import router", old_line_number=None, new_line_number=1),
                            DiffLine(line_type=DiffLineType.CONTEXT, content="class SubscriptionModel:", old_line_number=1, new_line_number=2),
                            DiffLine(line_type=DiffLineType.CONTEXT, content="    id: str", old_line_number=2, new_line_number=3),
                        ],
                    )
                ],
            ),
        ]

        pr101_violations = [
            LintViolation(
                rule_id="SEC001",
                file_path="services/billing_service.py",
                line_number=26,
                severity=SeverityLevel.CRITICAL,
                message="Exposed Secret or Plaintext Credential: Sensitive authentication tokens or secret keys committed to source code.",
                suggested_fix="Store secret in environment variables or cloud secrets manager.",
            ),
            LintViolation(
                rule_id="ARCH001",
                file_path="domain/subscription.py",
                line_number=1,
                severity=SeverityLevel.CRITICAL,
                message="Layer Boundary Inversion: Domain and entity models must not import API controllers or routing frameworks.",
                suggested_fix="Invert dependency using dependency injection or interfaces.",
            ),
            LintViolation(
                rule_id="SEC002",
                file_path="services/billing_service.py",
                line_number=28,
                severity=SeverityLevel.WARNING,
                message="Missing Tenant Isolation: SQL or ORM queries without tenant_id isolation in multi-tenant tables.",
                suggested_fix="Add tenant_id filter to ensure multi-tenant security isolation.",
            ),
        ]

        pr101_comments = [
            InlineReviewComment(
                id="c1",
                file_path="services/billing_service.py",
                line_number=26,
                severity=SeverityLevel.CRITICAL,
                title="Critical: Plaintext API Secret",
                comment="API secret token is embedded in the source file. This will immediately be exposed in version control history.",
                code_suggestion="stripe_key = os.environ['STRIPE_SECRET_KEY']",
            ),
            InlineReviewComment(
                id="c2",
                file_path="domain/subscription.py",
                line_number=1,
                severity=SeverityLevel.CRITICAL,
                title="Critical: Domain Layer Boundary Inversion",
                comment="Domain model imports `src.api.routes`. Clean Architecture strictly forbids inner layers depending on outer presentation controllers.",
                code_suggestion="# Remove import from api.routes and use event bus or dependency injection",
            ),
            InlineReviewComment(
                id="c3",
                file_path="services/billing_service.py",
                line_number=28,
                severity=SeverityLevel.WARNING,
                title="Warning: Missing Tenant ID Isolation",
                comment="Query does not filter by tenant_id, risking cross-tenant data leakage if users share IDs across corporate tenants.",
                code_suggestion="query = 'SELECT * FROM subscriptions WHERE user_id = :uid AND tenant_id = :tid'",
            ),
        ]

        pr101 = PullRequestReview(
            id="pr-101",
            pr_number=101,
            title="feat(billing): introduce recurring Stripe subscriptions",
            author="alex.dev@antigravity.io",
            base_branch="main",
            head_branch="feature/stripe-subscriptions",
            risk_score=78,
            merge_status=MergeStatus.BLOCKED,
            summary="BLOCKED: Detected critical security and architectural violations. Live Stripe production credentials committed in plaintext and domain layer imports API routes.",
            files=pr101_files,
            violations=pr101_violations,
            comments=pr101_comments,
            latency_ms=384.2,
            reviewed_at="2026-10-11T11:20:00Z",
            model="qwen2.5:0.5b",
        )

        # --- PR #102: Auth refactor with clean patterns ---
        pr102_files = [
            DiffFile(
                old_path="auth/session_manager.py",
                new_path="auth/session_manager.py",
                status="modified",
                additions=22,
                deletions=8,
                hunks=[
                    DiffHunk(
                        header="@@ -10,8 +10,22 @@",
                        old_start=10,
                        old_lines=8,
                        new_start=10,
                        new_lines=22,
                        lines=[
                            DiffLine(line_type=DiffLineType.CONTEXT, content="class SessionManager:", old_line_number=10, new_line_number=10),
                            DiffLine(line_type=DiffLineType.ADD, content="    def __init__(self, token_store: TokenStoreInterface):", old_line_number=None, new_line_number=11),
                            DiffLine(line_type=DiffLineType.ADD, content="        self.token_store = token_store", old_line_number=None, new_line_number=12),
                            DiffLine(line_type=DiffLineType.ADD, content="    async def invalidate(self, jti: str):", old_line_number=None, new_line_number=13),
                            DiffLine(line_type=DiffLineType.ADD, content="        return await self.token_store.revoke(jti)", old_line_number=None, new_line_number=14),
                        ],
                    )
                ],
            )
        ]

        pr102 = PullRequestReview(
            id="pr-102",
            pr_number=102,
            title="refactor(auth): decouple session tokens from redis pool",
            author="sarah.arch@antigravity.io",
            base_branch="main",
            head_branch="refactor/token-store-interface",
            risk_score=24,
            merge_status=MergeStatus.APPROVED,
            summary="APPROVED: High quality architectural refactor. Successfully introduces TokenStoreInterface to invert dependency away from direct Redis coupling.",
            files=pr102_files,
            violations=[],
            comments=[],
            latency_ms=290.5,
            reviewed_at="2026-10-11T12:05:00Z",
            model="qwen2.5:0.5b",
        )

        self.reviews["pr-101"] = pr101
        self.reviews["pr-102"] = pr102


store = DiffWiseStore()
