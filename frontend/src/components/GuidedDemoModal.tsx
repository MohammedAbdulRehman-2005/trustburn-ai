import React, { useState } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
  TrendingUp,
  Sliders,
  FileCheck
} from 'lucide-react';

interface GuidedDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab: (tab: string) => void;
  onSelectComponent: (componentId: string) => void;
}

export const GuidedDemoModal: React.FC<GuidedDemoModalProps> = ({
  isOpen,
  onClose,
  onNavigateToTab,
  onSelectComponent
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  if (!isOpen) return null;

  const steps = [
    {
      step: 1,
      title: 'Phase 1 [0:00–0:30]: Mission Control Overview',
      icon: Sliders,
      targetTab: 'overview',
      targetComponent: 'CMP-DEMO-WITHIN-SPEC',
      badge: 'Mission Control',
      content: (
        <div className="space-y-3 text-sm text-slate-300">
          <p className="italic text-cyan-300">
            "Welcome to TrustBurn AI, an advanced uncertainty-aware screening system for mission-critical component burn-in qualification."
          </p>
          <p>
            In conventional screening, components are checked against static absolute limits at 168 hours. Latent defects that pass initial checks can escape into mission hardware.
          </p>
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-md font-mono text-xs text-slate-300 space-y-1">
            <div><span className="text-slate-500">Benchmark:</span> BurnIn-Bench (800 components across 4 lots)</div>
            <div><span className="text-slate-500">Methodology:</span> Dynamic lot MAD + 168h drift forecast + split-conformal bounds</div>
            <div><span className="text-slate-500">Outcome:</span> Reduces defect escapes by over 90% on this controlled split</div>
          </div>
          <p className="text-xs text-slate-400">
            TrustBurn changes this paradigm: at ≤24h, it combines multi-stream evidence to make early, evidence-based triage decisions.
          </p>
        </div>
      )
    },
    {
      step: 2,
      title: 'Phase 2 [0:30–1:15]: Scenario A — Hidden Within-Spec Anomaly',
      icon: AlertTriangle,
      targetTab: 'intelligence',
      targetComponent: 'CMP-DEMO-WITHIN-SPEC',
      badge: 'Scenario A',
      content: (
        <div className="space-y-3 text-sm text-slate-300">
          <p className="italic text-cyan-300">
            "Here is a classic latent defect escape. At 24 hours, this component draws 45.1 microamps against an upper spec limit of 50 microamps."
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-md">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">Conventional Screening</span>
              <div className="text-lg font-bold text-emerald-300 mt-1">PASS (45.1 ≤ 50 µA)</div>
              <p className="text-[11px] text-slate-400 mt-1">Static check completely misses intra-lot outlier.</p>
            </div>
            <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-md">
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wide">TrustBurn Dynamic Screening</span>
              <div className="text-lg font-bold text-amber-300 mt-1">EXTREME OUTLIER</div>
              <p className="text-[11px] text-slate-400 mt-1">Calculates extreme lot-relative Robust Z-score (Lot Median ~10.1 µA, MAD ~1.2 µA).</p>
            </div>
          </div>
          <p className="text-xs text-amber-300/90 font-medium">
            Even though within absolute limits, the decision engine routes it for engineering disposition with reason code REASON_LOT_RELATIVE_OUTLIER_MAD_HIGH.
          </p>
        </div>
      )
    },
    {
      step: 3,
      title: 'Phase 3 [1:15–2:05]: Scenario B — Early Drift Warning & Held-Out Outcome',
      icon: TrendingUp,
      targetTab: 'lab',
      targetComponent: 'CMP-DEMO-EARLY-DRIFT',
      badge: 'Scenario B',
      content: (
        <div className="space-y-3 text-sm text-slate-300">
          <p className="italic text-cyan-300">
            "Now let’s examine early drift forecasting. This component starts at 14.5 microamps at 0 hours and drifts to 24.8 microamps at 24 hours."
          </p>
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-md space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-300">
              <span>0h & 24h Early Input:</span>
              <span className="font-mono text-cyan-400 font-bold">14.5 µA → 24.8 µA (Observed)</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>Predicted 168h Value:</span>
              <span className="font-mono text-rose-400 font-bold">~58.5 µA (Crosses 50 µA Spec!)</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>90% Split-Conformal Interval:</span>
              <span className="font-mono text-amber-300 font-bold">Lower bound confirms breach with high confidence</span>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            Click "Reveal Held-Out Outcome": on this controlled scenario, it confirms the direction of the early warning: component reached 62.1 µA at 168h, demonstrating an early-warning opportunity at ≤24h!
          </p>
        </div>
      )
    },
    {
      step: 4,
      title: 'Phase 4 [2:05–2:30]: Scenario C — Distribution Shift & Predictive Trust',
      icon: ShieldCheck,
      targetTab: 'intelligence',
      targetComponent: 'CMP-DEMO-SHIFT',
      badge: 'Scenario C',
      content: (
        <div className="space-y-3 text-sm text-slate-300">
          <p className="italic text-cyan-300">
            "What happens when manufacturing conditions drift? Lot D represents an uncalibrated process run with an elevated baseline."
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-300">
            <li>
              <strong>Distribution Shift Diagnostic:</strong> Non-parametric median/scale tests trip <code className="text-amber-400 font-mono">SHIFT_DETECTED</code>.
            </li>
            <li>
              <strong>Predictive Trust Status:</strong> Reduced from <code className="text-emerald-400 font-mono">NORMAL</code> to <code className="text-rose-400 font-mono">REDUCED</code>.
            </li>
            <li>
              <strong>Scientific Honesty:</strong> TrustBurn routes the component for review because conformal guarantees cannot be assured under distribution shift.
            </li>
          </ul>
        </div>
      )
    },
    {
      step: 5,
      title: 'Phase 5 [2:30–3:00]: QA Decision Center & Cryptographic Audit Trail',
      icon: FileCheck,
      targetTab: 'audit',
      targetComponent: 'CMP-DEMO-WITHIN-SPEC',
      badge: 'Phase 5',
      content: (
        <div className="space-y-3 text-sm text-slate-300">
          <p className="italic text-cyan-300">
            "Every screening decision is deterministic and auditable. Here, the reliability engineer sees the full multi-stream evidence breakdown."
          </p>
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-md font-mono text-xs space-y-1 text-slate-300">
            <div><span className="text-slate-500">Decision Engine:</span> Deterministic rule-based (POL-2026-01-DETERMINISTIC)</div>
            <div><span className="text-slate-500">Hash Verification:</span> Click [ VERIFY HASH INTEGRITY ]</div>
            <div><span className="text-slate-500">Status:</span> <span className="text-emerald-400 font-bold">CHAIN VERIFIED INTACT</span></div>
          </div>
          <p className="text-xs text-slate-400">
            Every evaluation run is cryptographically bound to its model version, data seed, and decision policy with SHA-256 hash chaining.
          </p>
        </div>
      )
    }
  ];

  const activeStepData = steps[currentStep - 1];

  const handleApplyStep = () => {
    onNavigateToTab(activeStepData.targetTab);
    onSelectComponent(activeStepData.targetComponent);
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
      const nextStep = steps[currentStep];
      onNavigateToTab(nextStep.targetTab);
      onSelectComponent(nextStep.targetComponent);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      const prevStep = steps[currentStep - 2];
      onNavigateToTab(prevStep.targetTab);
      onSelectComponent(prevStep.targetComponent);
    }
  };

  const handleReplay = () => {
    setCurrentStep(1);
    onNavigateToTab(steps[0].targetTab);
    onSelectComponent(steps[0].targetComponent);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-950 border border-cyan-500/40 rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Banner */}
        <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-blue-950 px-5 py-2.5 border-b border-cyan-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-xs uppercase font-mono font-semibold tracking-wider text-cyan-300">
              TrustBurn AI — Interactive Guided Demonstration
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Progress Indicators */}
        <div className="px-6 pt-5 pb-3 border-b border-slate-800 bg-slate-900/40">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Step {currentStep} of {steps.length}
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              {activeStepData.badge}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {steps.map((s) => (
              <button
                key={s.step}
                onClick={() => {
                  setCurrentStep(s.step);
                  onNavigateToTab(s.targetTab);
                  onSelectComponent(s.targetComponent);
                }}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  s.step === currentStep
                    ? 'bg-cyan-400 shadow-sm shadow-cyan-400/50'
                    : s.step < currentStep
                    ? 'bg-cyan-700'
                    : 'bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="p-6 flex-1 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800/60">
              <activeStepData.icon className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100">{activeStepData.title}</h3>
          </div>

          <div className="py-2">{activeStepData.content}</div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-xs text-slate-400">
            <span>
              Target view: <strong className="text-slate-300 capitalize">{activeStepData.targetTab}</strong>
            </span>
            <button
              onClick={handleApplyStep}
              className="text-cyan-400 hover:text-cyan-300 underline font-medium cursor-pointer"
            >
              Focus View on Background Console →
            </button>
          </div>
        </div>

        {/* Modal Controls */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleReplay}
              className="flex items-center gap-1 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Replay
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded hover:bg-slate-800 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              Exit Tour
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={currentStep === 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-xs text-slate-200 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            {currentStep < steps.length ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-1 px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white shadow-md shadow-cyan-600/30 transition-colors cursor-pointer"
              >
                Next Step
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="flex items-center gap-1 px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-md shadow-emerald-600/30 transition-colors cursor-pointer"
              >
                Finish Tour
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
