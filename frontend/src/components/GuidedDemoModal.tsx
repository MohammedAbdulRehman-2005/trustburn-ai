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
      title: 'Step 1: Staged Component & Lot Context',
      icon: Sliders,
      targetTab: 'explorer',
      targetComponent: 'CMP-DEMO-WITHIN-SPEC',
      badge: 'Context Ingestion',
      content: (
        <div className="space-y-3 text-sm text-slate-300">
          <p>
            Burn-in screening measures electrical characteristics (e.g., <code className="text-cyan-300 font-mono">Iddq</code> leakage in µA) at staged time points: <strong>0h, 24h, 96h, and 168h</strong>.
          </p>
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-md font-mono text-xs text-slate-300 space-y-1">
            <div><span className="text-slate-500">Component:</span> CMP-DEMO-WITHIN-SPEC</div>
            <div><span className="text-slate-500">Lot:</span> LOT-2026-C (Baseline Median: ~10.1 µA, MAD: ~1.2 µA)</div>
            <div><span className="text-slate-500">Spec Limit:</span> 50.0 µA Upper Absolute Bound</div>
          </div>
          <p className="text-xs text-slate-400">
            TrustBurn ingests staged data and immediately partitions evaluation without future-stage leakage.
          </p>
        </div>
      )
    },
    {
      step: 2,
      title: 'Step 2: Static Spec PASS vs Dynamic Lot-Relative Anomaly',
      icon: AlertTriangle,
      targetTab: 'intelligence',
      targetComponent: 'CMP-DEMO-WITHIN-SPEC',
      badge: 'Robust Screening',
      content: (
        <div className="space-y-3 text-sm text-slate-300">
          <p>
            Conventional absolute screening checks <code className="text-cyan-300 font-mono">x ≤ 50.0 µA</code>. Because this component measures <strong>45.1 µA at 24h</strong>, traditional systems mark it:
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-md">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">Conventional Screening</span>
              <div className="text-lg font-bold text-emerald-300 mt-1">PASS (45.1 ≤ 50 µA)</div>
              <p className="text-[11px] text-slate-400 mt-1">Absolute limit check completely misses intra-lot outlier.</p>
            </div>
            <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-md">
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wide">TrustBurn Dynamic Screening</span>
              <div className="text-lg font-bold text-amber-300 mt-1">SEVERE ANOMALY</div>
              <p className="text-[11px] text-slate-400 mt-1">Robust MAD score: <strong>19.7 sigmas</strong> from lot median 10.1 µA.</p>
            </div>
          </div>
          <p className="text-xs text-amber-300/90 font-medium">
            Demonstrates why absolute thresholds alone are insufficient for high-reliability components.
          </p>
        </div>
      )
    },
    {
      step: 3,
      title: 'Step 3: 24h → 168h Early Drift Forecasting (No-Future-Leakage)',
      icon: TrendingUp,
      targetTab: 'lab',
      targetComponent: 'CMP-DEMO-EARLY-DRIFT',
      badge: 'Supervised Forecasting',
      content: (
        <div className="space-y-3 text-sm text-slate-300">
          <p>
            Component <code className="text-cyan-300 font-mono">CMP-DEMO-EARLY-DRIFT</code> measures 14.5 µA at 0h and 24.8 µA at 24h.
            Early drift rate is steep (<code className="text-cyan-300">+0.429 µA/h</code>).
          </p>
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-md space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-300">
              <span>0h & 24h Input Measurements:</span>
              <span className="font-mono text-cyan-400 font-bold">14.5 µA → 24.8 µA (Observed)</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>Predicted 168h Value:</span>
              <span className="font-mono text-rose-400 font-bold">~58.5 µA (Crosses 50 µA Spec!)</span>
            </div>
            <div className="flex justify-between items-center text-slate-400 border-t border-slate-800 pt-1.5">
              <span>Future 96h & 168h Measurements:</span>
              <span className="font-mono text-slate-400">Strictly Hidden / Held Out During Inference</span>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            Retrospective evaluation will show the physical component tatsächlich degraded to 62.1 µA, confirming the early warning!
          </p>
        </div>
      )
    },
    {
      step: 4,
      title: 'Step 4: Conformal Uncertainty & Distribution Shift Trust Warning',
      icon: ShieldCheck,
      targetTab: 'intelligence',
      targetComponent: 'CMP-DEMO-SHIFT',
      badge: 'Uncertainty Quantification',
      content: (
        <div className="space-y-3 text-sm text-slate-300">
          <p>
            Machine learning predictions require uncertainty bounds and health diagnostics:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-300">
            <li>
              <strong>Split Conformal Calibration:</strong> Guarantees 90% finite-sample marginal coverage on in-distribution calibration data.
            </li>
            <li>
              <strong>Cross-Lot Distribution Shift Diagnostic:</strong> When Lot <code className="text-cyan-300 font-mono">LOT-2026-D-SHIFT</code> arrives with altered baseline (24.5 µA vs 10.1 µA), non-parametric median/scale tests trip <code className="text-amber-400 font-mono">SHIFT_DETECTED</code>.
            </li>
            <li>
              <strong>Scientific Honesty:</strong> Shift warnings reduce automated trust and route components to REVIEW, honestly reporting that conformal exchangeability may degrade.
            </li>
          </ul>
        </div>
      )
    },
    {
      step: 5,
      title: 'Step 5: Deterministic Decision Engine & Auditable Evidence Trail',
      icon: FileCheck,
      targetTab: 'qa',
      targetComponent: 'CMP-DEMO-WITHIN-SPEC',
      badge: 'Deterministic Audit',
      content: (
        <div className="space-y-3 text-sm text-slate-300">
          <p>
            Decisions are <strong>100% deterministic</strong>. No generative LLM controls PASS / REVIEW / HIGH RISK:
          </p>
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-md font-mono text-xs space-y-1 text-slate-300">
            <div><span className="text-slate-500">Decision:</span> <span className="text-amber-400 font-bold">REVIEW / HIGH RISK</span></div>
            <div><span className="text-slate-500">Reason Codes:</span> ['REASON_LOT_RELATIVE_OUTLIER_MAD_HIGH']</div>
            <div><span className="text-slate-500">Verification Action:</span> "Hold component: Recommend precision parameter re-test."</div>
            <div><span className="text-slate-500">Audit Trail:</span> Persisted to SQLite database with Run ID, features, & split hash.</div>
          </div>
          <p className="text-xs text-slate-400">
            Reliability engineers can inspect full evidence, record review notes, and export official QA audit reports.
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
