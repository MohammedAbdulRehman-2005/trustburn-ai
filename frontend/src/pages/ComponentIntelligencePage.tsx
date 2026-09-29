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
  Loader2,
  Clock,
  Compass,
  AlertCircle
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
  ComposedChart,
  Area
} from 'recharts';
import { api, ComponentDetailPayload } from '../api/client';
import { ReportModal } from '../components/ReportModal';
import { ExplainableAISection } from '../components/ExplainableAISection';

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

  // Prepare chart data
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
      forecast: trajectory.val_24h,
      conformalBand: [
        forecast?.conformal_lower_bound ?? trajectory.val_24h,
        forecast?.conformal_upper_bound ?? trajectory.val_24h
      ],
      lowerConformal: forecast?.conformal_lower_bound,
      upperConformal: forecast?.conformal_upper_bound,
      baselineLot: historical_context.lot_median_24h,
      specLimit: trajectory.absolute_upper_limit,
    },
    {
      hour: 96,
      hourLabel: '96h',
      observed: trajectory.val_96h,
      baselineLot: historical_context.lot_median_24h,
      specLimit: trajectory.absolute_upper_limit,
    },
    {
      hour: 168,
      hourLabel: '168h',
      observed: trajectory.val_168h,
      forecast: forecast?.predicted_168h,
      conformalBand: [
        forecast?.conformal_lower_bound,
        forecast?.conformal_upper_bound
      ],
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

  const trustStatus = decision?.trust_status || 'NORMAL';
  const trustBadgeClass =
    trustStatus === 'NORMAL'
      ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
      : trustStatus === 'WATCH'
      ? 'bg-amber-950 text-amber-400 border-amber-800'
      : 'bg-rose-950 text-rose-400 border-rose-800';

  const conv = decision?.conventional_screening || {
    conventional_decision: 'PASS',
    conventional_rule: 'Static Threshold: y(24h) <= 50.0 µA',
    defect_escape_vulnerability: 'LOW',
    trustburn_advantage: 'Screening disposition aligns with conventional specification thresholds.'
  };

  const contribs = decision?.evidence_contributions || {};

  return (
    <div className="space-y-6">
      {/* Component Header Bar */}
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
            <span className="text-xs text-slate-500 font-mono">Split: {trajectory.split_group}</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Parameter: <strong>Iddq Leakage Current ({trajectory.unit})</strong> • Stress Temperature: {trajectory.temperature_c}°C • Spec Limit: {trajectory.absolute_upper_limit} {trajectory.unit}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-lg border font-mono font-bold text-xs tracking-wide ${decisionBadgeClass}`}>
            DECISION: {decision?.decision}
          </div>

          <div className={`px-3 py-1.5 rounded-lg border font-mono font-semibold text-xs tracking-wide ${trustBadgeClass}`}>
            TRUST: {trustStatus}
          </div>

          <button
            onClick={handleOpenReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-sm transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            Export QA Report
          </button>
        </div>
      </div>

      {/* 4 Top Summary Cards (Section 27 Design) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Absolute Limit Compliance */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
          <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">
            1. Absolute Limit Check (24h)
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-white">
              {trajectory.val_24h !== null ? `${trajectory.val_24h.toFixed(1)} µA` : 'MISSING'}
            </span>
            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
              evidence?.absolute_spec_status === 'WITHIN_LIMIT'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : 'bg-rose-950 text-rose-300 border border-rose-800'
            }`}>
              {evidence?.absolute_spec_status === 'WITHIN_LIMIT' ? 'WITHIN SPEC' : 'BREACH'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            Threshold: ≤ {trajectory.absolute_upper_limit} µA static limit
          </div>
        </div>

        {/* Card 2: Lot-Relative Outlier Status */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
          <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">
            2. Lot-Relative Anomaly
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-amber-400">
              Robust Z: {evidence?.robust_z_score.toFixed(1)}
            </span>
            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
              evidence?.lot_relative_status === 'SEVERE_OUTLIER'
                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                : evidence?.lot_relative_status === 'ELEVATED_DRIFT'
                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
            }`}>
              {evidence?.lot_relative_status}
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            Lot Median: {evidence?.lot_median} µA (MAD: {evidence?.lot_mad} µA)
          </div>
        </div>

        {/* Card 3: 168h Forecast & Uncertainty */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
          <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">
            3. 168h Drift Forecast
          </span>
          <div className="flex items-baseline justify-between">
            <span className={`text-xl font-bold font-mono ${
              (forecast?.predicted_168h || 0) >= trajectory.absolute_upper_limit ? 'text-rose-400' : 'text-cyan-300'
            }`}>
              {forecast?.predicted_168h !== undefined ? `${forecast.predicted_168h.toFixed(1)} µA` : '—'}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              90% Interval
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-300 truncate">
            [{forecast?.conformal_lower_bound.toFixed(1)}, {forecast?.conformal_upper_bound.toFixed(1)}] µA
          </div>
        </div>

        {/* Card 4: Trust Status */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
          <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">
            4. AI Model Trust Status
          </span>
          <div className="flex items-baseline justify-between">
            <span className={`text-xl font-bold font-mono ${
              trustStatus === 'NORMAL' ? 'text-emerald-400' : trustStatus === 'WATCH' ? 'text-amber-400' : 'text-rose-400'
            }`}>
              {trustStatus}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {shift?.status === 'SHIFT_DETECTED' ? 'Lot Shifted' : 'Lot Stable'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 truncate">
            {shift?.interpretation || 'In-distribution nominal lot context'}
          </div>
        </div>
      </div>

      {/* Conventional vs TrustBurn Comparison Banner for this Component */}
      <div className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
        conv.defect_escape_vulnerability === 'HIGH'
          ? 'bg-rose-950/20 border-rose-800/40 text-rose-200'
          : 'bg-slate-900 border-slate-800 text-slate-300'
      }`}>
        <div className="flex items-start gap-2.5">
          {conv.defect_escape_vulnerability === 'HIGH' ? (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          ) : (
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider">
                Conventional Screening Disposition: <strong>{conv.conventional_decision}</strong>
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs font-bold uppercase tracking-wider">
                TrustBurn Disposition: <strong>{decision?.decision}</strong>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {conv.trustburn_advantage}
            </p>
          </div>
        </div>

        {conv.defect_escape_vulnerability === 'HIGH' && (
          <span className="shrink-0 px-2.5 py-1 rounded bg-rose-950 text-rose-300 text-xs font-mono font-bold border border-rose-800">
            DEFECT ESCAPE PREVENTED
          </span>
        )}
      </div>

      {/* Main Trajectory Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Burn-In Electrical Degradation Trajectory</h3>
            <p className="text-xs text-slate-400">
              Measured checkpoints vs 24h Early Forecast with 90% Conformal Uncertainty Interval
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-3 h-3 rounded-full bg-cyan-400 inline-block" />
              Observed Trajectory
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-3 h-0.5 bg-amber-400 inline-block border-b-2 border-dashed border-amber-400" />
              24h Forecast Line
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-3 h-0.5 bg-emerald-500 inline-block border-b border-dashed border-emerald-400" />
              Lot Baseline ({historical_context.lot_median_24h} µA)
            </span>
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-3 h-0.5 bg-rose-500 inline-block" />
              Spec Upper Limit (50.0 µA)
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
                strokeWidth={1.5}
                label={{ value: 'Absolute Limit (50.0 µA)', fill: '#ef4444', fontSize: 10, position: 'top' }}
              />

              {/* Reference Line for Lot Baseline Median */}
              {historical_context.lot_median_24h && (
                <ReferenceLine
                  y={historical_context.lot_median_24h}
                  stroke="#10b981"
                  strokeDasharray="3 3"
                  label={{ value: `Lot Median (${historical_context.lot_median_24h} µA)`, fill: '#10b981', fontSize: 10, position: 'bottom' }}
                />
              )}

              {/* Vertical 24h Temporal Boundary */}
              <ReferenceLine
                x="24h"
                stroke="#64748b"
                strokeDasharray="3 3"
                label={{ value: '24h Early Boundary', fill: '#94a3b8', fontSize: 10, position: 'insideTopLeft' }}
              />

              {/* Shaded 90% Conformal Prediction Interval Band */}
              <Area
                type="linear"
                dataKey="conformalBand"
                stroke="#f59e0b"
                strokeDasharray="2 2"
                strokeOpacity={0.5}
                fill="#f59e0b"
                fillOpacity={0.12}
                name="90% Conformal Interval"
              />

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
            <strong className="text-slate-300">Strict Temporal Boundary:</strong> Forecast point prediction and conformal intervals are computed strictly using 0h and 24h data. 96h and 168h observations are held-out and shown here only for retrospective accuracy auditing.
          </div>
        </div>
      </div>

      {/* Explainable AI (XAI) & Grok Diagnostic Intelligence */}
      <ExplainableAISection componentId={selectedComponentId} />

      {/* Multi-Stream Evidence Contributions Breakdown Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Evidence Contributions Breakdown</h3>
            <p className="text-xs text-slate-400">Detailed per-stream breakdown used by the deterministic decision engine</p>
          </div>
          <span className="text-[11px] font-mono text-cyan-400">Engine: POL-2026-01-DETERMINISTIC</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase">
              <tr>
                <th className="p-3 w-48">Evidence Stream</th>
                <th className="p-3">Quantitative Finding</th>
                <th className="p-3 w-36">Contribution Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              <tr>
                <td className="p-3 font-semibold text-slate-200">1. Absolute Specification</td>
                <td className="p-3 font-mono">{contribs.spec_compliance || 'Static threshold compliance'}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                    evidence?.absolute_spec_status === 'WITHIN_LIMIT' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
                  }`}>
                    {evidence?.absolute_spec_status}
                  </span>
                </td>
              </tr>

              <tr>
                <td className="p-3 font-semibold text-slate-200">2. Lot-Relative Anomaly</td>
                <td className="p-3 font-mono">{contribs.lot_relative_anomaly || 'Robust MAD deviation score'}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                    evidence?.lot_relative_status === 'SEVERE_OUTLIER' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                    evidence?.lot_relative_status === 'ELEVATED_DRIFT' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                    'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}>
                    {evidence?.lot_relative_status}
                  </span>
                </td>
              </tr>

              <tr>
                <td className="p-3 font-semibold text-slate-200">3. 168h Drift Forecast</td>
                <td className="p-3 font-mono">{contribs.drift_forecast || 'Supervised gradient boosting prediction'}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                    (forecast?.predicted_168h || 0) >= trajectory.absolute_upper_limit
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}>
                    {(forecast?.predicted_168h || 0) >= trajectory.absolute_upper_limit ? 'SPEC BREACH' : 'WITHIN SPEC'}
                  </span>
                </td>
              </tr>

              <tr>
                <td className="p-3 font-semibold text-slate-200">4. Conformal Uncertainty</td>
                <td className="p-3 font-mono">{contribs.conformal_uncertainty || '90% marginal conformal interval'}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                    forecast?.uncertainty_flag === 'HIGH_UNCERTAINTY'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}>
                    {forecast?.uncertainty_flag}
                  </span>
                </td>
              </tr>

              <tr>
                <td className="p-3 font-semibold text-slate-200">5. Distribution Shift</td>
                <td className="p-3 font-mono">{contribs.distribution_stability || 'Cross-lot non-parametric diagnostic'}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                    shift?.status === 'SHIFT_DETECTED'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : shift?.status === 'WATCH'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}>
                    {shift?.status}
                  </span>
                </td>
              </tr>

              <tr>
                <td className="p-3 font-semibold text-slate-200">6. Measurement Integrity</td>
                <td className="p-3 font-mono">{contribs.measurement_integrity || 'DAQ quality and missingness check'}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                    trajectory.quality_24h === 'GOOD'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-rose-950 text-rose-300 border border-rose-800'
                  }`}>
                    {trajectory.quality_24h}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Decision Rationale and Verification Action Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-slate-200">Deterministic Rule-Based Action</h3>

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
            <span className="text-slate-400 block font-semibold text-[10px] uppercase">Recommended Engineering Action</span>
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
