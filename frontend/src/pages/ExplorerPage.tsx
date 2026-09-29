import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { api } from '../api/client';
import { ComponentListItem } from '../types/burnin';

interface ExplorerPageProps {
  onSelectComponent: (componentId: string) => void;
  onNavigateToIntelligence: (componentId: string) => void;
}

export const ExplorerPage: React.FC<ExplorerPageProps> = ({
  onSelectComponent,
  onNavigateToIntelligence
}) => {
  const [items, setItems] = useState<ComponentListItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [lotId, setLotId] = useState<string>('');
  const [decision, setDecision] = useState<string>('');
  const [anomalousOnly, setAnomalousOnly] = useState<boolean>(false);
  const [withinSpecOnly, setWithinSpecOnly] = useState<boolean>(false);
  const [lots, setLots] = useState<string[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getComponents({
        lot_id: lotId || undefined,
        decision: decision || undefined,
        anomalous_only: anomalousOnly,
        within_spec_only: withinSpecOnly,
        search: search || undefined,
        limit: 250
      });
      setItems(data.items);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.getLots().then((l) => setLots(l.map((x: any) => x.lot_id))).catch(() => {});
  }, []);

  useEffect(() => {
    loadData();
  }, [lotId, decision, anomalousOnly, withinSpecOnly, search]);

  return (
    <div className="space-y-4">
      {/* Title & Filter Bar */}
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Burn-In Explorer</h2>
            <p className="text-xs text-slate-400">
              Interactive electrical measurement trajectories, anomaly evidence, and screening decisions.
            </p>
          </div>
          <div className="text-xs font-mono text-slate-400">
            Showing <strong className="text-cyan-400">{items.length}</strong> of <strong>{total}</strong> components
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-800/80 text-xs">
          {/* Search Box */}
          <div className="relative min-w-[200px] flex-1">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Component ID or Lot ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-md pl-8 pr-3 py-1.5 text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Lot Filter */}
          <select
            value={lotId}
            onChange={(e) => setLotId(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-slate-300 focus:border-cyan-500 focus:outline-none cursor-pointer"
          >
            <option value="">All Production Lots</option>
            {lots.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>

          {/* Decision Filter */}
          <select
            value={decision}
            onChange={(e) => setDecision(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-slate-300 focus:border-cyan-500 focus:outline-none cursor-pointer"
          >
            <option value="">All Decisions</option>
            <option value="PASS">PASS Only</option>
            <option value="REVIEW">REVIEW Only</option>
            <option value="HIGH RISK">HIGH RISK Only</option>
          </select>

          {/* Filter Pills */}
          <button
            onClick={() => setWithinSpecOnly(!withinSpecOnly)}
            className={`px-3 py-1.5 rounded-md border font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              withinSpecOnly
                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            Within-Spec Anomalies Only
          </button>

          <button
            onClick={() => setAnomalousOnly(!anomalousOnly)}
            className={`px-3 py-1.5 rounded-md border font-medium transition-colors cursor-pointer ${
              anomalousOnly
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Anomalous Only (MAD ≥ 2.5)
          </button>
        </div>
      </div>

      {/* Engineering Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
            <span className="text-xs font-mono">Filtering components...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No components matched the selected filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3">Component ID</th>
                  <th className="p-3">Lot ID</th>
                  <th className="p-3">0h (Obs)</th>
                  <th className="p-3">24h (Obs)</th>
                  <th className="p-3">96h</th>
                  <th className="p-3">168h</th>
                  <th className="p-3">Static Spec</th>
                  <th className="p-3">Robust MAD Z</th>
                  <th className="p-3">Forecast (168h)</th>
                  <th className="p-3">90% Conformal</th>
                  <th className="p-3">Decision</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono text-slate-300">
                {items.map((c) => {
                  const isWithinSpecAnomaly =
                    c.absolute_spec_status === 'WITHIN_LIMIT' && c.robust_z_score >= 4.0;
                  return (
                    <tr
                      key={c.component_id}
                      onClick={() => onSelectComponent(c.component_id)}
                      className={`hover:bg-slate-800/60 transition-colors cursor-pointer ${
                        isWithinSpecAnomaly ? 'bg-amber-950/20' : ''
                      }`}
                    >
                      <td className="p-3 font-bold text-slate-100 flex items-center gap-1.5">
                        {c.component_id}
                        {c.is_demo_fixture && (
                          <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                            Fixture
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-400">{c.lot_id}</td>
                      <td className="p-3">{c.val_0h !== null ? `${c.val_0h.toFixed(1)}` : '—'}</td>
                      <td className="p-3 font-semibold text-slate-200">
                        {c.val_24h !== null ? `${c.val_24h.toFixed(1)}` : '—'}
                      </td>
                      <td className="p-3 text-slate-400">
                        {c.val_96h !== null ? `${c.val_96h.toFixed(1)}` : '—'}
                      </td>
                      <td className="p-3 text-slate-400">
                        {c.val_168h !== null ? `${c.val_168h.toFixed(1)}` : '—'}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] ${
                            c.absolute_spec_status === 'WITHIN_LIMIT'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-rose-950 text-rose-300 border border-rose-800'
                          }`}
                        >
                          {c.absolute_spec_status === 'WITHIN_LIMIT' ? 'PASS' : 'EXCEEDED'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`font-bold ${
                            c.robust_z_score >= 4.0
                              ? 'text-rose-400'
                              : c.robust_z_score >= 2.5
                              ? 'text-amber-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {c.robust_z_score.toFixed(1)} σ
                        </span>
                      </td>
                      <td className="p-3 text-cyan-300">
                        {c.predicted_168h !== null ? `${c.predicted_168h.toFixed(1)} µA` : '—'}
                      </td>
                      <td className="p-3 text-slate-400 text-[11px]">
                        {c.conformal_lower !== null && c.conformal_upper !== null
                          ? `[${c.conformal_lower.toFixed(1)}, ${c.conformal_upper.toFixed(1)}]`
                          : '—'}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            c.decision === 'PASS'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : c.decision === 'REVIEW'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}
                        >
                          {c.decision}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigateToIntelligence(c.component_id);
                          }}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          Inspect <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
