import React, { useState } from 'react';
import {
  DiffFile,
  DiffLine,
  DiffLineType,
  InlineReviewComment,
  PullRequestReview,
  SeverityLevel,
} from '../types/diffwise';
import {
  FileCode,
  GitCommit,
  GitBranch,
  User,
  Clock,
  Sparkles,
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle2,
  Terminal,
} from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';

interface DiffReviewerTabProps {
  review: PullRequestReview;
}

export const DiffReviewerTab: React.FC<DiffReviewerTabProps> = ({ review }) => {
  const [selectedFileIdx, setSelectedFileIdx] = useState<number>(0);
  const activeFile: DiffFile | undefined = review.files[selectedFileIdx] || review.files[0];

  const commentsByLine = React.useMemo(() => {
    const map: Record<number, InlineReviewComment[]> = {};
    if (!activeFile) return map;
    review.comments.forEach((c) => {
      if (c.file_path === activeFile.new_path || c.file_path === activeFile.old_path) {
        if (!map[c.line_number]) map[c.line_number] = [];
        map[c.line_number].push(c);
      }
    });
    return map;
  }, [review.comments, activeFile]);

  const getSeverityBadge = (sev: SeverityLevel) => {
    switch (sev) {
      case 'CRITICAL':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase font-mono">
            <AlertOctagon className="w-3 h-3 text-rose-400" />
            <span>CRITICAL</span>
          </span>
        );
      case 'WARNING':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase font-mono">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span>WARNING</span>
          </span>
        );
      case 'INFO':
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 uppercase font-mono">
            <Info className="w-3 h-3 text-blue-400" />
            <span>INFO</span>
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] overflow-hidden bg-background">
      {/* Left Sidebar: Changed Files & PR Meta (320px) */}
      <div className="w-full lg:w-80 border-r border-border bg-card/40 flex flex-col h-full overflow-hidden">
        {/* PR Meta Box */}
        <div className="p-4 border-b border-border space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-mono text-indigo-400">
            <GitBranch className="w-3.5 h-3.5" />
            <span className="truncate">{review.head_branch}</span>
            <span className="text-muted-foreground">→</span>
            <span className="text-muted-foreground">{review.base_branch}</span>
          </div>

          <h2 className="text-sm font-bold text-foreground leading-snug">
            {review.title}
          </h2>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 truncate">
              <User className="w-3 h-3 text-muted-foreground" />
              <span className="truncate">{review.author}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-mono shrink-0">
              <Clock className="w-3 h-3 text-emerald-400" />
              <span>{review.latency_ms}ms</span>
            </div>
          </div>
        </div>

        {/* Changed Files Navigation */}
        <div className="p-3 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
          <span>Files Changed ({review.files.length})</span>
          <span className="text-[11px] font-mono text-emerald-400">
            +{review.files.reduce((acc, f) => acc + f.additions, 0)} / -
            {review.files.reduce((acc, f) => acc + f.deletions, 0)}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {review.files.map((file, idx) => {
            const isSelected = idx === selectedFileIdx;
            const fileCommentsCount = review.comments.filter(
              (c) => c.file_path === file.new_path || c.file_path === file.old_path
            ).length;

            return (
              <button
                key={file.new_path}
                onClick={() => setSelectedFileIdx(idx)}
                className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all flex flex-col gap-1 ${
                  isSelected
                    ? 'bg-indigo-500/10 border-indigo-500/40 text-foreground shadow-sm'
                    : 'bg-card/40 border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2 truncate">
                    <FileCode className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-indigo-400' : 'text-muted-foreground'}`} />
                    <span className="font-mono text-xs truncate">{file.new_path}</span>
                  </div>
                  {fileCommentsCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {fileCommentsCount}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-muted-foreground capitalize">{file.status}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-400 font-semibold">+{file.additions}</span>
                    <span className="text-rose-400 font-semibold">-{file.deletions}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Diff Viewer & Inline Comments Canvas */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
        {/* AI Executive Summary Banner */}
        <div className="p-4 border-b border-border bg-card/60 backdrop-blur flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                Automated Principal Architect Review
              </h3>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                Model: {review.model}
              </span>
            </div>
            <MarkdownRenderer content={review.summary} defaultMaxHeight="max-h-[350px]" className="mt-1" />
          </div>
        </div>

        {/* Diff Canvas Header */}
        {activeFile && (
          <div className="px-4 py-2.5 border-b border-border bg-muted/40 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-mono">
              <span className="font-semibold text-foreground">{activeFile.new_path}</span>
              <span className="text-muted-foreground text-[11px] px-2 py-0.5 rounded bg-muted border border-border">
                {activeFile.status}
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="text-emerald-400 font-bold">+{activeFile.additions}</span>
              <span className="text-rose-400 font-bold">-{activeFile.deletions}</span>
            </div>
          </div>
        )}

        {/* Diff Lines Table */}
        <div className="flex-1 overflow-auto bg-slate-950 font-mono text-xs select-text">
          {activeFile ? (
            <div className="min-w-full divide-y divide-slate-900/50">
              {activeFile.hunks.map((hunk, hIdx) => (
                <div key={hIdx}>
                  {/* Hunk Header */}
                  <div className="bg-slate-900/90 text-cyan-400/80 px-4 py-1 text-[11px] font-mono border-y border-slate-800">
                    {hunk.header}
                  </div>

                  {/* Lines */}
                  {hunk.lines.map((line, lIdx) => {
                    const isAdd = line.line_type === 'ADD';
                    const isDel = line.line_type === 'DELETE';
                    const lineComments = line.new_line_number
                      ? commentsByLine[line.new_line_number]
                      : [];

                    return (
                      <React.Fragment key={lIdx}>
                        <div
                          className={`flex items-start transition-colors leading-6 ${
                            isAdd
                              ? 'bg-emerald-950/30 hover:bg-emerald-950/50 text-emerald-200'
                              : isDel
                              ? 'bg-rose-950/30 hover:bg-rose-950/50 text-rose-200'
                              : 'hover:bg-slate-900/60 text-slate-300'
                          }`}
                        >
                          {/* Old Line Number */}
                          <div className="w-12 py-0.5 text-right pr-3 select-none text-slate-600 border-r border-slate-900 shrink-0 font-mono text-[11px]">
                            {line.old_line_number || ''}
                          </div>

                          {/* New Line Number */}
                          <div className="w-12 py-0.5 text-right pr-3 select-none text-slate-600 border-r border-slate-900 shrink-0 font-mono text-[11px]">
                            {line.new_line_number || ''}
                          </div>

                          {/* Marker (+, -, space) */}
                          <div className="w-6 py-0.5 text-center select-none shrink-0 font-bold">
                            {isAdd ? '+' : isDel ? '-' : ' '}
                          </div>

                          {/* Code Content */}
                          <div className="flex-1 py-0.5 pr-4 whitespace-pre overflow-x-auto">
                            {line.content}
                          </div>
                        </div>

                        {/* Inline AI Review Comments anchored directly to this line */}
                        {lineComments &&
                          lineComments.map((comm) => (
                            <div
                              key={comm.id}
                              className="mx-6 my-2 p-3.5 rounded-xl bg-slate-900/95 border border-indigo-500/40 shadow-xl space-y-2.5"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {getSeverityBadge(comm.severity)}
                                  <h4 className="text-xs font-bold text-foreground font-sans">
                                    {comm.title}
                                  </h4>
                                </div>
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  Line {comm.line_number}
                                </span>
                              </div>

                              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                                {comm.comment}
                              </p>

                              {comm.code_suggestion && (
                                <div className="space-y-1">
                                  <span className="text-[10px] font-mono text-cyan-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                                    <Terminal className="w-3 h-3" />
                                    <span>Suggested Refactor:</span>
                                  </span>
                                  <pre className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto">
                                    <code>{comm.code_suggestion}</code>
                                  </pre>
                                </div>
                              )}
                            </div>
                          ))}
                      </React.Fragment>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              Select a file to inspect diff.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
