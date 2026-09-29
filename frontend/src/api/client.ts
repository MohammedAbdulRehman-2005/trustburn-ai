import {
  OverviewStats,
  ComponentListItem,
  ComponentTrajectory,
  AnomalyEvidence,
  EarlyForecast,
  ShiftDiagnostic,
  ScreeningDecision,
  DemoScenario,
  ModelValidationResponse
} from '../types/burnin';

const API_BASE = '/api';

export interface ComponentDetailPayload {
  trajectory: ComponentTrajectory;
  evidence: AnomalyEvidence | null;
  forecast: EarlyForecast | null;
  shift: ShiftDiagnostic | null;
  decision: ScreeningDecision | null;
  historical_context: {
    lot_median_24h?: number;
    lot_mad_24h?: number;
    lot_component_count?: number;
    spec_upper_limit?: number;
  };
}

export const api = {
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Failed to fetch health');
    return res.json();
  },

  async getOverview(): Promise<OverviewStats> {
    const res = await fetch(`${API_BASE}/overview`);
    if (!res.ok) throw new Error('Failed to fetch overview stats');
    return res.json();
  },

  async getLots() {
    const res = await fetch(`${API_BASE}/lots`);
    if (!res.ok) throw new Error('Failed to fetch lots');
    return res.json();
  },

  async getComponents(params?: {
    lot_id?: string;
    decision?: string;
    anomalous_only?: boolean;
    within_spec_only?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ total: number; offset: number; limit: number; items: ComponentListItem[] }> {
    const query = new URLSearchParams();
    if (params?.lot_id) query.set('lot_id', params.lot_id);
    if (params?.decision) query.set('decision', params.decision);
    if (params?.anomalous_only) query.set('anomalous_only', 'true');
    if (params?.within_spec_only) query.set('within_spec_only', 'true');
    if (params?.search) query.set('search', params.search);
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.offset) query.set('offset', params.offset.toString());

    const res = await fetch(`${API_BASE}/components?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch components');
    return res.json();
  },

  async getComponentDetail(id: string): Promise<ComponentDetailPayload> {
    const res = await fetch(`${API_BASE}/components/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch component ${id}`);
    return res.json();
  },

  async generateDataset(seed: number = 42, n_components: number = 800) {
    const res = await fetch(`${API_BASE}/datasets/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seed, n_components, include_demo_fixtures: true })
    });
    if (!res.ok) throw new Error('Failed to generate dataset');
    return res.json();
  },

  async uploadDataset(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/datasets/upload`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  },

  getSampleCsvUrl(format: 'long' | 'wide' = 'long') {
    return `${API_BASE}/datasets/sample-csv?format=${format}`;
  },

  async analyzeEarlySignal(componentId: string) {
    const res = await fetch(`${API_BASE}/forecast/early-signal?component_id=${encodeURIComponent(componentId)}`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Early signal analysis failed');
    return res.json();
  },

  async revealHeldOutOutcome(componentId: string) {
    const res = await fetch(`${API_BASE}/forecast/reveal-heldout?component_id=${encodeURIComponent(componentId)}`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to reveal held-out outcome');
    return res.json();
  },

  async getValidation(): Promise<ModelValidationResponse> {
    const res = await fetch(`${API_BASE}/validation`);
    if (!res.ok) throw new Error('Failed to fetch validation metrics');
    return res.json();
  },

  async getDecisions(status?: string, limit: number = 100) {
    const query = new URLSearchParams();
    if (status) query.set('status', status);
    query.set('limit', limit.toString());
    const res = await fetch(`${API_BASE}/decisions?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch decisions');
    return res.json();
  },

  async updateDecisionNotes(componentId: string, notes: string) {
    const res = await fetch(`${API_BASE}/decisions/${encodeURIComponent(componentId)}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes })
    });
    if (!res.ok) throw new Error('Failed to update reviewer notes');
    return res.json();
  },

  async getScenarios(): Promise<DemoScenario[]> {
    const res = await fetch(`${API_BASE}/scenarios`);
    if (!res.ok) throw new Error('Failed to fetch demo scenarios');
    return res.json();
  },

  async getAuditRuns() {
    const res = await fetch(`${API_BASE}/audit/runs`);
    if (!res.ok) throw new Error('Failed to fetch audit runs');
    return res.json();
  },

  async getComponentReport(componentId: string) {
    const res = await fetch(`${API_BASE}/reports/component/${encodeURIComponent(componentId)}`);
    if (!res.ok) throw new Error('Failed to generate report');
    return res.json();
  }
};
