"""Schemas for screening, anomaly evidence, forecasts, shift diagnostics, and decisions."""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class AnomalyEvidence(BaseModel):
    """Evidence compiled from static and lot-relative anomaly detection."""
    absolute_spec_status: str = Field(..., description="WITHIN_LIMIT or EXCEEDED")
    lot_median: float = Field(..., description="Robust median of lot at 24h")
    lot_mad: float = Field(..., description="Robust median absolute deviation of lot")
    robust_z_score: float = Field(..., description="Normalized MAD deviation score")
    lot_relative_status: str = Field(..., description="NOMINAL, ELEVATED_DRIFT, or SEVERE_OUTLIER")
    isolation_forest_score: Optional[float] = Field(default=None, description="Supplementary unsupervised score")
    rationale: str = Field(..., description="Human-readable transparent engineering rationale")


class EarlyForecast(BaseModel):
    """Early 24h -> 168h forecast with conformal uncertainty bounds."""
    predicted_168h: float = Field(..., description="HistGradientBoosting predicted 168h value")
    baseline_linear_168h: float = Field(..., description="Simple 0h-24h linear extrapolation")
    conformal_lower_bound: float = Field(..., description="Lower 90% conformal bound")
    conformal_upper_bound: float = Field(..., description="Upper 90% conformal bound")
    interval_width: float = Field(..., description="Conformal interval width")
    projected_slope: float = Field(..., description="Projected drift rate in units/hour")
    confidence_level: float = Field(default=0.90, description="Nominal conformal confidence level (1 - alpha)")
    actual_168h_heldout: Optional[float] = Field(default=None, description="Held-out true 168h measurement")
    error_heldout: Optional[float] = Field(default=None, description="Prediction error (actual - predicted)")
    heldout_revealed: bool = Field(default=False, description="Whether held-out outcome has been revealed")
    uncertainty_flag: str = Field(default="STANDARD", description="STANDARD, HIGH_UNCERTAINTY, or INSUFFICIENT_DATA")


class ShiftDiagnostic(BaseModel):
    """Cross-lot distribution shift diagnostic against baseline reference lots."""
    lot_id: str
    reference_lot_ids: List[str]
    current_median: float
    reference_median: float
    current_mad: float
    reference_mad: float
    median_delta: float = Field(..., description="Normalized median difference")
    mad_ratio: float = Field(..., description="Scale ratio (current MAD / reference MAD)")
    psi_score: Optional[float] = Field(default=None, description="Population Stability Index")
    status: str = Field(..., description="NORMAL, WATCH, or SHIFT_DETECTED")
    interpretation: str


class ScreeningDecision(BaseModel):
    """Deterministic final screening decision and auditable justification."""
    component_id: str
    lot_id: str
    run_id: str
    timestamp: str
    decision: str = Field(..., description="PASS, REVIEW, or HIGH RISK")
    reason_codes: List[str] = Field(..., description="Machine-readable decision reason codes")
    recommended_action: str = Field(..., description="Recommended engineering verification step")
    model_version: str = Field(default="v1.0.0-rc")
    thresholds_applied: Dict[str, float]
    evidence_summary: Dict[str, Any]
    reviewer_notes: Optional[str] = None
