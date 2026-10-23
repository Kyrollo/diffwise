export type SeverityLevel = 'CRITICAL' | 'WARNING' | 'INFO';

export type MergeStatus = 'APPROVED' | 'BLOCKED' | 'NEEDS_REVISION';

export type RuleType = 'BOUNDARY' | 'SECURITY' | 'SCHEMA' | 'COMPLEXITY';

export type DiffLineType = 'ADD' | 'DELETE' | 'CONTEXT';

export interface DiffLine {
  line_type: DiffLineType;
  content: string;
  old_line_number?: number | null;
  new_line_number?: number | null;
}

export interface DiffHunk {
  header: string;
  old_start: number;
  old_lines: number;
  new_start: number;
  new_lines: number;
  lines: DiffLine[];
}

export interface DiffFile {
  old_path: string;
  new_path: string;
  status: string;
  additions: number;
  deletions: number;
  hunks: DiffHunk[];
}

export interface LintViolation {
  rule_id: string;
  file_path: string;
  line_number: number;
  severity: SeverityLevel;
  message: string;
  suggested_fix?: string | null;
}

export interface InlineReviewComment {
  id: string;
  file_path: string;
  line_number: number;
  severity: SeverityLevel;
  title: string;
  comment: string;
  code_suggestion?: string | null;
}

export interface ArchitectureRule {
  id: string;
  name: string;
  description: string;
  rule_type: RuleType;
  pattern: string;
  severity: SeverityLevel;
  enabled: boolean;
}

export interface PullRequestReview {
  id: string;
  pr_number: number;
  title: string;
  author: string;
  base_branch: string;
  head_branch: string;
  risk_score: number;
  merge_status: MergeStatus;
  summary: string;
  files: DiffFile[];
  violations: LintViolation[];
  comments: InlineReviewComment[];
  latency_ms: number;
  reviewed_at: string;
  model: string;
}

export interface DiffReviewRequest {
  title: string;
  author?: string;
  base_branch?: string;
  head_branch?: string;
  diff_text: string;
  pr_number?: number;
  model?: string;
}
