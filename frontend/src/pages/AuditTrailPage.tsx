import React, { useState, useEffect } from 'react';
import {
  History,
  ShieldCheck,
  Calendar,
  Layers,
  CheckCircle,
  AlertTriangle,
  ShieldAlert,
  Loader2,
  Lock,
  Key,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { api } from '../api/client';
import { AuditRun, ChainVerificationResponse } from '../types/burnin';

export const AuditTrailPage: React.FC = () => {
  const [runs, setRuns] = useState<AuditRun[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<ChainVerificationResponse | null>(null);

  const loadRuns = async () => {
    setLoading(true);
    try {
      const res = await api.getAuditRuns();
      setRuns(res);
      // Auto verify on initial load
      const verif = await api.verifyAuditChain();
      setVerificationResult(verif);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRuns();
  }, []);

  const handleVerifyChain = async () => {
    setVerifying(true);
    try {
      const res = await api.verifyAuditChain();
      setVerificationResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
        <span className="text-xs font-mono">Loading Persistent Audit Trail & Cryptographic Signatures...</span>
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
            Audit Trail & Cryptographic Provenance Chain
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Tamper-evident SQLite audit records secured by sequential SHA-256 cryptographic hash chaining.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleVerifyChain}
            disabled={verifying}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            {verifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            Verify Hash Integrity
          </button>
        </div>
      </div>

      {/* Cryptographic Chain Integrity Status Card */}
      {verificationResult && (
        <div className={`p-5 rounded-xl border ${
          verificationResult.valid
            ? 'bg-gradient-to-br from-slate-900 to-emerald-950/20 border-emerald-500/30'
            : 'bg-gradient-to-br from-slate-900 to-rose-950/30 border-rose-500/50'
        } space-y-3`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {verificationResult.valid ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              )}
              <h3 className="text-sm font-bold text-white tracking-wide">
                {verificationResult.valid
                  ? 'SHA-256 Cryptographic Audit Chain: VERIFIED INTACT'
                  : 'INTEGRITY ALERT: Tampering Detected in Audit Log'}
              </h3>
            </div>

            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-950 border border-slate-800 text-slate-300">
              Algorithm: {verificationResult.algorithm} • Total Blocks: {verificationResult.chain_length}
            </span>
          </div>

          <p className="text-xs text-slate-300">
            {verificationResult.message}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono pt-1">
            <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800 space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-sans block">Genesis Block Hash (Run 1)</span>
              <div className="text-cyan-300 truncate text-[11px]" title={verificationResult.genesis_hash || 'None'}>
                {verificationResult.genesis_hash || 'None'}
              </div>
            </div>

            <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800 space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-sans block">Latest Head Block Hash</span>
              <div className="text-emerald-300 truncate text-[11px]" title={verificationResult.latest_hash || 'None'}>
                {verificationResult.latest_hash || 'None'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Runs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg space-y-2">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">Historical Screening Executions</h3>
          <span className="text-xs text-slate-400 font-mono">Count: {runs.length}</span>
        </div>

        {runs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No screening runs logged yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3">Run ID</th>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Dataset Source</th>
                  <th className="p-3">SHA-256 Record Hash</th>
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
                    <td className="p-3">
                      <span
                        className="px-2 py-0.5 rounded bg-slate-950 text-cyan-300 text-[10px] border border-slate-800 font-mono block max-w-[140px] truncate"
                        title={`Record Hash: ${r.record_hash}\nPrevious Hash: ${r.previous_hash}`}
                      >
                        {r.record_hash ? `${r.record_hash.substring(0, 14)}...` : 'LEGACY'}
                      </span>
                    </td>
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
