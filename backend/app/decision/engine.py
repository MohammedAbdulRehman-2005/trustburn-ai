"""Deterministic Screening Decision Engine with Reason Codes and Actionable Verification Guidance."""
from typing import Dict, List, Any, Optional
from datetime import datetime
from backend.app.schemas.burnin import ComponentTrajectory
from backend.app.schemas.screening import (
    AnomalyEvidence,
    EarlyForecast,
    ShiftDiagnostic,
    ScreeningDecision,
)


class DecisionEngine:
    """Deterministic rule-based decision engine integrating multiple evidence streams.
    
    Non-negotiable principle: Decisions are 100% deterministic and auditable.
    LLMs or narrative layers can summarize evidence, but never override machine decisions.
    """

    def __init__(self, policy_version: str = "POL-2026-01-DETERMINISTIC"):
        self.policy_version = policy_version
        self.thresholds = {
            "absolute_spec_limit": 50.0,
            "mad_outlier_threshold": 4.0,
            "mad_elevated_threshold": 2.5,
            "forecast_slope_high_risk": 0.20,
            "conformal_confidence": 0.90,
        }

    def evaluate(
        self,
        trajectory: ComponentTrajectory,
        evidence: AnomalyEvidence,
        forecast: EarlyForecast,
        shift: ShiftDiagnostic,
        run_id: str
    ) -> ScreeningDecision:
        """Determines PASS, REVIEW, or HIGH RISK with full reason code attribution."""
        reasons: List[str] = []
        decision: str = "PASS"
        action: str = "Nominal trajectory: Cleared for standard flight-model screening schedule."

        limit = trajectory.absolute_upper_limit

        # Rule 1: Absolute specification violation
        if evidence.absolute_spec_status == "EXCEEDED":
            decision = "HIGH RISK"
            reasons.append("REASON_ABSOLUTE_LIMIT_EXCEEDED")
            action = f"Immediate Quarantine: Measured 24h value ({trajectory.val_24h} {trajectory.unit}) strictly exceeds upper spec limit ({limit} {trajectory.unit})."

        # Rule 2: Measurement Quality / Incompleteness
        elif trajectory.val_24h is None or trajectory.quality_24h in ["UNRELIABLE", "NOISY"]:
            decision = "REVIEW"
            reasons.append("REASON_POOR_MEASUREMENT_QUALITY")
            action = "Re-test 24h reading: Measurement is missing or flagged as noisy/unreliable by DAQ quality check."

        # Rule 3: Cross-lot distribution shift
        elif shift.status == "SHIFT_DETECTED":
            decision = "REVIEW"
            reasons.append("REASON_DISTRIBUTION_SHIFT_REDUCED_TRUST")
            action = "Lot Quarantine & Re-characterization: Current lot exhibits statistically significant distribution shift relative to reference baseline."

        # Rule 4: Forecast Point Prediction crosses spec limit
        elif forecast.predicted_168h >= limit:
            decision = "HIGH RISK"
            reasons.append("REASON_FORECAST_BREACHES_SPEC")
            action = f"Early Warning Quarantine: Early drift forecast indicates 168h value ({forecast.predicted_168h:.1f} {trajectory.unit}) will breach absolute limit ({limit} {trajectory.unit})."

        # Rule 5: Hidden Within-Spec Anomaly (Severe Lot-Relative MAD)
        elif evidence.robust_z_score >= self.thresholds["mad_outlier_threshold"]:
            decision = "HIGH RISK" if forecast.projected_slope > 0.05 else "REVIEW"
            reasons.append("REASON_LOT_RELATIVE_OUTLIER_MAD_HIGH")
            action = (
                f"Engineering Triage: Within-spec anomaly detected. Component is {evidence.robust_z_score:.1f} MAD sigmas "
                f"from lot median ({evidence.lot_median:.1f} {trajectory.unit}). Recommend precision parameter re-test."
            )

        # Rule 6: Conformal interval crosses spec limit (Uncertainty-aware caution)
        elif forecast.conformal_upper_bound >= limit:
            decision = "REVIEW"
            reasons.append("REASON_UNCERTAINTY_CROSSES_SPEC")
            action = (
                f"Mandate 96h intermediate checkpoint: 90% conformal upper bound ({forecast.conformal_upper_bound:.1f} {trajectory.unit}) "
                f"crosses limit ({limit} {trajectory.unit}) despite nominal point prediction ({forecast.predicted_168h:.1f} {trajectory.unit})."
            )

        # Rule 7: Moderately elevated drift
        elif evidence.robust_z_score >= self.thresholds["mad_elevated_threshold"]:
            decision = "REVIEW"
            reasons.append("REASON_ELEVATED_LOT_DRIFT")
            action = "Extended Monitoring: Moderate peer-relative drift observed. Continue burn-in to 96h checkpoint."

        # Rule 8: Nominal
        else:
            decision = "PASS"
            reasons.append("REASON_NOMINAL_STABLE")
            action = "Nominal trajectory: Cleared for standard flight-model screening schedule."

        evidence_dict = {
            "val_0h": trajectory.val_0h,
            "val_24h": trajectory.val_24h,
            "lot_median_24h": evidence.lot_median,
            "lot_mad_24h": evidence.lot_mad,
            "robust_z_score": evidence.robust_z_score,
            "predicted_168h": forecast.predicted_168h,
            "conformal_lower": forecast.conformal_lower_bound,
            "conformal_upper": forecast.conformal_upper_bound,
            "shift_status": shift.status,
            "quality_24h": trajectory.quality_24h,
        }

        return ScreeningDecision(
            component_id=trajectory.component_id,
            lot_id=trajectory.lot_id,
            run_id=run_id,
            timestamp=datetime.now().isoformat(),
            decision=decision,
            reason_codes=reasons,
            recommended_action=action,
            model_version="v1.0.0-rc",
            thresholds_applied=self.thresholds,
            evidence_summary=evidence_dict,
            reviewer_notes=None
        )
