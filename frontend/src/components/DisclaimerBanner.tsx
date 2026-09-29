import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  return (
    <div className="bg-slate-900 border-b border-amber-500/30 text-xs px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-slate-300">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold uppercase tracking-wider text-[10px] border border-amber-500/30">
          <AlertTriangle className="w-3 h-3 text-amber-400" />
          Synthetic Demo Data / Research Prototype
        </span>
        <span className="hidden md:inline text-slate-400">
          A prediction is not an observed physical failure. Prototype thresholds are demonstration engineering policies, not certified ISRO specifications.
        </span>
      </div>
      <div className="flex items-center gap-3 text-slate-400">
        <span className="inline-flex items-center gap-1 text-[11px] text-cyan-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          No Future Leakage Enforced (≤24h Features)
        </span>
        <span className="hidden lg:inline text-slate-500">|</span>
        <span className="hidden lg:inline text-slate-400 text-[11px]">
          Conformal 90% Marginal Interval
        </span>
      </div>
    </div>
  );
};
