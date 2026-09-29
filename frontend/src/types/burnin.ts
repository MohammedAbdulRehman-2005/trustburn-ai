export interface ComponentTrajectory {
  component_id: string;
  lot_id: string;
  parameter_name: string;
  unit: string;
  absolute_upper_limit: number;
  val_0h: number | null;
  val_24h: number | null;
  val_96h: number | null;
  val_168h: number | null;
  quality_0h: string;
  quality_24h: string;
  quality_96h: string;
  quality_168h: string;
  temperature_c: number;
  split_group: string;
  synthetic_ground_truth: string | null;
  is_demo_fixture: boolean;
  demo_scenario_id: string | null;
}

export interface AnomalyEvidence {
  absolute_spec_status: 'WITHIN_LIMIT' | 'EXCEEDED' | 'INDETERMINATE';
  lot_median: number;
  lot_mad: number;
  robust_z_score: number;
  lot_relative_status: 'NOMINAL' | 'ELEVATED_DRIFT' | 'SEVERE_OUTLIER' | 'INCOMPLETE_DATA';
  isolation_forest_score: number | null;
  rationale: string;
}

export interface EarlyForecast {
  predicted_168h: number;
  baseline_linear_168h: number;
  conformal_lower_bound: number;
  conformal_upper_bound: number;
  interval_width: number;
  projected_slope: number;
  confidence_level: number;
  actual_168h_heldout: number | null;
  error_heldout: number | null;
  heldout_revealed: boolean;
  uncertainty_flag: 'STANDARD' | 'HIGH_UNCERTAINTY' | 'INSUFFICIENT_DATA';
}

export interface ShiftDiagnostic {
  lot_id: string;
  reference_lot_ids: string[];
  current_median: number;
  reference_median: number;
  current_mad: number;
  reference_mad: number;
  median_delta: number;
  mad_ratio: number;
  psi_score: number | null;
  status: 'NORMAL' | 'WATCH' | 'SHIFT_DETECTED';
  interpretation: string;
}

export interface ScreeningDecision {
  component_id: string;
  lot_id: string;
  run_id: string;
  timestamp: string;
  decision: 'PASS' | 'REVIEW' | 'HIGH RISK';
  reason_codes: string[];
  recommended_action: string;
  model_version: string;
  thresholds_applied: Record<string, number>;
  evidence_summary: Record<string, any>;
  reviewer_notes: string | null;
}

export interface ComponentListItem {
  component_id: string;
  lot_id: string;
  parameter_name: string;
  unit: string;
  val_0h: number | null;
  val_24h: number | null;
  val_96h: number | null;
  val_168h: number | null;
  quality_24h: string;
  absolute_spec_status: string;
  robust_z_score: number;
  lot_relative_status: string;
  predicted_168h: number | null;
  conformal_lower: number | null;
  conformal_upper: number | null;
  decision: 'PASS' | 'REVIEW' | 'HIGH RISK';
  reason_codes: string[];
  recommended_action: string;
  is_demo_fixture: boolean;
  demo_scenario_id: string | null;
}

export interface OverviewStats {
  total_lots: number;
  total_components: number;
  screened_components: number;
  dynamic_anomalies: number;
  early_warnings: number;
  pass_count: number;
  review_count: number;
  high_risk_count: number;
  within_spec_anomalies: number;
  risk_distribution: {
    PASS: number;
    REVIEW: number;
    HIGH_RISK: number;
  };
  risk_by_lot: Array<{
    lot_id: string;
    total: number;
    pass: number;
    review: number;
    high_risk: number;
    shift_status: string;
  }>;
  active_dataset_id: string;
  active_seed: number;
  model_version: string;
  last_run_timestamp: string;
}

export interface DemoScenario {
  scenario_id: string;
  title: string;
  description: string;
  component_id: string;
  lot_id: string;
  demonstration_lesson: string;
  expected_decision: string;
}

export interface ModelValidationResponse {
  model_version: string;
  seed: number;
  train_lots: string[];
  calibration_lots: string[];
  test_lots: string[];
  features_used: string[];
  n_train_samples: number;
  n_calibration_samples: number;
  n_test_samples: number;
  forecast_metrics: {
    n_test_samples: number;
    model_mae: number;
    model_rmse: number;
    baseline_mae: number;
    baseline_rmse: number;
    improvement_pct: number;
  };
  uncertainty_metrics: {
    empirical_coverage_pct: number;
    target_coverage_pct: number;
    coverage_gap: number;
    mean_interval_width: number;
    n_samples: number;
    status: string;
    interpretation: string;
  };
  shift_impact: {
    in_distribution_coverage_pct: number;
    shifted_distribution_coverage_pct: number;
    degradation_delta: number;
    lesson: string;
  };
  confusion_matrix: {
    true_positive: number;
    false_positive: number;
    true_negative: number;
    false_negative: number;
  };
  classification_metrics: {
    precision: number;
    recall: number;
    f1_score: number;
    false_negative_rate: number;
  };
  honesty_disclaimer: string;
}
