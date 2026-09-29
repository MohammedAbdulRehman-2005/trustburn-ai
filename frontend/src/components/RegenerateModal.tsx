import React, { useState } from 'react';
import { X, Layers, Loader2, RefreshCw } from 'lucide-react';
import { api } from '../api/client';

interface RegenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSeed: number;
  onRegenerateSuccess: () => void;
}

export const RegenerateModal: React.FC<RegenerateModalProps> = ({
  isOpen,
  onClose,
  currentSeed,
  onRegenerateSuccess
}) => {
  const [seed, setSeed] = useState<number>(currentSeed);
  const [count, setCount] = useState<number>(800);
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleRegenerate = async () => {
    setLoading(true);
    try {
      await api.generateDataset(seed, count);
      onRegenerateSuccess();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-950 border border-slate-800 rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-400" />
            <span className="text-sm font-semibold text-slate-100">Regenerate BurnIn-Bench Synthetic Data</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs text-slate-300">
          <p>
            Configure physics generator parameters. Includes guaranteed demonstration fixtures (Scenario A through E) alongside stochastic Arrhenius/power-law aging degradation.
          </p>

          <div className="space-y-2">
            <label className="block text-slate-400 font-medium">Random Generator Seed:</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={seed}
                onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-slate-100 font-mono focus:border-teal-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setSeed(Math.floor(Math.random() * 90000) + 1000)}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 border border-slate-700 text-xs shrink-0 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Randomize
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-slate-400 font-medium">Total Component Count:</label>
              <span className="font-mono text-teal-400 font-bold">{count} components</span>
            </div>
            <input
              type="range"
              min="400"
              max="1200"
              step="50"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value))}
              className="w-full accent-teal-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>400</span>
              <span>800 (Default)</span>
              <span>1200</span>
            </div>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded-md text-[11px] text-slate-400 space-y-1 font-mono">
            <div>• LOT-2026-A: Train Partition (40%)</div>
            <div>• LOT-2026-B: Conformal Calibration (25%)</div>
            <div>• LOT-2026-C: In-Distribution Held-Out Test (25%)</div>
            <div>• LOT-2026-D-SHIFT: Process-Shifted Test Lot (10%)</div>
          </div>
        </div>

        <div className="px-6 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleRegenerate}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:pointer-events-none text-xs font-semibold text-white shadow-sm transition-colors cursor-pointer"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Generate & Retrain
          </button>
        </div>
      </div>
    </div>
  );
};
