import React from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  Activity,
  Layers,
  ArrowRight,
  TrendingUp,
  Cpu,
  Info
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
import { OverviewStats } from '../types/burnin';

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

      {/* Conventional vs TrustBurn Comparison Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
              Conventional Screening Paradigm
            </h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Evaluates individual components solely against static absolute limits:
          </p>
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-md font-mono text-xs text-slate-300">
            <code>Condition: measured_value ≤ absolute_upper_limit (50.0 µA)</code>
          </div>
          <div className="text-xs text-rose-300/90 flex items-start gap-1.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>
              <strong>Vulnerability:</strong> Misses latent within-spec outliers (e.g. 45.1 µA part in a 10 µA baseline lot) and ignores early accelerating drift.
            </span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-gradient-to-br from-slate-900 to-cyan-950/40 border border-cyan-500/30 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <h3 className="text-sm font-bold text-cyan-300 uppercase tracking-wide">
              TrustBurn AI Screening Architecture
            </h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Synthesizes six complementary evidence dimensions:
          </p>
          <ul className="text-xs text-slate-300 space-y-1 list-disc pl-5">
            <li><strong>Static Spec:</strong> Absolute limit compliance check.</li>
            <li><strong>Peer-Relative:</strong> Contamination-resistant Median & MAD anomaly deviation.</li>
            <li><strong>Forecast:</strong> Supervised 24h→168h drift projection (strict no-leakage).</li>
            <li><strong>Uncertainty:</strong> 90% Split Conformal prediction intervals.</li>
            <li><strong>Trust Diagnostic:</strong> Non-parametric cross-lot distribution shift detection.</li>
          </ul>
        </div>
      </div>

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
