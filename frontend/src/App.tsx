import React, { useState, useEffect } from 'react';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { BackendColdStartBanner } from './components/BackendColdStartBanner';
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
  const [isConnecting, setIsConnecting] = useState<boolean>(true);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [justConnected, setJustConnected] = useState<boolean>(false);

  // Modals
  const [isGuidedDemoOpen, setIsGuidedDemoOpen] = useState<boolean>(false);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isRegenerateOpen, setIsRegenerateOpen] = useState<boolean>(false);

  // 1. Elapsed timer for cold start
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (!backendOnline) {
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [backendOnline]);

  // 2. Health check and data loader
  const checkHealthAndLoad = async (): Promise<boolean> => {
    setIsConnecting(true);
    try {
      const health = await api.getHealth();
      if (health && health.status === 'healthy') {
        setBackendOnline(true);
        setIsConnecting(false);
        setJustConnected(true);

        const [ov, sc] = await Promise.all([
          api.getOverview().catch(() => null),
          api.getScenarios().catch(() => [])
        ]);

        if (ov) setStats(ov);
        if (sc && sc.length > 0) setScenarios(sc);

        // Auto-dismiss the success badge after 5s
        setTimeout(() => {
          setJustConnected(false);
        }, 5000);

        return true;
      }
    } catch {
      setBackendOnline(false);
    } finally {
      setIsConnecting(false);
    }
    return false;
  };

  // 3. Continuous polling loop until backend responds
  useEffect(() => {
    let active = true;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      const success = await checkHealthAndLoad();
      if (!success && active) {
        timeoutId = setTimeout(poll, 3000);
      }
    };

    poll();

    return () => {
      active = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
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
    } else if (scenarioId === 'SCENARIO_C_DISTRIBUTION_SHIFT' || scenarioId === 'SCENARIO_C_SHIFT_WATCH') {
      setActiveTab('intelligence');
    } else if (scenarioId === 'SCENARIO_D_NORMAL') {
      setActiveTab('intelligence');
    } else if (scenarioId === 'SCENARIO_E_HIGH_RISK') {
      setActiveTab('intelligence');
    } else {
      setActiveTab('intelligence');
    }
  };

  const handleResetDemo = async () => {
    try {
      await api.generateDataset(42, 800);
      await checkHealthAndLoad();
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

      {/* 1.5. Cold Start / Waking Up Banner for Evaluators & Judges */}
      <BackendColdStartBanner
        backendOnline={backendOnline}
        isConnecting={isConnecting}
        elapsedSeconds={elapsedSeconds}
        justConnected={justConnected}
        onRetry={checkHealthAndLoad}
        onDismissJustConnected={() => setJustConnected(false)}
      />

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
        isConnecting={isConnecting}
        elapsedSeconds={elapsedSeconds}
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
          <div className="font-mono text-[11px] text-slate-400">
            High-Reliability Component Screening & Risk Intelligence • Enterprise Edition
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
          checkHealthAndLoad();
          setIsUploadOpen(false);
          setActiveTab('explorer');
        }}
      />

      <RegenerateModal
        isOpen={isRegenerateOpen}
        onClose={() => setIsRegenerateOpen(false)}
        currentSeed={stats?.active_seed ?? 42}
        onRegenerateSuccess={() => {
          checkHealthAndLoad();
          setActiveTab('overview');
        }}
      />
    </div>
  );
};

export default App;
