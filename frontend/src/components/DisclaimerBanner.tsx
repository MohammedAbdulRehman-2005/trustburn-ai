import React from 'react';
import { AlertTriangle, ShieldCheck, Info } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  return (
    <div
      className="bg-slate-900 border-b border-amber-500/30 text-xs px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-slate-300"
      title="This prototype demonstrates the SIH26170 screening methodology using controlled synthetic burn-in trajectories. It is not trained or validated on proprietary ISRO qualification data."
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold uppercase tracking-wider text-[10px] border border-amber-500/30">
          <AlertTriangle className="w-3 h-3 text-amber-400" />
          DEMO DATA — CONTROLLED SYNTHETIC BURN-IN BENCHMARK • RESEARCH PROTOTYPE
        </span>
        <span className="hidden md:inline text-slate-400 text-[11px]">
          Demonstrating SIH26170 screening workflow using controlled synthetic trajectories. A prediction is an uncertainty-aware forecast, not an observed physical failure.
        </span>
      </div>
      <div className="flex items-center gap-3 text-slate-400">
        <span className="inline-flex items-center gap-1 text-[11px] text-cyan-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          Zero Future Leakage (≤24h Features)
        </span>
        <span className="hidden lg:inline text-slate-500">|</span>
        <span className="hidden lg:inline text-slate-400 text-[11px]">
          90% Split-Conformal Marginal Interval
        </span>
      </div>
    </div>
  );
};
