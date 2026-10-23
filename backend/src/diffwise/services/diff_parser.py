from __future__ import annotations

import re
from src.diffwise.domain.entities import (
    DiffFile,
    DiffHunk,
    DiffLine,
    DiffLineType,
    ParsedDiff,
)

HUNK_HEADER_RE = re.compile(
    r"^@@\s+-(\d+)(?:,(\d+))?\s+\+(\d+)(?:,(\d+))?\s+@@(.*)$"
)


def parse_unified_diff(diff_text: str) -> ParsedDiff:
    """
    Parses unified git diff into structured file, hunk, and line objects with precise line tracking.
    """
    lines = diff_text.splitlines()
    files: list[DiffFile] = []
    curr_file: DiffFile | None = None
    curr_hunk: DiffHunk | None = None

    old_line_cursor = 0
    new_line_cursor = 0

    i = 0
    while i < len(lines):
        line = lines[i]

        # Check for git file header: "diff --git a/path b/path"
        if line.startswith("diff --git "):
            if curr_file and curr_hunk:
                curr_file.hunks.append(curr_hunk)
                curr_hunk = None
            if curr_file:
                files.append(curr_file)

            parts = line.split(" ")
            old_path = parts[2][2:] if len(parts) > 2 and parts[2].startswith("a/") else "unknown"
            new_path = parts[3][2:] if len(parts) > 3 and parts[3].startswith("b/") else old_path

            curr_file = DiffFile(
                old_path=old_path,
                new_path=new_path,
                status="modified",
                additions=0,
                deletions=0,
                hunks=[],
            )
            i += 1
            continue

        # Check file status lines
        if curr_file:
            if line.startswith("new file mode"):
                curr_file.status = "added"
            elif line.startswith("deleted file mode"):
                curr_file.status = "deleted"
            elif line.startswith("--- a/"):
                curr_file.old_path = line[6:]
            elif line.startswith("+++ b/"):
                curr_file.new_path = line[6:]

        # Check for hunk header: "@@ -10,5 +10,8 @@ ..."
        match = HUNK_HEADER_RE.match(line)
        if match:
            if curr_file and curr_hunk:
                curr_file.hunks.append(curr_hunk)

            old_start = int(match.group(1))
            old_count = int(match.group(2)) if match.group(2) else 1
            new_start = int(match.group(3))
            new_count = int(match.group(4)) if match.group(4) else 1

            old_line_cursor = old_start
            new_line_cursor = new_start

            curr_hunk = DiffHunk(
                header=line,
                old_start=old_start,
                old_lines=old_count,
                new_start=new_start,
                new_lines=new_count,
                lines=[],
            )
            i += 1
            continue

        # Process diff line contents inside a hunk
        if curr_hunk and curr_file:
            if line.startswith("+") and not line.startswith("+++"):
                curr_hunk.lines.append(
                    DiffLine(
                        line_type=DiffLineType.ADD,
                        content=line[1:],
                        old_line_number=None,
                        new_line_number=new_line_cursor,
                    )
                )
                new_line_cursor += 1
                curr_file.additions += 1
            elif line.startswith("-") and not line.startswith("---"):
                curr_hunk.lines.append(
                    DiffLine(
                        line_type=DiffLineType.DELETE,
                        content=line[1:],
                        old_line_number=old_line_cursor,
                        new_line_number=None,
                    )
                )
                old_line_cursor += 1
                curr_file.deletions += 1
            elif line.startswith(" ") or line == "":
                content = line[1:] if line.startswith(" ") else ""
                curr_hunk.lines.append(
                    DiffLine(
                        line_type=DiffLineType.CONTEXT,
                        content=content,
                        old_line_number=old_line_cursor,
                        new_line_number=new_line_cursor,
                    )
                )
                old_line_cursor += 1
                new_line_cursor += 1

        i += 1

    # Append remaining hunk and file
    if curr_file and curr_hunk:
        curr_file.hunks.append(curr_hunk)
    if curr_file:
        files.append(curr_file)

    total_adds = sum(f.additions for f in files)
    total_dels = sum(f.deletions for f in files)

    return ParsedDiff(
        files=files,
        total_additions=total_adds,
        total_deletions=total_dels,
        total_files=len(files),
    )
