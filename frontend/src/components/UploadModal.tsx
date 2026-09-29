import React, { useState } from 'react';
import { X, UploadCloud, Download, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../api/client';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setError(null);
    try {
      const res = await api.uploadDataset(file);
      setResult(res);
      onUploadSuccess();
    } catch (err: any) {
      setError(err.message || 'CSV upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-950 border border-slate-800 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-semibold text-slate-100">Upload Component Burn-In CSV</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-300">
            Ingest external burn-in electrical measurements. Supports both <strong>long-format</strong> (row per measurement) and <strong>wide-format</strong> (columns for 0h, 24h, 96h, 168h).
          </p>

          {/* Download Template Buttons */}
          <div className="flex items-center gap-2 p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs">
            <span className="text-slate-400 text-[11px] font-medium">Download Sample Template:</span>
            <a
              href={api.getSampleCsvUrl('long')}
              download="trustburn_sample_long.csv"
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 transition-colors"
            >
              <Download className="w-3 h-3" />
              Long CSV
            </a>
            <a
              href={api.getSampleCsvUrl('wide')}
              download="trustburn_sample_wide.csv"
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-teal-300 transition-colors"
            >
              <Download className="w-3 h-3" />
              Wide CSV
            </a>
          </div>

          {/* File Picker Zone */}
          <label className="border-2 border-dashed border-slate-700 hover:border-cyan-500/60 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-slate-900/30">
            <UploadCloud className="w-8 h-8 text-cyan-400" />
            <span className="text-xs text-slate-200 font-medium">
              {file ? file.name : 'Select CSV file or drag and drop here'}
            </span>
            <span className="text-[11px] text-slate-500">Max size 25MB • .csv UTF-8 format</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {error && (
            <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                <CheckCircle className="w-4 h-4" />
                <span>Upload & Screening Successful!</span>
              </div>
              <div className="text-[11px] text-slate-300 space-y-0.5">
                <div>Format: <strong>{result.summary?.format_detected?.toUpperCase()}</strong></div>
                <div>Components Parsed: <strong>{result.total_components}</strong> across <strong>{result.total_lots}</strong> lots</div>
                <div>Quality Score: <strong>{result.summary?.quality_score_percent}%</strong></div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:pointer-events-none text-xs font-semibold text-white shadow-sm transition-colors cursor-pointer"
          >
            {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
            Validate & Ingest
          </button>
        </div>
      </div>
    </div>
  );
};
