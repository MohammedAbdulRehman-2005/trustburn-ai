import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  Sliders,
  FileText,
  Activity,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Loader2
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
  Area,
  ComposedChart
} from 'recharts';
import { api, ComponentDetailPayload } from '../api/client';
import { ReportModal } from '../components/ReportModal';

interface ComponentIntelligencePageProps {
  selectedComponentId: string;
  onSelectComponent: (componentId: string) => void;
  onNavigateToTab: (tab: string) => void;
}

export const ComponentIntelligencePage: React.FC<ComponentIntelligencePageProps> = ({
  selectedComponentId,
  onSelectComponent,
  onNavigateToTab
}) => {
  const [data, setData] = useState<ComponentDetailPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [reportOpen, setReportOpen] = useState<boolean>(false);
  const [reportData, setReportData] = useState<any | null>(null);

  const loadComponent = async (id: string) => {
    setLoading(true);
    try {
      const res = await api.getComponentDetail(id);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedComponentId) {
      loadComponent(selectedComponentId);
    }
  }, [selectedComponentId]);

  const handleOpenReport = async () => {
    if (!selectedComponentId) return;
    try {
      const rep = await api.getComponentReport(selectedComponentId);
      setReportData(rep);
      setReportOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
        <span className="text-xs font-mono">Loading Component Telemetry...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-12 text-center text-slate-500 text-xs">
        No component selected. Choose a component from the Burn-In Explorer or demo selector.
      </div>
    );
  }

  const { trajectory, evidence, forecast, shift, decision, historical_context } = data;

  // Prepare chart data combining observed trajectory, predicted point, and uncertainty band
  const chartData = [
    {
      hour: 0,
      hourLabel: '0h',
      observed: trajectory.val_0h,
      baselineLot: historical_context.lot_median_24h,
      specLimit: trajectory.absolute_upper_limit,
    },
    {
      hour: 24,
      hourLabel: '24h',
      observed: trajectory.val_24h,
      forecast: trajectory.val_24h, // connect forecast line
      lowerConformal: forecast?.conformal_lower_bound,
      upperConformal: forecast?.conformal_upper_bound,
      baselineLot: historical_context.lot_median_24h,
      specLimit: trajectory.absolute_upper_limit,
    },
    {
      hour: 96,
      hourLabel: '96h',
      observed: trajectory.val_96h, // shown only for retrospective evaluation
      baselineLot: historical_context.lot_median_24h,
      specLimit: trajectory.absolute_upper_limit,
    },
    {
      hour: 168,
      hourLabel: '168h',
      observed: trajectory.val_168h, // shown only for retrospective evaluation
      forecast: forecast?.predicted_168h,
      lowerConformal: forecast?.conformal_lower_bound,
      upperConformal: forecast?.conformal_upper_bound,
      baselineLot: historical_context.lot_median_24h,
      specLimit: trajectory.absolute_upper_limit,
    },
  ];

  const decisionBadgeClass =
    decision?.decision === 'PASS'
      ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
      : decision?.decision === 'REVIEW'
      ? 'bg-amber-950 text-amber-400 border-amber-800'
      : 'bg-rose-950 text-rose-400 border-rose-800';

  return (
    <div className="space-y-6">
      {/* Component Header Card */}
      <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold font-mono text-white">{trajectory.component_id}</h2>
            {trajectory.is_demo_fixture && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                Demonstration Fixture
              </span>
            )}
            <span className="text-xs text-slate-400 font-mono">Lot: {trajectory.lot_id}</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Parameter: <strong>Iddq Leakage Current ({trajectory.unit})</strong> • Stress Temperature: {trajectory.temperature_c}°C
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 rounded-lg border font-mono font-bold text-sm tracking-wide ${decisionBadgeClass}`}>
            DECISION: {decision?.decision}
          </div>

          <button
            onClick={handleOpenReport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-sm transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            Export QA Report
          </button>
        </div>
      </div>

      {/* Main Grid: Trajectory Chart & Evidence Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trajectory & Forecast Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Burn-In Electrical Trajectory</h3>
              <p className="text-xs text-slate-400">
                Observed measurements vs 24h Early Forecast with 90% Conformal Uncertainty Band
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="flex items-center gap-1 text-cyan-400">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
                Observed
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2.5 h-0.5 bg-amber-400 inline-block border-b border-dashed" />
                Forecast (≤24h)
              </span>
              <span className="flex items-center gap-1 text-rose-400">
                <span className="w-2.5 h-0.5 bg-rose-500 inline-block" />
                Spec Limit (50 µA)
              </span>
            </div>
          </div>

          {/* Chart Container */}
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hourLabel" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  domain={[0, (dataMax: number) => Math.max(60, Math.ceil(dataMax + 5))]}
                  unit=" µA"
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px' }}
                />

                {/* Reference Line for Absolute Spec Limit (50 uA) */}
                <ReferenceLine
                  y={trajectory.absolute_upper_limit}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  label={{ value: 'Absolute Limit (50.0 µA)', fill: '#ef4444', fontSize: 10, position: 'top' }}
                />

                {/* Reference Line for Lot Baseline Median */}
                {historical_context.lot_median_24h && (
                  <ReferenceLine
                    y={historical_context.lot_median_24h}
                    stroke="#10b981"
                    strokeDasharray="2 2"
                    label={{ value: `Lot Median (${historical_context.lot_median_24h} µA)`, fill: '#10b981', fontSize: 10, position: 'bottom' }}
                  />
                )}

                {/* Observed measurements line */}
                <Line
                  type="monotone"
                  dataKey="observed"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#06b6d4', stroke: '#083344', strokeWidth: 2 }}
                  name="Observed Trajectory"
                />

                {/* Early Forecast Line */}
                <Line
                  type="linear"
                  dataKey="forecast"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 5, fill: '#f59e0b', stroke: '#451a03', strokeWidth: 2 }}
                  name="168h Forecast"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Scientific Disclaimer Note */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg text-[11px] text-slate-400 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-300">Strict Temporal Boundary:</strong> Forecast and conformal intervals are computed strictly using 0h and 24h data. 96h and 168h observations are held-out and shown here only for retrospective accuracy auditing.
            </div>
          </div>
        </div>

        {/* Evidence & Decision Panel */}
        <div className="space-y-4">
          {/* Anomaly Evidence Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Lot-Relative Anomaly Evidence</span>
              <span className="font-mono text-cyan-400">{evidence?.lot_relative_status}</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2 bg-slate-950 rounded border border-slate-800">
                <span className="text-slate-400">Absolute Spec (24h):</span>
                <span className="font-mono font-bold text-emerald-400">
                  {evidence?.absolute_spec_status === 'WITHIN_LIMIT' ? 'PASS (≤50 µA)' : 'EXCEEDED'}
                </span>
              </div>
              <div className="flex justify-between p-2 bg-slate-950 rounded border border-slate-800">
                <span className="text-slate-400">Lot Baseline Median:</span>
                <span className="font-mono text-slate-200">{evidence?.lot_median} µA</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-950 rounded border border-slate-800">
                <span className="text-slate-400">Lot MAD (Dispersion):</span>
                <span className="font-mono text-slate-200">{evidence?.lot_mad} µA</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-950 rounded border border-slate-800">
                <span className="text-slate-400">Robust MAD Z-Score:</span>
                <span className="font-mono font-bold text-amber-400 text-sm">
                  {evidence?.robust_z_score} σ
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 italic bg-slate-950/50 p-2.5 rounded border border-slate-800">
              "{evidence?.rationale}"
            </p>
          </div>

          {/* Forecast & Uncertainty Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>168h Drift Forecast & Conformal Uncertainty</span>
              <span className="font-mono text-cyan-400">90% Coverage</span>
            </h3>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between p-2 bg-slate-950 rounded border border-slate-800">
                <span className="text-slate-400 font-sans">Predicted 168h:</span>
                <span className="font-bold text-cyan-300">{forecast?.predicted_168h} µA</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-950 rounded border border-slate-800">
                <span className="text-slate-400 font-sans">Conformal Interval:</span>
                <span className="text-slate-200">
                  [{forecast?.conformal_lower_bound}, {forecast?.conformal_upper_bound}] µA
                </span>
              </div>
              <div className="flex justify-between p-2 bg-slate-950 rounded border border-slate-800">
                <span className="text-slate-400 font-sans">Projected Slope:</span>
                <span className="text-slate-200">{forecast?.projected_slope} µA/h</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decision Rationale and Verification Action Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-slate-200">Deterministic Decision & Verification Action</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
            <span className="text-slate-400 block font-semibold text-[10px] uppercase">Reason Codes</span>
            <div className="flex flex-wrap gap-1">
              {decision?.reason_codes.map((code) => (
                <span key={code} className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[10px] border border-slate-700">
                  {code}
                </span>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
            <span className="text-slate-400 block font-semibold text-[10px] uppercase">Rule-Based Recommended Action</span>
            <p className="text-amber-300 font-medium">
              {decision?.recommended_action}
            </p>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        reportData={reportData}
      />
    </div>
  );
};
