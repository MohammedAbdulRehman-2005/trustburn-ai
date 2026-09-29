import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Filter,
  FileText,
  AlertTriangle,
  CheckCircle,
  ShieldAlert,
  Save,
  Loader2,
  MessageSquare
} from 'lucide-react';
import { api } from '../api/client';
import { ScreeningDecision } from '../types/burnin';
import { ReportModal } from '../components/ReportModal';

export const QADecisionPage: React.FC = () => {
  const [decisions, setDecisions] = useState<ScreeningDecision[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [activeNotes, setActiveNotes] = useState<{ [id: string]: string }>({});
  const [savingNotes, setSavingNotes] = useState<{ [id: string]: boolean }>({});

  const [reportOpen, setReportOpen] = useState<boolean>(false);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  const loadDecisions = async () => {
    setLoading(true);
    try {
      const res = await api.getDecisions(filterStatus || undefined);
      setDecisions(res.items);
      const notesMap: { [id: string]: string } = {};
      res.items.forEach((d: ScreeningDecision) => {
        notesMap[d.component_id] = d.reviewer_notes || '';
      });
      setActiveNotes(notesMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDecisions();
  }, [filterStatus]);

  const handleSaveNotes = async (componentId: string) => {
    setSavingNotes((prev) => ({ ...prev, [componentId]: true }));
    try {
      await api.updateDecisionNotes(componentId, activeNotes[componentId] || '');
    } catch (err) {
      console.error(err);
    } finally {
      setSavingNotes((prev) => ({ ...prev, [componentId]: false }));
    }
  };

  const handleOpenReport = async (componentId: string) => {
    try {
      const rep = await api.getComponentReport(componentId);
      setSelectedReport(rep);
      setReportOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-cyan-400" />
            QA Decision Center & Disposition Queue
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Auditable screening triage with transparent reason codes, rule-based verification recommendations, and QA review notes.
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2">
          {['', 'HIGH RISK', 'REVIEW', 'PASS'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterStatus === status
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {status === '' ? 'All Dispositions' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Triage Queue List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
            <span className="text-xs font-mono">Loading Decision Queue...</span>
          </div>
        ) : decisions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs bg-slate-900 rounded-xl border border-slate-800">
            No components match the selected disposition filter.
          </div>
        ) : (
          decisions.map((d) => {
            const isHighRisk = d.decision === 'HIGH RISK';
            const isReview = d.decision === 'REVIEW';

            const badgeColor = isHighRisk
              ? 'bg-rose-950 text-rose-400 border-rose-800'
              : isReview
              ? 'bg-amber-950 text-amber-400 border-amber-800'
              : 'bg-emerald-950 text-emerald-400 border-emerald-800';

            return (
              <div
                key={d.component_id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 hover:border-slate-700 transition-colors shadow-md"
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-base text-slate-100">{d.component_id}</span>
                    <span className="text-xs font-mono text-slate-400">{d.lot_id}</span>
                    <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold border ${badgeColor}`}>
                      {d.decision}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenReport(d.component_id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      View Official Report
                    </button>
                  </div>
                </div>

                {/* Evidence & Action Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Reason Codes */}
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1.5">
                    <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                      Deterministic Reason Codes
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {d.reason_codes.map((code) => (
                        <span key={code} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300 font-mono text-[10px]">
                          {code}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Recommended Verification Action */}
                  <div className="md:col-span-2 p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
                    <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                      Rule-Based Recommended Action
                    </span>
                    <p className="text-amber-300 font-medium leading-relaxed">
                      {d.recommended_action}
                    </p>
                  </div>
                </div>

                {/* Human Reviewer Notes */}
                <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative flex-1">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Add QA human inspection notes (does not alter deterministic machine decision)..."
                      value={activeNotes[d.component_id] || ''}
                      onChange={(e) =>
                        setActiveNotes({ ...activeNotes, [d.component_id]: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={() => handleSaveNotes(d.component_id)}
                    disabled={savingNotes[d.component_id]}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors cursor-pointer shrink-0"
                  >
                    {savingNotes[d.component_id] ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5 text-cyan-400" />
                    )}
                    Save Notes
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        reportData={selectedReport}
      />
    </div>
  );
};
