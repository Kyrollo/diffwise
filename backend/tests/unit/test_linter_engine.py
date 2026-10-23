from __future__ import annotations

import textwrap
from src.diffwise.domain.entities import SeverityLevel
from src.diffwise.services.diff_parser import parse_unified_diff
from src.diffwise.services.linter_engine import lint_parsed_diff


def test_linter_detects_secret_and_boundary_violations() -> None:
    diff_text = textwrap.dedent("""
    diff --git a/domain/models.py b/domain/models.py
    @@ -1,4 +1,6 @@
    +from src.api.controllers import user_controller
    +SECRET_TOKEN = 'mock_secret_key_testing_12345'
     class User:
         pass
    """)

    parsed = parse_unified_diff(diff_text)
    violations = lint_parsed_diff(parsed)

    assert len(violations) >= 2
    rule_ids = {v.rule_id for v in violations}
    assert "ARCH001" in rule_ids
    assert "SEC001" in rule_ids

    crit = [v for v in violations if v.severity == SeverityLevel.CRITICAL]
    assert len(crit) == 2


def test_linter_clean_diff_no_violations() -> None:
    clean_diff = textwrap.dedent("""
    diff --git a/services/math.py b/services/math.py
    @@ -5,3 +5,5 @@
     def add(a, b):
    +    # Proper addition
    +    return a + b
    """)

    parsed = parse_unified_diff(clean_diff)
    violations = lint_parsed_diff(parsed)
    assert len(violations) == 0
