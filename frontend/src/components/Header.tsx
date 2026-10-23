import React from 'react';
import {
  GitPullRequest,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Cpu,
  Layers,
  Sparkles,
} from 'lucide-react';
import { MergeStatus, PullRequestReview } from '../types/diffwise';

interface HeaderProps {
  currentReview: PullRequestReview | null;
  reviews: PullRequestReview[];
  onSelectReview: (reviewId: string) => void;
  onOpenOverrideModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentReview,
  reviews,
  onSelectReview,
  onOpenOverrideModal,
}) => {
  const getMergeStatusBadge = (status?: MergeStatus) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>APPROVED</span>
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 shadow-sm shadow-rose-500/20 animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>BLOCKED</span>
          </span>
        );
      case 'NEEDS_REVISION':
      default:
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm shadow-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>NEEDS REVISION</span>
          </span>
        );
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 70) return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    if (score >= 40) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  };

  return (
    <header className="border-b border-border bg-card/60 backdrop-blur-md px-6 py-4 sticky top-0 z-40">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold text-lg">
            DW
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                DiffWise
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium font-mono">
                v1.0.0
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Semantic Pull Request Reviewer & Architecture Linter
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* PR Selector Dropdown */}
          <select
            value={currentReview?.id || ''}
            onChange={(e) => onSelectReview(e.target.value)}
            className="text-xs py-1.5 px-3 bg-muted/80 border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
          >
            {reviews.map((r) => (
              <option key={r.id} value={r.id}>
                PR #{r.pr_number}: {r.title.slice(0, 40)}...
              </option>
            ))}
          </select>

          {/* Merge Gate Status */}
          {currentReview && getMergeStatusBadge(currentReview.merge_status)}

          {/* Risk Score Pill */}
          {currentReview && (
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono font-bold ${getRiskScoreColor(
                currentReview.risk_score
              )}`}
            >
              <span>Risk:</span>
              <span>{currentReview.risk_score}/100</span>
            </div>
          )}

          {/* Local GPU Telemetry Tag */}
          <div className="flex items-center gap-1.5 bg-muted/60 px-3 py-1 rounded-lg border border-border text-xs text-emerald-400 font-medium">
            <Cpu className="w-3.5 h-3.5" />
            <span>Dedicated NVIDIA GPU</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>

          {/* Human Architect Override Button */}
          {currentReview && (
            <button
              onClick={onOpenOverrideModal}
              className="px-3 py-1 text-xs font-medium rounded-lg bg-muted hover:bg-muted/80 border border-border text-foreground transition-colors"
            >
              Architect Signoff
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
