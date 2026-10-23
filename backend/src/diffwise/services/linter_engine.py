from __future__ import annotations

import re
from src.diffwise.domain.entities import (
    ArchitectureRule,
    DiffFile,
    DiffLineType,
    LintViolation,
    ParsedDiff,
    RuleType,
    SeverityLevel,
)

DEFAULT_RULES: list[ArchitectureRule] = [
    ArchitectureRule(
        id="ARCH001",
        name="Layer Boundary Inversion",
        description="Domain and entity models must not import API controllers or routing frameworks.",
        rule_type=RuleType.BOUNDARY,
        pattern=r"(from\s+(?:.*api|.*routes|.*controllers|fastapi)\s+import|import\s+fastapi)",
        severity=SeverityLevel.CRITICAL,
        enabled=True,
    ),
    ArchitectureRule(
        id="SEC001",
        name="Exposed Secret or Plaintext Credential",
        description="Sensitive authentication tokens, secret keys, or passwords committed to source code.",
        rule_type=RuleType.SECURITY,
        pattern=r"(?:sk_(?:live|test)_[a-zA-Z0-9]{16,}|ghp_[a-zA-Z0-9]{20,}|AKIA[0-9A-Z]{16}|(?i:password|secret_key|api_key|secret_token)\s*=\s*['\"][^'\"]{8,}['\"])",
        severity=SeverityLevel.CRITICAL,
        enabled=True,
    ),
    ArchitectureRule(
        id="SEC002",
        name="Missing Tenant Isolation",
        description="SQL or ORM queries without tenant_id isolation in multi-tenant tables.",
        rule_type=RuleType.SECURITY,
        pattern=r"(?:select\(.*\)\.filter_by\((?!.*tenant_id)|SELECT\s+.*\s+FROM\s+\w+\s+WHERE\s+(?!.*tenant_id))",
        severity=SeverityLevel.WARNING,
        enabled=True,
    ),
    ArchitectureRule(
        id="ARCH002",
        name="Wildcard Namespace Pollution",
        description="Wildcard imports prevent static analysis and introduce hidden namespace collisions.",
        rule_type=RuleType.BOUNDARY,
        pattern=r"from\s+[\w\.]+\s+import\s+\*",
        severity=SeverityLevel.WARNING,
        enabled=True,
    ),
    ArchitectureRule(
        id="SCHEMA001",
        name="Destructive Schema Migration",
        description="Irreversible column or table drops in database migrations require safe deprecation.",
        rule_type=RuleType.SCHEMA,
        pattern=r"(?:op\.drop_column|op\.drop_table|DROP\s+COLUMN|DROP\s+TABLE)",
        severity=SeverityLevel.CRITICAL,
        enabled=True,
    ),
]


def lint_parsed_diff(
    parsed_diff: ParsedDiff,
    rules: list[ArchitectureRule] | None = None,
) -> list[LintViolation]:
    """
    Scans additions across all diff files against active architectural and security rules.
    """
    active_rules = rules if rules is not None else DEFAULT_RULES
    violations: list[LintViolation] = []

    for file in parsed_diff.files:
        for hunk in file.hunks:
            for line in hunk.lines:
                if line.line_type != DiffLineType.ADD or not line.new_line_number:
                    continue

                for rule in active_rules:
                    if not rule.enabled:
                        continue

                    # Boundary rule specific to domain files
                    if rule.id == "ARCH001" and not ("domain" in file.new_path or "models" in file.new_path):
                        continue

                    if re.search(rule.pattern, line.content):
                        suggested_fix = None
                        if rule.id == "ARCH001":
                            suggested_fix = "Invert dependency using dependency injection or interfaces."
                        elif rule.id == "SEC001":
                            suggested_fix = "Store secret in environment variables or cloud secrets manager."
                        elif rule.id == "SEC002":
                            suggested_fix = "Add tenant_id filter to ensure multi-tenant security isolation."
                        elif rule.id == "ARCH002":
                            suggested_fix = "Explicitly list imported symbols rather than using wildcard import."
                        elif rule.id == "SCHEMA001":
                            suggested_fix = "Use a two-phase deprecation cycle before dropping columns."

                        violations.append(
                            LintViolation(
                                rule_id=rule.id,
                                file_path=file.new_path,
                                line_number=line.new_line_number,
                                severity=rule.severity,
                                message=f"{rule.name}: {rule.description}",
                                suggested_fix=suggested_fix,
                            )
                        )

    return violations
