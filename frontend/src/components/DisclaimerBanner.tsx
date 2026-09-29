import React from 'react';
import { Cpu, ShieldCheck } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  return (
    <div
      className="bg-slate-950 border-b border-cyan-500/20 text-xs px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-slate-300 shadow-sm"
      title="High-Reliability Component Screening & Risk Intelligence Architecture"
    >
      <div className="flex items-center gap-2.5">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 font-semibold uppercase tracking-wider text-[10px] border border-cyan-700/50">
          <Cpu className="w-3 h-3 text-cyan-400" />
          AEROSPACE & HIGH-RELIABILITY SCREENING INTELLIGENCE
        </span>
        <span className="hidden md:inline text-slate-400 text-[11px]">
          Uncertainty-aware early drift forecasting & dynamic lot-relative screening for mission-critical semiconductor components.
        </span>
      </div>
      <div className="flex items-center gap-3 text-slate-400">
        <span className="inline-flex items-center gap-1.5 text-[11px] text-cyan-400">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          Zero-Leakage Architecture (≤24h Features)
        </span>
        <span className="hidden lg:inline text-slate-600">|</span>
        <span className="hidden lg:inline text-slate-300 text-[11px]">
          90% Calibrated Conformal Prediction Intervals
        </span>
      </div>
    </div>
  );
};
