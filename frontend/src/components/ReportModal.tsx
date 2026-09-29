import React from 'react';
import { X, Printer, Download, ShieldCheck, AlertTriangle } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportData: any;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  reportData
}) => {
  if (!isOpen || !reportData) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJson = () => {
    const jsonStr = JSON.stringify(reportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TrustBurn_Audit_Report_${reportData.component_id}_${reportData.run_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const decision = reportData.screening_decision;
  const decisionColor =
    decision === 'PASS'
      ? 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40'
      : decision === 'REVIEW'
      ? 'text-amber-400 bg-amber-950/60 border-amber-500/40'
      : 'text-rose-400 bg-rose-950/60 border-rose-500/40';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 print:p-0 print:bg-white print:static">
      <div className="bg-slate-950 border border-slate-800 rounded-xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:border-none print:shadow-none print:bg-white print:text-black">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <span className="text-sm font-bold text-slate-100 uppercase tracking-wide">
              Official Component Screening & QA Audit Report
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
            <button
              onClick={handleDownloadJson}
              className="flex items-center gap-1 px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-xs text-white font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export JSON
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Report Body */}
        <div className="p-8 space-y-6 overflow-y-auto print:p-4 print:overflow-visible">
          {/* Document Header */}
          <div className="flex justify-between items-start border-b border-slate-800 pb-4 print:border-slate-300">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white print:text-black">TrustBurn AI</h1>
              <p className="text-xs text-slate-400 print:text-slate-600">
                Uncertainty-Aware Early Warning & Risk Intelligence for Component Burn-In
              </p>
              <div className="mt-2 text-[11px] font-mono text-slate-500 print:text-slate-500 space-x-3">
                <span>Run ID: {reportData.run_id}</span>
                <span>•</span>
                <span>Model: {reportData.provenance_and_audit?.model_version}</span>
              </div>
            </div>

            <div className={`px-4 py-2 rounded-lg border font-mono font-bold text-sm tracking-wide ${decisionColor} print:border-black print:text-black`}>
              DECISION: {decision}
            </div>
          </div>

          {/* Component & Lot Identification */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-900/60 rounded-lg border border-slate-800 text-xs print:bg-slate-50 print:border-slate-300">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Component ID</span>
              <span className="font-mono text-cyan-400 font-bold print:text-black text-sm">{reportData.component_id}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Lot Identifier</span>
              <span className="font-mono text-slate-200 font-bold print:text-black text-sm">{reportData.lot_id}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Parameter / Unit</span>
              <span className="font-mono text-slate-200 print:text-black">Iddq ({reportData.measurements?.unit})</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Absolute Upper Spec</span>
              <span className="font-mono text-slate-200 print:text-black">{reportData.measurements?.spec_limit} {reportData.measurements?.unit}</span>
            </div>
          </div>

          {/* Measurements Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider print:text-black">
              Burn-In Measurement Trajectory
            </h3>
            <table className="w-full text-xs text-left border border-slate-800 print:border-slate-300">
              <thead className="bg-slate-900 text-slate-400 font-mono text-[11px] print:bg-slate-100 print:text-black">
                <tr>
                  <th className="p-2.5 border-b border-slate-800 print:border-slate-300">Stage</th>
                  <th className="p-2.5 border-b border-slate-800 print:border-slate-300">Measured Value</th>
                  <th className="p-2.5 border-b border-slate-800 print:border-slate-300">Status During Inference</th>
                  <th className="p-2.5 border-b border-slate-800 print:border-slate-300">Spec Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-slate-300 font-mono text-slate-200 print:text-black">
                <tr>
                  <td className="p-2.5 font-bold">0h Baseline</td>
                  <td className="p-2.5">{reportData.measurements?.['0h'] ?? '—'} µA</td>
                  <td className="p-2.5 text-cyan-400 print:text-black">Observed (Eligible Feature)</td>
                  <td className="p-2.5 text-emerald-400">WITHIN LIMIT</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold">24h Early Checkpoint</td>
                  <td className="p-2.5">{reportData.measurements?.['24h'] ?? '—'} µA</td>
                  <td className="p-2.5 text-cyan-400 print:text-black">Observed (Eligible Feature)</td>
                  <td className="p-2.5">{reportData.anomaly_evidence?.spec_status}</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold">96h Midpoint</td>
                  <td className="p-2.5">{reportData.measurements?.['96h_heldout'] ?? '—'} µA</td>
                  <td className="p-2.5 text-slate-400">Strictly Hidden (No Leakage)</td>
                  <td className="p-2.5">—</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold">168h Final Target</td>
                  <td className="p-2.5">{reportData.measurements?.['168h_heldout'] ?? '—'} µA</td>
                  <td className="p-2.5 text-slate-400">Strictly Hidden (Evaluation Only)</td>
                  <td className="p-2.5">—</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Anomaly & Forecast Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-2 text-xs print:bg-white print:border-slate-300">
              <span className="font-semibold text-slate-300 block print:text-black">Anomaly Evidence (Robust MAD)</span>
              <div className="space-y-1 text-slate-300 print:text-black">
                <div>Lot 24h Median: <strong>{reportData.anomaly_evidence?.lot_median_24h} µA</strong></div>
                <div>Lot MAD: <strong>{reportData.anomaly_evidence?.lot_mad_24h} µA</strong></div>
                <div>Robust MAD Z-Score: <strong className="text-amber-400 font-mono print:text-black">{reportData.anomaly_evidence?.robust_z_score} σ</strong></div>
                <p className="text-[11px] text-slate-400 mt-1 italic print:text-slate-600">
                  {reportData.anomaly_evidence?.rationale}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-2 text-xs print:bg-white print:border-slate-300">
              <span className="font-semibold text-slate-300 block print:text-black">168h Drift Forecast & Uncertainty</span>
              <div className="space-y-1 text-slate-300 print:text-black">
                <div>Point Prediction (168h): <strong className="font-mono text-cyan-400 print:text-black">{reportData.drift_forecast?.predicted_168h} µA</strong></div>
                <div>90% Conformal Interval: <strong className="font-mono">[{reportData.drift_forecast?.conformal_lower_bound} µA, {reportData.drift_forecast?.conformal_upper_bound} µA]</strong></div>
                <div>Projected Slope: <strong>{reportData.drift_forecast?.projected_slope} µA/h</strong></div>
                <div>Coverage Guarantee: <strong>{reportData.drift_forecast?.confidence_level}</strong></div>
              </div>
            </div>
          </div>

          {/* Decision Rationale and Verification Action */}
          <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-3 text-xs print:bg-white print:border-slate-300">
            <div>
              <span className="font-semibold text-slate-300 block print:text-black mb-1">Decision Reason Codes</span>
              <div className="flex flex-wrap gap-1.5">
                {reportData.reason_codes?.map((code: string) => (
                  <span key={code} className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300 font-mono text-[10px] print:border-slate-400 print:text-black">
                    {code}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="font-semibold text-slate-300 block print:text-black mb-0.5">Recommended Engineering Verification Action</span>
              <p className="text-amber-300 font-medium print:text-black">
                {reportData.recommended_action}
              </p>
            </div>
          </div>

          {/* Scientific Disclaimer */}
          <div className="p-3 bg-slate-950 border border-amber-500/30 rounded-lg text-[11px] text-slate-400 print:text-slate-600 print:border-slate-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>{reportData.provenance_and_audit?.disclaimer}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
