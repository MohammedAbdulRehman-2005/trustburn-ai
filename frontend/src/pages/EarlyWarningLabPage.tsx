import React, { useState, useEffect } from 'react';
import {
  Microscope,
  Play,
  Eye,
  CheckCircle,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  Clock,
  ArrowRight,
  Loader2,
  Lock,
  Unlock
} from 'lucide-react';
import { api } from '../api/client';
import { ComponentListItem } from '../types/burnin';

interface EarlyWarningLabPageProps {
  initialComponentId?: string;
  onSelectComponent: (componentId: string) => void;
}

export const EarlyWarningLabPage: React.FC<EarlyWarningLabPageProps> = ({
  initialComponentId = 'CMP-DEMO-EARLY-DRIFT',
  onSelectComponent
}) => {
  const [componentId, setComponentId] = useState<string>(initialComponentId);
  const [componentList, setComponentList] = useState<ComponentListItem[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [earlyResult, setEarlyResult] = useState<any | null>(null);

  const [isRevealing, setIsRevealing] = useState<boolean>(false);
  const [heldOutResult, setHeldOutResult] = useState<any | null>(null);

  useEffect(() => {
    api.getComponents({ limit: 100 }).then((res) => {
      setComponentList(res.items);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (initialComponentId) {
      setComponentId(initialComponentId);
      setEarlyResult(null);
      setHeldOutResult(null);
    }
  }, [initialComponentId]);

  const handleAnalyze = async () => {
    if (!componentId) return;
    setIsAnalyzing(true);
    setHeldOutResult(null);
    try {
      const res = await api.analyzeEarlySignal(componentId);
      setEarlyResult(res);
      onSelectComponent(componentId);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRevealHeldOut = async () => {
    if (!componentId) return;
    setIsRevealing(true);
    try {
      const res = await api.revealHeldOutOutcome(componentId);
      setHeldOutResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRevealing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Microscope className="w-5 h-5 text-cyan-400" />
            Early Warning Lab
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Controlled 24h early drift forecasting sandbox with strict temporal isolation and retrospective verification.
          </p>
        </div>

        {/* Quick Scenario Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setComponentId('CMP-DEMO-EARLY-DRIFT');
              setEarlyResult(null);
              setHeldOutResult(null);
            }}
            className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-cyan-300 border border-slate-700 cursor-pointer"
          >
            Load Early Drift Exemplar
          </button>
          <button
            onClick={() => {
              setComponentId('CMP-DEMO-WITHIN-SPEC');
              setEarlyResult(null);
              setHeldOutResult(null);
            }}
            className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-amber-300 border border-slate-700 cursor-pointer"
          >
            Load Within-Spec Exemplar
          </button>
        </div>
      </div>

      {/* Interactive Selection & Timeline Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 shadow-lg">
        {/* Component Selector Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="w-full sm:w-80">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Select Component for Early Warning Analysis:
            </label>
            <select
              value={componentId}
              onChange={(e) => {
                setComponentId(e.target.value);
                setEarlyResult(null);
                setHeldOutResult(null);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 focus:border-cyan-500 focus:outline-none cursor-pointer"
            >
              {componentList.map((c) => (
                <option key={c.component_id} value={c.component_id}>
                  {c.component_id} ({c.lot_id}) — 0h: {c.val_0h ?? '—'}, 24h: {c.val_24h ?? '—'}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full sm:w-auto mt-auto flex items-center justify-center gap-2 px-6 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md shadow-cyan-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
            Analyze Early Signal (≤24h Only)
          </button>
        </div>

        {/* Burn-In Timeline Visualizer */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-cyan-400" />
              Burn-In Staged Lifecycle Timeline
            </span>
            <span className="font-mono text-[11px] text-cyan-400">
              {earlyResult ? 'INFERENCE ACTIVE' : 'AWAITING INFERENCE'}
            </span>
          </div>

          <div className="relative py-6 px-4">
            {/* Timeline Horizontal Line */}
            <div className="absolute top-1/2 left-8 right-8 -translate-y-1/2 h-1 bg-slate-800 rounded" />

            {/* Stages */}
            <div className="relative z-10 grid grid-cols-4 gap-2 text-center">
              {/* 0h */}
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-cyan-500 text-slate-950 font-bold font-mono text-xs flex items-center justify-center shadow-lg shadow-cyan-500/30 ring-4 ring-slate-950">
                  0h
                </div>
                <span className="text-[11px] font-semibold text-slate-200 mt-2">Baseline</span>
                <span className="text-[10px] text-cyan-400 font-mono">
                  {earlyResult ? `${earlyResult.early_observations?.val_0h ?? '—'} µA` : 'Observed'}
                </span>
              </div>

              {/* 24h */}
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-cyan-500 text-slate-950 font-bold font-mono text-xs flex items-center justify-center shadow-lg shadow-cyan-500/30 ring-4 ring-slate-950">
                  24h
                </div>
                <span className="text-[11px] font-semibold text-slate-200 mt-2">Early Drift</span>
                <span className="text-[10px] text-cyan-400 font-mono">
                  {earlyResult ? `${earlyResult.early_observations?.val_24h ?? '—'} µA` : 'Observed'}
                </span>
              </div>

              {/* 96h */}
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full font-bold font-mono text-xs flex items-center justify-center ring-4 ring-slate-950 transition-colors ${
                  heldOutResult ? 'bg-slate-700 text-white' : 'bg-slate-900 border border-slate-700 text-slate-500'
                }`}>
                  {heldOutResult ? '96h' : '?'}
                </div>
                <span className="text-[11px] font-semibold text-slate-400 mt-2">Midpoint</span>
                <span className="text-[10px] font-mono text-slate-500">
                  {heldOutResult ? `${heldOutResult.actual_96h} µA` : 'Hidden'}
                </span>
              </div>

              {/* 168h */}
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full font-bold font-mono text-xs flex items-center justify-center ring-4 ring-slate-950 transition-colors ${
                  heldOutResult
                    ? heldOutResult.actual_crossed_spec_limit ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-slate-950'
                    : earlyResult ? 'bg-amber-500 text-slate-950 animate-pulse' : 'bg-slate-900 border border-slate-700 text-slate-500'
                }`}>
                  168h
                </div>
                <span className="text-[11px] font-semibold text-slate-300 mt-2">Target Stage</span>
                <span className="text-[10px] font-mono font-bold text-amber-400">
                  {earlyResult ? `Forecast: ${earlyResult.forecast?.predicted_168h} µA` : 'Unknown'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Results Grid when earlyResult is available */}
        {earlyResult && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Forecast & Conformal Uncertainty Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  168h Point Prediction
                </span>
                <div className="text-2xl font-bold font-mono text-cyan-400">
                  {earlyResult.forecast?.predicted_168h} µA
                </div>
                <span className="text-[11px] text-slate-500">
                  HistGradientBoosting Regressor
                </span>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  90% Conformal Interval
                </span>
                <div className="text-xl font-bold font-mono text-slate-200">
                  [{earlyResult.forecast?.conformal_lower_bound}, {earlyResult.forecast?.conformal_upper_bound}] µA
                </div>
                <span className="text-[11px] text-slate-500">
                  Width: {earlyResult.forecast?.interval_width} µA (Split Conformal)
                </span>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Deterministic Decision
                </span>
                <div className="text-xl font-bold font-mono text-amber-400">
                  {earlyResult.decision?.decision}
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {earlyResult.decision?.reason_codes?.join(', ')}
                </span>
              </div>
            </div>

            {/* Retrospective Outcome Section */}
            <div className="p-5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-slate-400" />
                    Retrospective Evaluation Gate (Held-Out Data)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Reveal the held-out benchmark measurement recorded at 96h and 168h. The early prediction was already frozen above.
                  </p>
                </div>

                {!heldOutResult ? (
                  <button
                    onClick={handleRevealHeldOut}
                    disabled={isRevealing}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-medium text-xs border border-slate-700 transition-colors cursor-pointer"
                  >
                    {isRevealing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                    Reveal Held-Out Outcome
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded bg-slate-900 border border-slate-700 text-xs font-mono text-emerald-400">
                    <Unlock className="w-3.5 h-3.5" />
                    Outcome Revealed
                  </span>
                )}
              </div>

              {heldOutResult && (
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-3 animate-in fade-in duration-200">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                    <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase">Predicted 168h</span>
                      <span className="text-cyan-400 font-bold text-sm">{heldOutResult.predicted_168h} µA</span>
                    </div>

                    <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase">Held-Out 168h Outcome</span>
                      <span className="text-white font-bold text-sm">{heldOutResult.actual_168h} µA</span>
                    </div>

                    <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase">Prediction Error</span>
                      <span className="text-slate-200 font-bold text-sm">
                        {heldOutResult.prediction_error > 0 ? `+${heldOutResult.prediction_error}` : heldOutResult.prediction_error} µA
                      </span>
                    </div>

                    <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase">Conformal Interval Valid?</span>
                      <span className={`font-bold text-sm ${heldOutResult.within_conformal_interval ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {heldOutResult.within_conformal_interval ? 'YES (Covered)' : 'NO (Out of Bound)'}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-300">
                    {heldOutResult.actual_crossed_spec_limit ? (
                      <p className="text-rose-400 font-semibold flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        The held-out benchmark outcome is now revealed. On this controlled scenario, it confirms the direction of the early warning: component reached {heldOutResult.actual_168h} µA at 168h (exceeding 50.0 µA spec).
                      </p>
                    ) : (
                      <p className="text-emerald-400 font-semibold flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 shrink-0" />
                        Component remained safely within specification limits at 168h ({heldOutResult.actual_168h} µA ≤ 50.0 µA).
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
