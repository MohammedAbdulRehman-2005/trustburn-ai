import React, { useState, useEffect } from 'react';
import {
  History,
  ShieldCheck,
  Calendar,
  Layers,
  CheckCircle,
  AlertTriangle,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { api } from '../api/client';

export const AuditTrailPage: React.FC = () => {
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api.getAuditRuns()
      .then(setRuns)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
        <span className="text-xs font-mono">Loading Persistent Audit Trail...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" />
            Audit Trail & Persistent Provenance Log
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Immutable SQLite records of all screening runs, feature sets, split hashes, and deterministic policies.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Total Logged Runs: <strong className="text-cyan-400">{runs.length}</strong>
        </div>
      </div>

      {/* Runs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        {runs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No screening runs logged yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3">Run Identifier</th>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Dataset Source</th>
                  <th className="p-3">Seed</th>
                  <th className="p-3">Model Version</th>
                  <th className="p-3 text-right">PASS</th>
                  <th className="p-3 text-right">REVIEW</th>
                  <th className="p-3 text-right">HIGH RISK</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono text-slate-300">
                {runs.map((r) => (
                  <tr key={r.run_id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-cyan-400">{r.run_id}</td>
                    <td className="p-3 text-slate-400">{new Date(r.timestamp).toLocaleString()}</td>
                    <td className="p-3 text-slate-300">{r.dataset_identifier}</td>
                    <td className="p-3 text-slate-400">{r.data_seed}</td>
                    <td className="p-3 text-slate-400">{r.model_version}</td>
                    <td className="p-3 text-right text-emerald-400">{r.pass_count}</td>
                    <td className="p-3 text-right text-amber-400">{r.review_count}</td>
                    <td className="p-3 text-right text-rose-400">{r.high_risk_count}</td>
                    <td className="p-3 text-right font-bold text-white">{r.total_screened}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
