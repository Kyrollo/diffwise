import {
  ArchitectureRule,
  DiffReviewRequest,
  MergeStatus,
  PullRequestReview,
} from '../types/diffwise';

const API_BASE = '/api/v1';

export async function fetchReviews(): Promise<PullRequestReview[]> {
  const res = await fetch(`${API_BASE}/reviews`);
  if (!res.ok) throw new Error(`Failed to fetch PR reviews: ${res.statusText}`);
  return res.json();
}

export async function fetchReview(reviewId: string): Promise<PullRequestReview> {
  const res = await fetch(`${API_BASE}/reviews/${reviewId}`);
  if (!res.ok) throw new Error(`Failed to fetch review ${reviewId}: ${res.statusText}`);
  return res.json();
}

export async function submitDiffReview(
  req: DiffReviewRequest
): Promise<PullRequestReview> {
  const res = await fetch(`${API_BASE}/reviews/diff`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message =
      errorData.detail?.detail || errorData.detail || `Review execution failed (${res.status})`;
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
  }
  return res.json();
}

export async function overrideMergeStatus(
  reviewId: string,
  status: MergeStatus,
  justification: string
): Promise<PullRequestReview> {
  const res = await fetch(`${API_BASE}/reviews/${reviewId}/override`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, justification }),
  });
  if (!res.ok) throw new Error(`Failed to override review: ${res.statusText}`);
  return res.json();
}

export async function fetchRules(): Promise<ArchitectureRule[]> {
  const res = await fetch(`${API_BASE}/rules`);
  if (!res.ok) throw new Error(`Failed to fetch architecture rules: ${res.statusText}`);
  return res.json();
}

export async function toggleRule(ruleId: string): Promise<ArchitectureRule> {
  const res = await fetch(`${API_BASE}/rules/${ruleId}/toggle`, {
    method: 'PUT',
  });
  if (!res.ok) throw new Error(`Failed to toggle rule ${ruleId}: ${res.statusText}`);
  return res.json();
}
