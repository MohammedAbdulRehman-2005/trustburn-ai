"""Audit trail data schemas."""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class AuditRunRecord(BaseModel):
    run_id: str
    timestamp: str
    dataset_identifier: str
    data_seed: int
    model_version: str
    features_used: List[str]
    train_lots: List[str]
    calibration_lots: List[str]
    test_lots: List[str]
    thresholds_applied: Dict[str, float]
    total_screened: int
    pass_count: int
    review_count: int
    high_risk_count: int
    decision_policy_version: str = "POL-2026-01-DETERMINISTIC"


class ComponentAuditRecord(BaseModel):
    run_id: str
    component_id: str
    lot_id: str
    timestamp: str
    measured_0h: Optional[float]
    measured_24h: Optional[float]
    measured_96h: Optional[float]
    measured_168h: Optional[float]
    anomaly_score: float
    forecast_168h: float
    conformal_lower: float
    conformal_upper: float
    shift_status: str
    decision: str
    reason_codes: List[str]
    recommended_action: str
    reviewer_notes: Optional[str] = None
