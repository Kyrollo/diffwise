import React, { useState } from 'react';
import {
  PullRequestReview,
} from '../types/diffwise';
import { submitDiffReview } from '../lib/api';
import {
  Play,
  FileCode,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Cpu,
  Clock,
  Terminal,
  Zap,
} from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';

interface LiveReviewLabTabProps {
  onReviewCreated: (review: PullRequestReview) => void;
}

const PRESET_DIFFS = [
  {
    name: 'Stripe Secret & Domain Boundary Inversion (Risky)',
    title: 'feat(billing): introduce recurring Stripe subscriptions',
    diff: `diff --git a/services/billing_service.py b/services/billing_service.py
@@ -24,4 +24,10 @@ async def charge_customer(user_id: str, amount: int):
+    # Plaintext API credential
+    stripe_api_key = 'mock_secret_key_testing_12345'
+    client = StripeClient(api_key=stripe_key)
+    query = f"SELECT * FROM subscriptions WHERE user_id = {user_id}"
+    return await client.charge(amount)
diff --git a/domain/subscription.py b/domain/subscription.py
@@ -1,3 +1,5 @@
+from src.api.routes import router
 class SubscriptionModel:
     id: str`,
  },
  {
    name: 'Token Store Decoupling (Clean Refactor)',
    title: 'refactor(auth): decouple session tokens from redis pool',
    diff: `diff --git a/auth/session_manager.py b/auth/session_manager.py
@@ -10,4 +10,12 @@ class SessionManager:
+    def __init__(self, token_store: TokenStoreInterface):
+        self.token_store = token_store
+    async def invalidate(self, jti: str):
+        return await self.token_store.revoke(jti)`,
  },
  {
    name: 'Destructive Schema Migration (Critical DDL)',
    title: 'migration(db): drop legacy billing columns',
    diff: `diff --git a/alembic/versions/drop_legacy.py b/alembic/versions/drop_legacy.py
@@ -15,3 +15,6 @@ def upgrade():
+    op.drop_column('users', 'legacy_stripe_id')
+    op.drop_table('deprecated_audit_logs')`,
  },
];

export const LiveReviewLabTab: React.FC<LiveReviewLabTabProps> = ({
  onReviewCreated,
}) => {
  const [title, setTitle] = useState(PRESET_DIFFS[0].title);
  const [diffText, setDiffText] = useState(PRESET_DIFFS[0].diff);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PullRequestReview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelectPreset = (preset: typeof PRESET_DIFFS[0]) => {
    setTitle(preset.title);
    setDiffText(preset.diff);
    setResult(null);
    setError(null);
  };

  const handleRunReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diffText.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const rev = await submitDiffReview({
        title,
        author: 'engineer@antigravity.io',
        base_branch: 'main',
        head_branch: 'feature/workbench-test',
        diff_text: diffText,
        model: 'qwen2.5:0.5b',
      });
      setResult(rev);
      onReviewCreated(rev);
    } catch (err: any) {
      setError(err.message || 'Review execution failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] overflow-hidden bg-background">
      {/* Left Column: Diff Input & Configuration (6 cols) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden border-r border-border bg-card/20">
        <div className="p-4 border-b border-border flex items-center justify-between bg-card/40">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-foreground">
              Live PR Review Lab
            </h2>
          </div>
          <span className="text-xs text-muted-foreground">Local GPU Inference Pipeline</span>
        </div>

        <form onSubmit={handleRunReview} className="flex-1 flex flex-col p-4 gap-3 overflow-hidden">
          {/* Preset Buttons */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
              Select Sample Enterprise PR Diff:
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_DIFFS.map((p, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleSelectPreset(p)}
                  className={`text-[11px] px-3 py-1.5 rounded-lg border font-medium transition-colors text-left truncate ${
                    title === p.title
                      ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300'
                      : 'bg-muted/60 border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Title input */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              Pull Request Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs font-mono py-2 px-3 bg-muted/80 border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Git Diff Text Area */}
          <div className="flex-1 flex flex-col min-h-0">
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              Unified Git Diff
            </label>
            <textarea
              value={diffText}
              onChange={(e) => setDiffText(e.target.value)}
              className="flex-1 w-full p-3 bg-slate-950 border border-border rounded-xl font-mono text-xs text-cyan-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none leading-relaxed"
              placeholder="Paste unified git diff here (diff --git a/... b/...)"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !diffText.trim()}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-indigo-600/20"
          >
            {isLoading ? (
              <>
                <Zap className="w-4 h-4 animate-spin text-indigo-200" />
                <span>Running Architecture & GPU Review...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Review Pull Request</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Right Column: Live Analysis Output (6 cols) */}
      <div className="w-full lg:w-[480px] flex flex-col h-full overflow-hidden bg-card/60 backdrop-blur-md">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-foreground">Review Result</h2>
          </div>
          {result && (
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="flex items-center gap-1 text-emerald-400">
                <Clock className="w-3.5 h-3.5" />
                {result.latency_ms}ms
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono">
              {error}
            </div>
          )}

          {result ? (
            <div className="space-y-4">
              {/* Status & Risk Header */}
              <div className="p-4 rounded-xl bg-card border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Merge Gate
                  </span>
                  <span
                    className={`text-xs font-bold font-mono px-2.5 py-0.5 rounded-full border ${
                      result.merge_status === 'APPROVED'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {result.merge_status}
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black font-mono text-foreground">
                    {result.risk_score}/100
                  </span>
                  <span className="text-xs text-muted-foreground">Risk Assessment Score</span>
                </div>
              </div>

              {/* Summary */}
              <div className="p-4 rounded-xl bg-card border border-border space-y-2">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  Executive Architecture Review
                </h4>
                <MarkdownRenderer content={result.summary} defaultMaxHeight="max-h-[420px]" />
              </div>

              {/* Violations Flagged */}
              {result.violations.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Violations Flagged ({result.violations.length})</span>
                  </h4>
                  {result.violations.map((v, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg bg-slate-950 border border-border text-xs font-mono space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-rose-400 font-bold">{v.rule_id}</span>
                        <span className="text-muted-foreground">{v.file_path}:L{v.line_number}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 font-sans">{v.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <Sparkles className="w-10 h-10 text-indigo-500/40 mb-3" />
              <p className="text-xs">No active review output.</p>
              <p className="text-[11px] text-muted-foreground/70 mt-1">
                Select a preset diff or paste your own code diff to run local GPU analysis.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
