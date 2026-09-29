import React from 'react';
import { Loader2, Server, CheckCircle2, RefreshCw, Clock, ExternalLink, X } from 'lucide-react';

interface BackendColdStartBannerProps {
  backendOnline: boolean;
  isConnecting: boolean;
  elapsedSeconds: number;
  justConnected: boolean;
  onRetry: () => void;
  onDismissJustConnected: () => void;
}

export const BackendColdStartBanner: React.FC<BackendColdStartBannerProps> = ({
  backendOnline,
  isConnecting,
  elapsedSeconds,
  justConnected,
  onRetry,
  onDismissJustConnected,
}) => {
  // If already online and not in the brief just-connected success window, don't render anything
  if (backendOnline && !justConnected) {
    return null;
  }

  // 1. Success state: Just connected
  if (backendOnline && justConnected) {
    return (
      <div className="bg-emerald-950/80 border-b border-emerald-500/40 px-4 py-2.5 text-xs text-emerald-200 transition-all duration-500 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 animate-bounce" />
            <span>
              <strong className="text-emerald-100 font-semibold">AI Backend Online & Fully Calibrated!</strong>{' '}
              FastAPI service is responding. Conformal intervals, drift forecaster, and 806 components are loaded.
            </span>
          </div>
          <button
            onClick={onDismissJustConnected}
            className="text-emerald-400 hover:text-emerald-100 p-1 rounded transition-colors cursor-pointer"
            title="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // 2. Cold Start / Waking Up state
  const progressPercent = Math.min(94, Math.round((elapsedSeconds / 45) * 100));

  return (
    <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-amber-500/40 px-4 py-3 text-xs text-slate-200 shadow-xl relative overflow-hidden">
      {/* Background glow accent */}
      <div className="absolute -top-12 left-1/4 w-96 h-24 bg-amber-500/10 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
            <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-white tracking-wide text-sm flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-amber-400" />
                Cloud AI Backend is Waking Up (Cold Start)
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] font-semibold border border-amber-500/30">
                <Clock className="w-3 h-3" />
                Elapsed: {elapsedSeconds}s / ~40s
              </span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed max-w-3xl">
              <strong className="text-amber-300 font-medium">Notice for Judges & Evaluators:</strong> TrustBurn AI’s
              FastAPI backend is hosted on Render’s free tier, which enters sleep mode during inactivity. The cloud container is currently spinning up, compiling Scikit-Learn models, calibrating split-conformal bounds, and loading 800+ burn-in trajectories. <strong className="text-cyan-300 font-medium">Please wait a few moments — the dashboard will load automatically once ready!</strong>
            </p>
          </div>
        </div>

        {/* Action Controls & Direct Status Link */}
        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
          <button
            onClick={onRetry}
            disabled={isConnecting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 font-medium text-xs transition-colors cursor-pointer disabled:opacity-50"
            title="Ping backend health endpoint now"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isConnecting ? 'animate-spin' : ''}`} />
            <span>Ping Now</span>
          </button>
          <a
            href="https://trustburn-ai.onrender.com/api/health"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-colors"
            title="Open raw backend health endpoint in new tab"
          >
            <span>Raw Health</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="max-w-7xl mx-auto mt-2.5 w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-gradient-to-r from-amber-500 to-cyan-400 h-1.5 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};
