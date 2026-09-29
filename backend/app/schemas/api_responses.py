"""API request and response models."""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from backend.app.schemas.burnin import ComponentTrajectory, MeasurementRecord
from backend.app.schemas.screening import ScreeningDecision, AnomalyEvidence, EarlyForecast, ShiftDiagnostic


class OverviewStats(BaseModel):
    total_lots: int
    total_components: int
    screened_components: int
    dynamic_anomalies: int
    early_warnings: int
    pass_count: int
    review_count: int
    high_risk_count: int
    within_spec_anomalies: int
    risk_distribution: Dict[str, int]
    risk_by_lot: List[Dict[str, Any]]
    active_dataset_id: str
    active_seed: int
    model_version: str
    last_run_timestamp: Optional[str] = None


class ComponentDetailResponse(BaseModel):
    trajectory: ComponentTrajectory
    evidence: Optional[AnomalyEvidence] = None
    forecast: Optional[EarlyForecast] = None
    shift: Optional[ShiftDiagnostic] = None
    decision: Optional[ScreeningDecision] = None
    historical_context: Dict[str, Any] = Field(default_factory=dict)


class DatasetGenerateRequest(BaseModel):
    seed: int = 42
    n_components: int = 800
    n_lots: int = 4
    include_demo_fixtures: bool = True


class DatasetUploadResponse(BaseModel):
    success: bool
    message: str
    total_rows: int
    total_components: int
    total_lots: int
    quality_issues_found: int
    summary: Dict[str, Any]


class ModelValidationResponse(BaseModel):
    model_version: str
    seed: int
    train_lots: List[str]
    calibration_lots: List[str]
    test_lots: List[str]
    features_used: List[str]
    n_train_samples: int
    n_calibration_samples: int
    n_test_samples: int
    forecast_metrics: Dict[str, Any]
    uncertainty_metrics: Dict[str, Any]
    shift_impact: Dict[str, Any]
    confusion_matrix: Dict[str, int]
    classification_metrics: Dict[str, Any]
    honesty_disclaimer: str


class DemoScenario(BaseModel):
    scenario_id: str
    title: str
    description: str
    component_id: str
    lot_id: str
    demonstration_lesson: str
    expected_decision: str
