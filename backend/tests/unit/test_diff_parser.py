from __future__ import annotations

import textwrap
from src.diffwise.domain.entities import DiffLineType
from src.diffwise.services.diff_parser import parse_unified_diff

SAMPLE_DIFF = textwrap.dedent("""
diff --git a/services/auth.py b/services/auth.py
index 1234567..89abcdef 100644
--- a/services/auth.py
+++ b/services/auth.py
@@ -10,6 +10,8 @@ def authenticate(user, password):
     if not user:
         return False
+    # Add audit log
+    log_audit_event(user.id, "LOGIN_ATTEMPT")
     return verify_password(password, user.hash)
diff --git a/domain/user.py b/domain/user.py
new file mode 100644
--- /dev/null
+++ b/domain/user.py
@@ -0,0 +1,5 @@
+class User:
+    id: str
+    email: str
""")


def test_parse_unified_diff() -> None:
    parsed = parse_unified_diff(SAMPLE_DIFF)

    assert parsed.total_files == 2
    assert parsed.total_additions >= 5
    assert parsed.total_deletions == 0

    # File 1: services/auth.py
    f1 = parsed.files[0]
    assert f1.old_path == "services/auth.py"
    assert f1.new_path == "services/auth.py"
    assert f1.status == "modified"
    assert len(f1.hunks) == 1

    hunk1 = f1.hunks[0]
    assert hunk1.old_start == 10
    assert hunk1.new_start == 10
    added_lines = [l for l in hunk1.lines if l.line_type == DiffLineType.ADD]
    assert len(added_lines) == 2
    assert added_lines[0].new_line_number == 12

    # File 2: domain/user.py
    f2 = parsed.files[1]
    assert f2.new_path == "domain/user.py"
    assert f2.status == "added"
