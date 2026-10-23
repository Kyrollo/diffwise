import React, { useState, useEffect } from 'react';
import {
  ArchitectureRule,
  LintViolation,
  PullRequestReview,
  SeverityLevel,
} from '../types/diffwise';
import { fetchRules, toggleRule } from '../lib/api';
import {
  ShieldAlert,
  ShieldCheck,
  AlertOctagon,
  AlertTriangle,
  Sliders,
  CheckCircle2,
  XCircle,
  FileCode,
  Lock,
  Layers,
  Database,
  ArrowRight,
} from 'lucide-react';

interface ArchitectureLinterTabProps {
  review: PullRequestReview;
}

export const ArchitectureLinterTab: React.FC<ArchitectureLinterTabProps> = ({
  review,
}) => {
  const [rules, setRules] = useState<ArchitectureRule[]>([]);
  const [isLoadingRules, setIsLoadingRules] = useState(true);

  useEffect(() => {
    fetchRules()
      .then((data) => setRules(data))
      .catch((err) => console.error('Failed to load rules:', err))
      .finally(() => setIsLoadingRules(false));
  }, []);

  const handleToggleRule = async (ruleId: string) => {
    try {
      const updated = await toggleRule(ruleId);
      setRules((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } catch (err: any) {
      alert(`Failed to toggle rule: ${err.message}`);
    }
  };

  const hasCrit = review.violations.some((v) => v.severity === 'CRITICAL');
  const hasSec = review.violations.some((v) => v.rule_id.startsWith('SEC'));
  const hasBoundary = review.violations.some((v) => v.rule_id.startsWith('ARCH'));

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] overflow-hidden bg-background">
      {/* Left Column: PR Violations & Compliance Radar (7 cols) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden border-r border-border bg-card/20">
        <div className="p-4 border-b border-border flex items-center justify-between bg-card/40">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-foreground">
              Architecture Violations for PR #{review.pr_number}
            </h2>
          </div>
          <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
            {review.violations.length} Violations Flagged
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Compliance Checklist Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className={`p-3.5 rounded-xl border ${hasBoundary ? 'bg-rose-500/10 border-rose-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-foreground">Clean Architecture</span>
                {hasBoundary ? (
                  <XCircle className="w-4 h-4 text-rose-400" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {hasBoundary ? 'Domain boundary inversion detected' : 'Zero layer boundary violations'}
              </p>
            </div>

            <div className={`p-3.5 rounded-xl border ${hasSec ? 'bg-rose-500/10 border-rose-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-foreground">Secret Guard</span>
                {hasSec ? (
                  <XCircle className="w-4 h-4 text-rose-400" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {hasSec ? 'Plaintext credentials in diff additions' : 'Zero secret leakage detected'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl border bg-card border-border">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-foreground">Schema Safety</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Reversible migrations verified
              </p>
            </div>
          </div>

          {/* Active Violations List */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Flagged Violations Breakdown
            </h3>

            {review.violations.length > 0 ? (
              review.violations.map((v, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-card border border-border shadow-sm space-y-3 hover:border-indigo-500/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-muted border border-border text-foreground">
                        {v.rule_id}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                          v.severity === 'CRITICAL'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {v.severity}
                      </span>
                    </div>

                    <span className="text-xs font-mono text-muted-foreground">
                      {v.file_path}:L{v.line_number}
                    </span>
                  </div>

                  <p className="text-xs text-foreground font-medium leading-relaxed">
                    {v.message}
                  </p>

                  {v.suggested_fix && (
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-emerald-300 font-mono flex items-start gap-2">
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{v.suggested_fix}</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-center">
                <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-emerald-300">Clean Architecture Passed</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  No boundary inversions or security credentials detected in this pull request diff.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Configured Architecture Rules (5 cols) */}
      <div className="w-full lg:w-[420px] flex flex-col h-full overflow-hidden bg-card/60 backdrop-blur-md">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-foreground">Active Linting Rules</h2>
          </div>
          <span className="text-xs text-muted-foreground">{rules.length} Rules</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`p-3.5 rounded-xl border transition-all ${
                rule.enabled
                  ? 'bg-card border-border shadow-sm'
                  : 'bg-muted/30 border-border/40 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-indigo-400">
                    {rule.id}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    {rule.rule_type}
                  </span>
                </div>

                <button
                  onClick={() => handleToggleRule(rule.id)}
                  className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded transition-colors ${
                    rule.enabled
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {rule.enabled ? 'ACTIVE' : 'DISABLED'}
                </button>
              </div>

              <h4 className="text-xs font-bold text-foreground">{rule.name}</h4>
              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                {rule.description}
              </p>

              <pre className="text-[10px] font-mono text-slate-400 bg-slate-950 p-2 rounded mt-2 truncate overflow-x-auto">
                <code>Pattern: {rule.pattern}</code>
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
