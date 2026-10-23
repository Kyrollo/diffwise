import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { DiffReviewerTab } from './components/DiffReviewerTab';
import { ArchitectureLinterTab } from './components/ArchitectureLinterTab';
import { LiveReviewLabTab } from './components/LiveReviewLabTab';
import { fetchReviews, overrideMergeStatus } from './lib/api';
import { MergeStatus, PullRequestReview } from './types/diffwise';
import { FileUploadZone } from './components/FileUploadZone';
import {
  GitPullRequest,
  ShieldAlert,
  Play,
  Loader2,
  AlertTriangle,
  X,
  CheckCircle2,
  FolderUp,
} from 'lucide-react';

export default function App() {
  const [reviews, setReviews] = useState<PullRequestReview[]>([]);
  const [selectedReviewId, setSelectedReviewId] = useState<string>('pr-101');
  const [activeTab, setActiveTab] = useState<'diff' | 'linter' | 'lab' | 'uploads'>('diff');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Override Modal State
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [overrideStatus, setOverrideStatus] = useState<MergeStatus>('APPROVED');
  const [overrideJustification, setOverrideJustification] = useState('');
  const [isSubmittingOverride, setIsSubmittingOverride] = useState(false);

  const loadReviews = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchReviews();
      setReviews(data);
      if (data.length > 0 && !data.some((r) => r.id === selectedReviewId)) {
        setSelectedReviewId(data[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load pull request reviews');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const currentReview = reviews.find((r) => r.id === selectedReviewId) || reviews[0] || null;

  const handleReviewCreated = (newReview: PullRequestReview) => {
    setReviews((prev) => [newReview, ...prev]);
    setSelectedReviewId(newReview.id);
    setActiveTab('diff');
  };

  const handleSubmitOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentReview || !overrideJustification.trim()) return;

    setIsSubmittingOverride(true);
    try {
      const updated = await overrideMergeStatus(
        currentReview.id,
        overrideStatus,
        overrideJustification.trim()
      );
      setReviews((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setIsOverrideModalOpen(false);
      setOverrideJustification('');
    } catch (err: any) {
      alert(`Override failed: ${err.message}`);
    } finally {
      setIsSubmittingOverride(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      <Header
        currentReview={currentReview}
        reviews={reviews}
        onSelectReview={(id) => setSelectedReviewId(id)}
        onOpenOverrideModal={() => setIsOverrideModalOpen(true)}
      />

      {/* Tab Navigation */}
      <div className="border-b border-border bg-card/40 px-6">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('diff')}
            className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'diff'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <GitPullRequest className="w-4 h-4" />
            <span>Semantic Diff Reviewer</span>
          </button>

          <button
            onClick={() => setActiveTab('linter')}
            className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'linter'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Architecture & Security Linter</span>
          </button>

          <button
            onClick={() => setActiveTab('lab')}
            className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'lab'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>Live Review Lab</span>
          </button>

          <button
            onClick={() => setActiveTab('uploads')}
            className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'uploads'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <FolderUp className="w-4 h-4" />
            <span>Diff & Patch Upload</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="h-[calc(100vh-140px)] flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            <p className="text-xs text-muted-foreground font-mono">
              Loading PR reviews and git diff AST hunks...
            </p>
          </div>
        ) : error ? (
          <div className="h-[calc(100vh-140px)] flex flex-col items-center justify-center p-6 text-center">
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 max-w-md">
              <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
              <h3 className="text-sm font-semibold">Review Service Failure</h3>
              <p className="text-xs mt-1 font-mono text-rose-300">{error}</p>
              <button
                onClick={loadReviews}
                className="mt-3 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'diff' && currentReview && <DiffReviewerTab review={currentReview} />}
            {activeTab === 'linter' && currentReview && <ArchitectureLinterTab review={currentReview} />}
            {activeTab === 'lab' && <LiveReviewLabTab onReviewCreated={handleReviewCreated} />}
            {activeTab === 'uploads' && (
              <div className="p-6 max-w-5xl mx-auto space-y-4 overflow-y-auto max-h-[calc(100vh-140px)]">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Git Diff & Patch File Upload</h3>
                  <p className="text-xs text-muted-foreground">
                    Upload raw unified diff files (.diff, .patch) or code files to automatically extract changed hunks and execute principal architect code review.
                  </p>
                </div>
                <FileUploadZone
                  apiBaseUrl="/api/v1"
                  allowedExtensions={['.diff', '.patch', '.txt', '.py', '.ts', '.js', '.json']}
                  acceptedFormatsText="Unified Diff (.diff / .patch), Source Code (.py, .ts, .js), TXT"
                  onFileProcessed={() => {
                    loadReviews();
                  }}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* Architect Override Modal */}
      {isOverrideModalOpen && currentReview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">
                Architect Manual Signoff Override
              </h3>
              <button
                onClick={() => setIsOverrideModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Override automated gate decision for{' '}
              <strong className="text-foreground">PR #{currentReview.pr_number}</strong>.
            </p>

            <form onSubmit={handleSubmitOverride} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Target Merge Gate Status
                </label>
                <select
                  value={overrideStatus}
                  onChange={(e) => setOverrideStatus(e.target.value as MergeStatus)}
                  className="w-full text-xs py-2 px-3 bg-muted/80 border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                >
                  <option value="APPROVED">APPROVED (Force Unblock)</option>
                  <option value="BLOCKED">BLOCKED (Hard Gate)</option>
                  <option value="NEEDS_REVISION">NEEDS_REVISION</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Architectural Justification
                </label>
                <textarea
                  value={overrideJustification}
                  onChange={(e) => setOverrideJustification(e.target.value)}
                  placeholder="State the technical reason, sandbox exception, or mitigated risk..."
                  className="w-full h-24 p-3 text-xs bg-muted/80 border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none font-sans"
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOverrideModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingOverride || !overrideJustification.trim()}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-50"
                >
                  {isSubmittingOverride ? 'Applying...' : 'Confirm Override'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
