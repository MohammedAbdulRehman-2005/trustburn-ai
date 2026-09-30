import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  Activity,
  Layers,
  ArrowRight,
  TrendingUp,
  Cpu,
  Info,
  ExternalLink,
  Target,
  ShieldCheck,
  Zap
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { OverviewStats, ComponentListItem } from '../types/burnin';
import { api } from '../api/client';

interface OverviewPageProps {
  stats: OverviewStats | null;
  onNavigateToTab: (tab: string) => void;
  onSelectComponent: (componentId: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  stats,
  onNavigateToTab,
  onSelectComponent
}) => {
  const [priorityItems, setPriorityItems] = useState<ComponentListItem[]>([]);

  useEffect(() => {
    // Load top priority triage components
    api.getComponents({ decision: 'HIGH RISK', limit: 5 })
      .then((res) => setPriorityItems(res.items))
      .catch(console.error);
  }, [stats?.last_run_timestamp]);

  if (!stats) {
    return (
      <div className="p-8 text-center text-slate-500 font-mono text-sm">
        Loading Mission Control Telemetry...
      </div>
    );
  }

  const pieData = [
    { name: 'PASS', value: stats.pass_count, color: '#10b981' },
    { name: 'REVIEW', value: stats.review_count, color: '#f59e0b' },
    { name: 'HIGH RISK', value: stats.high_risk_count, color: '#ef4444' },
  ];

  const escapeStats = stats.defect_escape_stats || {
    conventional_escapes: 0,
    trustburn_escapes: 0,
    escape_reduction_pct: 0,
    early_warning_opportunity_count: 0,
    description: "Conventional static screening misses within-spec degradation at 24h; TrustBurn AI reduces defect escapes on this controlled benchmark."
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Mission Control Overview</h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time screening triage across active manufacturing lots and burn-in trajectories.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              onNavigateToTab('intelligence');
              onSelectComponent('CMP-DEMO-WITHIN-SPEC');
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium hover:bg-amber-500/20 transition-colors cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Inspect Within-Spec Anomaly
            <ArrowRight className="w-3 h-3" />
          </button>
          <button
            onClick={() => {
              onNavigateToTab('lab');
              onSelectComponent('CMP-DEMO-EARLY-DRIFT');
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-medium hover:bg-cyan-500/20 transition-colors cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            Launch Early Warning Lab
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Total Lots</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">{stats.total_lots}</span>
            <span className="text-[10px] text-cyan-400 font-mono">Partitions</span>
          </div>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Components</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">{stats.total_components}</span>
            <span className="text-[10px] text-slate-400 font-mono">100% Screened</span>
          </div>
        </div>

        <div className="p-4 bg-emerald-950/20 border border-emerald-800/40 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            PASS
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400 font-mono">{stats.pass_count}</span>
            <span className="text-[10px] text-slate-400 font-mono">
              {((stats.pass_count / stats.total_components) * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="p-4 bg-amber-950/20 border border-amber-800/40 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            REVIEW
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-400 font-mono">{stats.review_count}</span>
            <span className="text-[10px] text-slate-400 font-mono">
              {((stats.review_count / stats.total_components) * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="p-4 bg-rose-950/20 border border-rose-800/40 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider block flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" />
            HIGH RISK
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-400 font-mono">{stats.high_risk_count}</span>
            <span className="text-[10px] text-slate-400 font-mono">
              {((stats.high_risk_count / stats.total_components) * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="p-4 bg-cyan-950/20 border border-cyan-800/40 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider block">Within-Spec Anomalies</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-cyan-300 font-mono">{stats.within_spec_anomalies}</span>
            <span className="text-[10px] text-cyan-400 font-mono">Latent</span>
          </div>
        </div>
      </div>

      {/* Conventional vs TrustBurn Comparison Table per Mandatory Change 16 */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              Screening Methodology Comparison: Conventional vs. TrustBurn AI
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Evaluating static threshold checking against multi-stream uncertainty-aware screening.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded text-[11px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 w-fit">
            Controlled BurnIn-Bench Comparison
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
              <tr>
                <th className="p-3">Capability</th>
                <th className="p-3">Conventional Screening*</th>
                <th className="p-3 text-cyan-300">TrustBurn AI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              <tr className="hover:bg-slate-800/30">
                <td className="p-3 font-medium text-slate-200">Absolute Limit Checking</td>
                <td className="p-3 font-mono text-emerald-400">✓ Evaluated</td>
                <td className="p-3 font-mono text-cyan-300 font-semibold">✓ Evaluated</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="p-3 font-medium text-slate-200">Lot-Relative Anomaly Detection</td>
                <td className="p-3 font-mono text-slate-500">Not evaluated</td>
                <td className="p-3 font-mono text-cyan-300 font-semibold">✓ Robust MAD Z-score</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="p-3 font-medium text-slate-200">Early Drift Warning</td>
                <td className="p-3 font-mono text-slate-500">Not predicted</td>
                <td className="p-3 font-mono text-cyan-300 font-semibold">✓ Forecast to 168h</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="p-3 font-medium text-slate-200">Prediction Uncertainty</td>
                <td className="p-3 font-mono text-slate-500">Not quantified</td>
                <td className="p-3 font-mono text-cyan-300 font-semibold">✓ Split-conformal interval</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="p-3 font-medium text-slate-200">Distribution-Shift Sensitivity</td>
                <td className="p-3 font-mono text-slate-500">Not monitored</td>
                <td className="p-3 font-mono text-cyan-300 font-semibold">✓ Non-parametric shift diagnostic</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="p-3 font-medium text-slate-200">Screening Decision</td>
                <td className="p-3 font-mono text-slate-400">Static pass/fail</td>
                <td className="p-3 font-mono text-emerald-300 font-semibold">Evidence-based triage (PASS/REVIEW/HIGH RISK)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
          <span>*Baseline static-threshold screening benchmark comparison.</span>
          <div className="flex flex-wrap items-center gap-4 font-mono">
            <span>Conventional Escapes: <strong className="text-rose-400">{escapeStats.conventional_escapes_ratio ?? `${escapeStats.conventional_escapes} out of ${escapeStats.total_defects ?? 108}`}</strong></span>
            <span>TrustBurn Escapes: <strong className="text-emerald-400">{escapeStats.trustburn_escapes_ratio ?? `${escapeStats.trustburn_escapes} out of ${escapeStats.total_defects ?? 108}`}</strong></span>
            <span>Escape Reduction on Controlled Split: <strong className="text-cyan-300">{escapeStats.escape_reduction_pct}%</strong></span>
          </div>
        </div>

        <div className="text-[11px] text-slate-300 pt-1 flex items-start gap-1.5 bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
          <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <span>
            <strong>Early-Warning Opportunity:</strong> Risk identified at ≤24h instead of waiting for the 168h endpoint. Enables rapid engineering triage while preserving chamber qualification integrity.
          </span>
        </div>
      </div>

      {/* Top Priority Triage Queue Table */}
      {priorityItems.length > 0 && (
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-semibold text-slate-200">Top Priority Triage Queue (HIGH RISK)</h3>
            </div>
            <button
              onClick={() => onNavigateToTab('qa')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 cursor-pointer"
            >
              Open Full QA Center <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase">
                <tr>
                  <th className="p-2.5">Component ID</th>
                  <th className="p-2.5">Lot ID</th>
                  <th className="p-2.5 text-right">24h Reading</th>
                  <th className="p-2.5 text-right">Robust Z</th>
                  <th className="p-2.5 text-right">168h Forecast</th>
                  <th className="p-2.5">Primary Reason Code</th>
                  <th className="p-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono text-slate-300">
                {priorityItems.map((item) => (
                  <tr key={item.component_id} className="hover:bg-slate-800/40">
                    <td className="p-2.5 font-bold text-cyan-300 flex items-center gap-1.5">
                      {item.component_id}
                      {item.is_demo_fixture && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-cyan-950 text-cyan-400 border border-cyan-800">
                          Demo
                        </span>
                      )}
                    </td>
                    <td className="p-2.5 text-slate-400">{item.lot_id}</td>
                    <td className="p-2.5 text-right font-bold text-white">
                      {item.val_24h !== null ? `${item.val_24h.toFixed(1)} µA` : '—'}
                    </td>
                    <td className="p-2.5 text-right text-amber-400">
                      {item.robust_z_score.toFixed(1)}
                    </td>
                    <td className="p-2.5 text-right text-rose-400 font-bold">
                      {item.predicted_168h !== null ? `${item.predicted_168h.toFixed(1)} µA` : '—'}
                    </td>
                    <td className="p-2.5">
                      <span className="px-1.5 py-0.5 rounded bg-slate-950 text-slate-300 text-[10px] border border-slate-800">
                        {item.reason_codes[0] || 'REASON_EVALUATED'}
                      </span>
                    </td>
                    <td className="p-2.5 text-right">
                      <button
                        onClick={() => {
                          onSelectComponent(item.component_id);
                          onNavigateToTab('intelligence');
                        }}
                        className="px-2.5 py-1 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 text-[11px] font-sans border border-cyan-800/60 transition-colors cursor-pointer"
                      >
                        Investigate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution Pie */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">Global Screening Disposition</h3>
            <span className="text-[11px] font-mono text-slate-500">N={stats.total_components}</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded bg-slate-950 border border-slate-800">
              <span className="text-emerald-400 font-bold block">{stats.pass_count}</span>
              <span className="text-[10px] text-slate-400">PASS</span>
            </div>
            <div className="p-2 rounded bg-slate-950 border border-slate-800">
              <span className="text-amber-400 font-bold block">{stats.review_count}</span>
              <span className="text-[10px] text-slate-400">REVIEW</span>
            </div>
            <div className="p-2 rounded bg-slate-950 border border-slate-800">
              <span className="text-rose-400 font-bold block">{stats.high_risk_count}</span>
              <span className="text-[10px] text-slate-400">HIGH RISK</span>
            </div>
          </div>
        </div>

        {/* Risk Breakdown by Manufacturing Lot */}
        <div className="lg:col-span-2 p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Risk Disposition by Manufacturing Lot</h3>
              <p className="text-xs text-slate-400">Component disposition stacked across active production lots</p>
            </div>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.risk_by_lot}>
                <XAxis dataKey="lot_id" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px' }}
                />
                <Bar dataKey="pass" stackId="a" fill="#10b981" name="PASS" />
                <Bar dataKey="review" stackId="a" fill="#f59e0b" name="REVIEW" />
                <Bar dataKey="high_risk" stackId="a" fill="#ef4444" name="HIGH RISK" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Lots table summary */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase">
                <tr>
                  <th className="p-2">Lot Identifier</th>
                  <th className="p-2">Shift Diagnostic</th>
                  <th className="p-2 text-right">PASS</th>
                  <th className="p-2 text-right">REVIEW</th>
                  <th className="p-2 text-right">HIGH RISK</th>
                  <th className="p-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono text-slate-300">
                {stats.risk_by_lot.map((l) => (
                  <tr key={l.lot_id} className="hover:bg-slate-800/40">
                    <td className="p-2 font-bold text-slate-100">{l.lot_id}</td>
                    <td className="p-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] ${
                          l.shift_status === 'SHIFT_DETECTED'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : l.shift_status === 'WATCH'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}
                      >
                        {l.shift_status}
                      </span>
                    </td>
                    <td className="p-2 text-right text-emerald-400">{l.pass}</td>
                    <td className="p-2 text-right text-amber-400">{l.review}</td>
                    <td className="p-2 text-right text-rose-400">{l.high_risk}</td>
                    <td className="p-2 text-right font-bold">{l.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
