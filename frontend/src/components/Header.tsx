import React from 'react';
import {
  Flame,
  LayoutDashboard,
  TableProperties,
  Cpu,
  Microscope,
  CheckSquare,
  BarChart3,
  History,
  Play,
  RotateCcw,
  UploadCloud,
  Layers
} from 'lucide-react';
import { DemoScenario } from '../types/burnin';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  scenarios: DemoScenario[];
  selectedScenarioId: string;
  onSelectScenario: (scenarioId: string) => void;
  onStartGuidedDemo: () => void;
  onOpenUpload: () => void;
  onOpenRegenerate: () => void;
  onResetDemo: () => void;
  backendOnline: boolean;
  activeSeed: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  scenarios,
  selectedScenarioId,
  onSelectScenario,
  onStartGuidedDemo,
  onOpenUpload,
  onOpenRegenerate,
  onResetDemo,
  backendOnline,
  activeSeed,
}) => {
  return (
    <header className="bg-slate-950 border-b border-slate-800 text-slate-100 sticky top-0 z-30 shadow-lg">
      {/* Top Brand Bar */}
      <div className="px-6 py-3 flex flex-wrap items-center justify-between gap-4 border-b border-slate-900">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/20">
            <Flame className="w-5 h-5 text-slate-950 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-400 bg-clip-text text-transparent">
                TrustBurn AI
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800/60 text-cyan-300">
                v1.0-RC
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">
                Seed: {activeSeed}
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Uncertainty-Aware Early Warning & Risk Intelligence for Component Burn-In
            </p>
          </div>
        </div>

        {/* Demo Quick Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Quick Scenario Picker */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-md px-2.5 py-1 text-xs">
            <span className="text-slate-400 font-medium">Scenario:</span>
            <select
              value={selectedScenarioId}
              onChange={(e) => onSelectScenario(e.target.value)}
              className="bg-transparent text-cyan-300 font-medium focus:outline-none cursor-pointer max-w-[210px] truncate"
            >
              <option value="" disabled className="bg-slate-900 text-slate-400">
                Select Demo Scenario...
              </option>
              {scenarios.map((s) => (
                <option key={s.scenario_id} value={s.scenario_id} className="bg-slate-900 text-slate-200">
                  {s.title}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onStartGuidedDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-sm transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Guided Demo</span>
          </button>

          <button
            onClick={onResetDemo}
            title="Reset to default clean demonstration state"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-colors cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Upload CSV</span>
          </button>

          <button
            onClick={onOpenRegenerate}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-colors cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">Dataset</span>
          </button>

          {/* Backend Status indicator */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
            <span
              className={`w-2 h-2 rounded-full ${
                backendOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span className="text-[11px] font-mono text-slate-400 hidden xl:inline">
              {backendOnline ? 'BACKEND READY' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <nav className="px-6 flex space-x-1 overflow-x-auto text-xs font-medium scrollbar-none">
        {[
          { id: 'overview', label: 'Mission Control', icon: LayoutDashboard },
          { id: 'explorer', label: 'Burn-In Explorer', icon: TableProperties },
          { id: 'intelligence', label: 'Component Intelligence', icon: Cpu },
          { id: 'lab', label: 'Early Warning Lab', icon: Microscope },
          { id: 'qa', label: 'QA Decision Center', icon: CheckSquare },
          { id: 'evaluation', label: 'BurnIn-Bench & Validation', icon: BarChart3 },
          { id: 'audit', label: 'Audit Trail', icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'border-cyan-400 text-cyan-400 bg-slate-900/60 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
              {tab.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
