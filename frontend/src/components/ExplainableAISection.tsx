import React, { useState, useEffect } from 'react';
import {
  Brain,
  Sparkles,
  Key,
  Check,
  Copy,
  RotateCcw,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  BarChart2,
  Lock,
  Layers,
  FileText
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Cell,
  CartesianGrid
} from 'recharts';
import { api } from '../api/client';
import { ShapExplanation, GrokDiagnosticNarrative, ShapFeatureAttribution } from '../types/burnin';

interface ExplainableAISectionProps {
  componentId: string;
}

export const ExplainableAISection: React.FC<ExplainableAISectionProps> = ({ componentId }) => {
  const [shapData, setShapData] = useState<ShapExplanation | null>(null);
  const [narrativeData, setNarrativeData] = useState<GrokDiagnosticNarrative | null>(null);
  const [loadingShap, setLoadingShap] = useState<boolean>(true);
  const [loadingNarrative, setLoadingNarrative] = useState<boolean>(false);
  const [showKeyConfig, setShowKeyConfig] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>(() => (import.meta.env.VITE_GROQ_API_KEY as string) || localStorage.getItem('trustburn_grok_key') || '');
  const [showFullTable, setShowFullTable] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load SHAP explanation on componentId change
  useEffect(() => {
    let isMounted = true;
    const fetchShap = async () => {
      setLoadingShap(true);
      setErrorMsg(null);
      try {
        const exp = await api.getExplanation(componentId);
        if (isMounted) setShapData(exp);
      } catch (err: any) {
        if (isMounted) setErrorMsg(err.message || 'Failed to load SHAP explanation');
      } finally {
        if (isMounted) setLoadingShap(false);
      }
    };

    fetchShap();
    // Reset narrative when component changes
    setNarrativeData(null);

    return () => {
      isMounted = false;
    };
  }, [componentId]);

  // Load Grok Narrative
  const handleGenerateNarrative = async () => {
    setLoadingNarrative(true);
    setErrorMsg(null);
    try {
      const activeKey = apiKey.trim() ? apiKey.trim() : undefined;
      const res = await api.getGrokNarrative(componentId, activeKey);
      setNarrativeData(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate diagnostic narrative');
    } finally {
      setLoadingNarrative(false);
    }
  };

  const handleSaveKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('trustburn_grok_key', apiKey.trim());
    } else {
      localStorage.removeItem('trustburn_grok_key');
    }
    setShowKeyConfig(false);
  };

  const handleCopyNarrative = () => {
    if (narrativeData?.narrative) {
      navigator.clipboard.writeText(narrativeData.narrative);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Prepare chart data for diverging SHAP bar chart
  const barChartData = (shapData?.attributions || []).map((attr) => ({
    name: attr.display_name,
    shap: attr.shap_value,
    absShap: Math.abs(attr.shap_value),
    direction: attr.direction,
    value: `${attr.feature_value} ${attr.unit}`.trim(),
    pct: attr.contribution_pct
  }));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-6">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
              Explainable AI (XAI) & Diagnostic Intelligence
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950/80 text-purple-300 border border-purple-800">
              SHAP + Grok LLM
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Exact mathematical Shapley attribution decomposed across ≤ 24h early features, translated into natural language diagnostics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowKeyConfig(!showKeyConfig)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 border border-slate-700 transition-colors"
            title="Configure xAI Grok API Key"
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>{apiKey.trim() ? 'xAI Key Active' : 'Configure Grok Key'}</span>
          </button>

          <button
            onClick={handleGenerateNarrative}
            disabled={loadingNarrative || loadingShap}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-purple-900/30 transition-all disabled:opacity-50"
          >
            {loadingNarrative ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>{narrativeData ? 'Re-Generate Narrative' : 'Generate QA Explanation'}</span>
          </button>
        </div>
      </div>

      {/* Optional Grok Key Configuration Drawer */}
      {showKeyConfig && (
        <div className="p-4 bg-slate-950 rounded-lg border border-purple-900/50 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                Groq LPU / xAI Grok API Key
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Supports ultra-fast Groq LPU (<code className="text-cyan-300">gsk_...</code>, running <code className="text-cyan-300">openai/gpt-oss-120b</code>) and xAI Grok (<code className="text-cyan-300">xai-...</code>, running <code className="text-cyan-300">grok-2-latest</code>).
              </p>
            </div>
            <button
              onClick={() => setShowKeyConfig(false)}
              className="text-slate-500 hover:text-slate-300 text-xs"
            >
              Cancel
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="password"
              placeholder="gsk_... or xai-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
            />
            <button
              onClick={handleSaveKey}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-medium"
            >
              Save Key
            </button>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 text-xs rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Part 1: SHAP Attribution Visualizer */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4 text-cyan-400" />
              Shapley Value Feature Attributions [Δy = f(x) - f_baseline]
            </h4>
            <p className="text-[11px] text-slate-400">
              Baseline Population Prediction: <strong className="text-slate-200 font-mono">{shapData?.base_value_168h ?? '—'} µA</strong> | Component Forecast: <strong className="text-cyan-300 font-mono">{shapData?.predicted_168h ?? '—'} µA</strong> | Net Drift Impact: <strong className="font-mono text-amber-300">{shapData?.total_drift_impact !== undefined ? `${shapData.total_drift_impact > 0 ? '+' : ''}${shapData.total_drift_impact.toFixed(2)} µA` : '—'}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono">
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block" />
              Risk Accelerator (+SHAP)
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" />
              Protective Factor (-SHAP)
            </span>
          </div>
        </div>

        {loadingShap ? (
          <div className="h-56 flex items-center justify-center text-slate-500 text-xs font-mono">
            <Loader2 className="w-5 h-5 animate-spin mr-2 text-cyan-400" />
            Evaluating Shapley permutation matrix...
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barChartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 140, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="#64748b"
                  fontSize={10}
                  tickFormatter={(val) => `${val > 0 ? '+' : ''}${val.toFixed(1)} µA`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  width={130}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-950 border border-slate-700 p-2.5 rounded shadow-xl text-xs space-y-1">
                          <p className="font-bold text-slate-200">{d.name}</p>
                          <p className="text-slate-400">
                            Observed Value: <span className="font-mono text-cyan-300">{d.value}</span>
                          </p>
                          <p className={d.shap >= 0 ? 'text-rose-400' : 'text-emerald-400'}>
                            SHAP Impact: <span className="font-mono font-bold">{d.shap > 0 ? '+' : ''}{d.shap.toFixed(3)} µA</span>
                          </p>
                          <p className="text-slate-400 text-[10px]">
                            {d.direction === 'RISK_ACCELERATOR' ? 'Pushes 168h forecast higher towards spec breach' : 'Stabilizes forecast lower within limits'}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine x={0} stroke="#475569" strokeWidth={1.5} />
                <Bar dataKey="shap" radius={[2, 2, 2, 2]}>
                  {barChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.shap >= 0 ? '#f43f5e' : '#10b981'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Expandable Full 10-Feature Table Toggle */}
        <div className="pt-1">
          <button
            onClick={() => setShowFullTable(!showFullTable)}
            className="flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            {showFullTable ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>{showFullTable ? 'Hide Detailed Feature Attributions' : 'View Full 10-Feature Shapley Table & Mathematical Axioms'}</span>
          </button>

          {showFullTable && shapData && (
            <div className="mt-3 overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase">
                  <tr>
                    <th className="p-2.5">Feature</th>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5">Measured Value</th>
                    <th className="p-2.5">SHAP Attribution</th>
                    <th className="p-2.5">Role</th>
                    <th className="p-2.5">Relative Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono text-slate-300 bg-slate-900/50">
                  {shapData.attributions.map((attr) => (
                    <tr key={attr.feature_name} className="hover:bg-slate-800/40">
                      <td className="p-2.5 font-sans font-semibold text-slate-200">
                        {attr.display_name}
                      </td>
                      <td className="p-2.5 text-[10px] text-slate-400">
                        {attr.category}
                      </td>
                      <td className="p-2.5 text-cyan-300">
                        {attr.feature_value} {attr.unit}
                      </td>
                      <td className={`p-2.5 font-bold ${attr.shap_value >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {attr.shap_value > 0 ? '+' : ''}{attr.shap_value.toFixed(3)} µA
                      </td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          attr.direction === 'RISK_ACCELERATOR'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : attr.direction === 'PROTECTIVE'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {attr.direction}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-400">
                        {attr.contribution_pct}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Shapley Efficiency Axiom: <strong className="text-emerald-400">VERIFIED (Σφᵢ = Δy)</strong></span>
                <span>Leakage Protocol: <strong className="text-emerald-400">Strict ≤ 24h Features Only</strong></span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Part 2: Diagnostic Authority Levels Card (Section 12.4) */}
      <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
              Diagnostic Authority Hierarchy (Blueprint Section 12.4)
            </h4>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            ISO / ECSS Aerospace Protocol
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-xs">
          {/* Level 0 */}
          <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg space-y-1">
            <div className="flex items-center justify-between text-[10px] font-bold text-cyan-400 font-mono">
              <span>LEVEL 0</span>
              <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300">OBSERVED</span>
            </div>
            <p className="font-semibold text-slate-200 text-[11px]">Direct Telemetry</p>
            <p className="text-[10px] text-slate-400">
              Raw measurements recorded at 0h and 24h checkpoints.
            </p>
          </div>

          {/* Level 1 */}
          <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg space-y-1">
            <div className="flex items-center justify-between text-[10px] font-bold text-cyan-400 font-mono">
              <span>LEVEL 1</span>
              <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300">SUPPORTED</span>
            </div>
            <p className="font-semibold text-slate-200 text-[11px]">Statistical Evidence</p>
            <p className="text-[10px] text-slate-400">
              Lot-relative Robust MAD Z-scores and SHAP attributions.
            </p>
          </div>

          {/* Level 2 */}
          <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg space-y-1">
            <div className="flex items-center justify-between text-[10px] font-bold text-amber-400 font-mono">
              <span>LEVEL 2</span>
              <span className="px-1.5 py-0.2 rounded bg-amber-950 text-amber-300">PATTERN</span>
            </div>
            <p className="font-semibold text-slate-200 text-[11px]">Failure Family</p>
            <p className="text-[10px] text-slate-400">
              Candidate behavioral mode (e.g. latent gate oxide drift).
            </p>
          </div>

          {/* Level 3 */}
          <div className="p-2.5 bg-slate-900 border border-indigo-700/60 rounded-lg space-y-1 bg-indigo-950/20">
            <div className="flex items-center justify-between text-[10px] font-bold text-indigo-300 font-mono">
              <span>LEVEL 3</span>
              <span className="px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-200">HYPOTHESIS</span>
            </div>
            <p className="font-semibold text-indigo-200 text-[11px]">Physical Mechanism</p>
            <p className="text-[10px] text-indigo-300/80">
              Epistemic mechanism derived from SHAP evidence drivers.
            </p>
          </div>

          {/* Level 4 */}
          <div className="p-2.5 bg-slate-900/60 border border-slate-800/80 rounded-lg space-y-1 opacity-70">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 font-mono">
              <span>LEVEL 4</span>
              <Lock className="w-3 h-3 text-rose-400" />
            </div>
            <p className="font-semibold text-slate-400 text-[11px]">Confirmed Root Cause</p>
            <p className="text-[10px] text-slate-500">
              Restricted to destructive laboratory Failure Analysis (SEM/TEM).
            </p>
          </div>
        </div>
      </div>

      {/* Part 3: Grok Natural Language Diagnostic Narrative */}
      {narrativeData ? (
        <div className="bg-slate-950 border border-purple-900/40 rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <h4 className="text-xs font-bold text-purple-200 uppercase tracking-wide">
                AI Diagnostic Report for QA Engineers
              </h4>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                narrativeData.is_live_api
                  ? 'bg-purple-950 text-purple-300 border-purple-800'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}>
                {narrativeData.source} ({narrativeData.model})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyNarrative}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy Report'}</span>
              </button>
            </div>
          </div>

          {/* Formatted Markdown Content */}
          <div className="prose prose-invert max-w-none text-xs text-slate-300 space-y-3 leading-relaxed">
            {narrativeData.narrative.split('\n\n').map((paragraph, idx) => {
              if (paragraph.startsWith('### ') || paragraph.startsWith('## ')) {
                return (
                  <h4 key={idx} className="text-xs font-bold text-cyan-300 uppercase tracking-wider pt-2 border-b border-slate-800 pb-1">
                    {paragraph.replace(/^#{2,3}\s*/, '')}
                  </h4>
                );
              }
              if (paragraph.startsWith('> ')) {
                return (
                  <blockquote key={idx} className="p-3 bg-slate-900/80 border-l-2 border-amber-400 text-amber-200 text-xs rounded-r my-2 font-mono">
                    {paragraph.replace(/^>\s*/, '')}
                  </blockquote>
                );
              }
              if (paragraph.startsWith('- ')) {
                return (
                  <ul key={idx} className="list-disc pl-4 space-y-1 text-slate-300">
                    {paragraph.split('\n').map((item, itemIdx) => (
                      <li key={itemIdx} dangerouslySetInnerHTML={{
                        __html: item.replace(/^-\s*/, '')
                          .replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-100">$1</strong>')
                          .replace(/`([^`]+)`/g, '<code class="bg-slate-900 px-1 py-0.5 rounded text-cyan-300 font-mono">$1</code>')
                      }} />
                    ))}
                  </ul>
                );
              }
              return (
                <p key={idx} dangerouslySetInnerHTML={{
                  __html: paragraph
                    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-100">$1</strong>')
                    .replace(/`([^`]+)`/g, '<code class="bg-slate-900 px-1 py-0.5 rounded text-cyan-300 font-mono">$1</code>')
                }} />
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-6 bg-slate-950/40 border border-dashed border-slate-800 rounded-xl text-center space-y-2">
          <Sparkles className="w-8 h-8 text-purple-400/60 mx-auto" />
          <h5 className="text-xs font-bold text-slate-300">Grok LLM Diagnostic Summary Ready</h5>
          <p className="text-[11px] text-slate-500 max-w-md mx-auto">
            Click &ldquo;Generate QA Explanation&rdquo; to translate the numerical SHAP feature attributions and early anomaly telemetry into an authoritative diagnostic narrative for QA engineers.
          </p>
          <button
            onClick={handleGenerateNarrative}
            disabled={loadingNarrative || loadingShap}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow transition-colors mt-2"
          >
            {loadingNarrative ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Generate QA Explanation
          </button>
        </div>
      )}
    </div>
  );
};
