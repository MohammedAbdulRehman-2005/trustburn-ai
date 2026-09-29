import React, { useState, useEffect } from 'react';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { Header } from './components/Header';
import { OverviewPage } from './pages/OverviewPage';
import { ExplorerPage } from './pages/ExplorerPage';
import { ComponentIntelligencePage } from './pages/ComponentIntelligencePage';
import { EarlyWarningLabPage } from './pages/EarlyWarningLabPage';
import { QADecisionPage } from './pages/QADecisionPage';
import { ValidationPage } from './pages/ValidationPage';
import { AuditTrailPage } from './pages/AuditTrailPage';
import { GuidedDemoModal } from './components/GuidedDemoModal';
import { UploadModal } from './components/UploadModal';
import { RegenerateModal } from './components/RegenerateModal';
import { api } from './api/client';
import { OverviewStats, DemoScenario } from './types/burnin';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedComponentId, setSelectedComponentId] = useState<string>('CMP-DEMO-WITHIN-SPEC');
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('');

  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [scenarios, setScenarios] = useState<DemoScenario[]>([]);
  const [backendOnline, setBackendOnline] = useState<boolean>(false);

  // Modals
  const [isGuidedDemoOpen, setIsGuidedDemoOpen] = useState<boolean>(false);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isRegenerateOpen, setIsRegenerateOpen] = useState<boolean>(false);

  const loadInitialData = async () => {
    try {
      const health = await api.getHealth();
      setBackendOnline(health.status === 'healthy');
      const ov = await api.getOverview();
      setStats(ov);
      const sc = await api.getScenarios();
      setScenarios(sc);
    } catch (err) {
      console.error('Failed to connect to TrustBurn AI backend:', err);
      setBackendOnline(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleSelectScenario = (scenarioId: string) => {
    setSelectedScenarioId(scenarioId);
    const scen = scenarios.find((s) => s.scenario_id === scenarioId);
    if (!scen) return;

    setSelectedComponentId(scen.component_id);

    if (scenarioId === 'SCENARIO_A_WITHIN_SPEC') {
      setActiveTab('intelligence');
    } else if (scenarioId === 'SCENARIO_B_EARLY_DRIFT') {
      setActiveTab('lab');
    } else if (scenarioId === 'SCENARIO_C_SHIFT_WATCH') {
      setActiveTab('intelligence');
    } else if (scenarioId === 'SCENARIO_D_UNRELIABLE_MEASUREMENT') {
      setActiveTab('explorer');
    } else if (scenarioId === 'SCENARIO_E_NORMAL') {
      setActiveTab('intelligence');
    }
  };

  const handleResetDemo = async () => {
    try {
      await api.generateDataset(42, 800);
      await loadInitialData();
      setSelectedComponentId('CMP-DEMO-WITHIN-SPEC');
      setSelectedScenarioId('SCENARIO_A_WITHIN_SPEC');
      setActiveTab('overview');
    } catch (err) {
      console.error(err);
    }
  };

  const handleNavigateToIntelligence = (componentId: string) => {
    setSelectedComponentId(componentId);
    setActiveTab('intelligence');
  };

  return (
    <div className="min-h-screen bg-[#0a0e17] text-slate-100 flex flex-col font-sans">
      {/* 1. Visible Non-Negotiable Disclaimer Banner */}
      <DisclaimerBanner />

      {/* 2. Top Navigation & Brand Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        scenarios={scenarios}
        selectedScenarioId={selectedScenarioId}
        onSelectScenario={handleSelectScenario}
        onStartGuidedDemo={() => setIsGuidedDemoOpen(true)}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenRegenerate={() => setIsRegenerateOpen(true)}
        onResetDemo={handleResetDemo}
        backendOnline={backendOnline}
        activeSeed={stats?.active_seed ?? 42}
      />

      {/* 3. Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'overview' && (
          <OverviewPage
            stats={stats}
            onNavigateToTab={setActiveTab}
            onSelectComponent={(cid) => {
              setSelectedComponentId(cid);
              setActiveTab('intelligence');
            }}
          />
        )}

        {activeTab === 'explorer' && (
          <ExplorerPage
            onSelectComponent={setSelectedComponentId}
            onNavigateToIntelligence={handleNavigateToIntelligence}
          />
        )}

        {activeTab === 'intelligence' && (
          <ComponentIntelligencePage
            selectedComponentId={selectedComponentId}
            onSelectComponent={setSelectedComponentId}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === 'lab' && (
          <EarlyWarningLabPage
            initialComponentId={selectedComponentId}
            onSelectComponent={setSelectedComponentId}
          />
        )}

        {activeTab === 'qa' && <QADecisionPage />}

        {activeTab === 'evaluation' && <ValidationPage />}

        {activeTab === 'audit' && <AuditTrailPage />}
      </main>

      {/* 4. Engineering Console Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>TrustBurn AI</strong> — Uncertainty-Aware Early Warning & Risk Intelligence for Component Burn-In
          </div>
          <div className="font-mono text-[11px] text-slate-500">
            Smart India Hackathon 2026 • SIH26170 Research Prototype • Strictly Synthetic Demonstration Data
          </div>
        </div>
      </footer>

      {/* Modals */}
      <GuidedDemoModal
        isOpen={isGuidedDemoOpen}
        onClose={() => setIsGuidedDemoOpen(false)}
        onNavigateToTab={setActiveTab}
        onSelectComponent={setSelectedComponentId}
      />

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => {
          loadInitialData();
          setIsUploadOpen(false);
          setActiveTab('explorer');
        }}
      />

      <RegenerateModal
        isOpen={isRegenerateOpen}
        onClose={() => setIsRegenerateOpen(false)}
        currentSeed={stats?.active_seed ?? 42}
        onRegenerateSuccess={() => {
          loadInitialData();
          setActiveTab('overview');
        }}
      />
    </div>
  );
};

export default App;
