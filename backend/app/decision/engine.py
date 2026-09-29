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
    
    Principle: Decisions are deterministic rule-based and auditable.
    Machine-learning models provide calibrated forecasts and anomaly evidence;
    deterministic policies map multi-stream evidence to screening decisions.
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
        """Determines PASS, REVIEW, or HIGH RISK with full reason code attribution and trust status."""
        reasons: List[str] = []
        decision: str = "PASS"
        action: str = "PASS — no elevated risk identified in the controlled benchmark."

        limit = trajectory.absolute_upper_limit

        # Evaluate Trust Status (NORMAL, WATCH, REDUCED)
        if shift.status == "SHIFT_DETECTED" or trajectory.quality_24h in ["UNRELIABLE", "NOISY"] or forecast.uncertainty_flag == "INSUFFICIENT_DATA":
            trust_status = "REDUCED"
        elif shift.status == "WATCH" or forecast.uncertainty_flag == "HIGH_UNCERTAINTY" or forecast.interval_width > 12.0:
            trust_status = "WATCH"
        else:
            trust_status = "NORMAL"

        # Rule 1: Absolute specification violation
        if evidence.absolute_spec_status == "EXCEEDED":
            decision = "HIGH RISK"
            reasons.append("REASON_ABSOLUTE_LIMIT_EXCEEDED")
            action = f"HIGH RISK — routes the component for engineering disposition. Measured 24h value ({trajectory.val_24h} {trajectory.unit}) strictly exceeds upper spec limit ({limit} {trajectory.unit})."

        # Rule 2: Measurement Quality / Incompleteness
        elif trajectory.val_24h is None or trajectory.quality_24h in ["UNRELIABLE", "NOISY"]:
            decision = "REVIEW"
            reasons.append("REASON_POOR_MEASUREMENT_QUALITY")
            action = "Re-test 24h reading: Measurement is missing or flagged as noisy/unreliable by DAQ quality check."

        # Rule 3: Cross-lot distribution shift
        elif shift.status == "SHIFT_DETECTED":
            decision = "REVIEW"
            reasons.append("REASON_DISTRIBUTION_SHIFT_REDUCED_TRUST")
            action = "Distribution Shift Review: Incoming lot differs materially from reference distribution; predictive trust reduced to REDUCED and component routed for review."

        # Rule 4: Forecast Point Prediction crosses spec limit
        elif forecast.predicted_168h >= limit:
            decision = "HIGH RISK"
            reasons.append("REASON_FORECAST_BREACHES_SPEC")
            action = f"HIGH RISK — routes the component for engineering disposition. Early drift forecast indicates 168h value ({forecast.predicted_168h:.1f} {trajectory.unit}) will breach absolute limit ({limit} {trajectory.unit})."

        # Rule 5: Hidden Within-Spec Anomaly (Severe Lot-Relative MAD)
        elif evidence.robust_z_score >= self.thresholds["mad_outlier_threshold"]:
            decision = "HIGH RISK" if forecast.projected_slope > 0.05 else "REVIEW"
            reasons.append("REASON_LOT_RELATIVE_OUTLIER_MAD_HIGH")
            action = (
                f"Engineering Triage: Within-spec outlier detected. Component has Robust Z-score: {evidence.robust_z_score:.1f} "
                f"relative to lot median ({evidence.lot_median:.1f} {trajectory.unit}). Recommend precision parameter re-test."
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
            action = "PASS — no elevated risk identified in the controlled benchmark."

        # Structured Evidence Contributions Breakdown
        evidence_contributions = {
            "spec_compliance": f"{evidence.absolute_spec_status}: 24h = {trajectory.val_24h if trajectory.val_24h is not None else 'N/A'} {trajectory.unit} vs limit {limit:.1f} {trajectory.unit}",
            "lot_relative_anomaly": f"{evidence.lot_relative_status}: Robust Z-score = {evidence.robust_z_score:.1f} (Lot Median: {evidence.lot_median:.1f} {trajectory.unit}, MAD: {evidence.lot_mad:.2f} {trajectory.unit})",
            "drift_forecast": f"Projected 168h = {forecast.predicted_168h:.1f} {trajectory.unit} (Drift Rate: {forecast.projected_slope:+.4f} {trajectory.unit}/h)",
            "conformal_uncertainty": f"90% Conformal Interval [{forecast.conformal_lower_bound:.1f}, {forecast.conformal_upper_bound:.1f}] {trajectory.unit} (Width: {forecast.interval_width:.1f} {trajectory.unit}, Status: {forecast.uncertainty_flag})",
            "distribution_stability": f"Lot {trajectory.lot_id}: {shift.status} (Median Delta: {shift.median_delta:.2f}, Scale Ratio: {shift.mad_ratio:.2f})",
            "measurement_integrity": f"Quality Flag: {trajectory.quality_24h}, Valid Readings: {sum(1 for v in [trajectory.val_0h, trajectory.val_24h] if v is not None)}/2 early checkpoints"
        }

        # Conventional Screening Comparison
        conventional_pass = (trajectory.val_24h is not None and trajectory.val_24h <= limit)
        conventional_decision = "PASS" if conventional_pass else ("REVIEW" if trajectory.val_24h is None else "HIGH RISK")
        
        is_escape_vulnerability = conventional_pass and (decision in ["REVIEW", "HIGH RISK"])
        conventional_advantage = (
            "Conventional static screening passes this component at 24h because static threshold is unbreached. TrustBurn early warning prevents defect escape."
            if is_escape_vulnerability else
            "Screening disposition aligns with conventional specification thresholds."
        )

        conventional_screening = {
            "conventional_decision": conventional_decision,
            "conventional_rule": f"Static Threshold: y(24h) <= {limit:.1f} {trajectory.unit}",
            "defect_escape_vulnerability": "HIGH" if is_escape_vulnerability else "LOW",
            "trustburn_advantage": conventional_advantage
        }

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
            trust_status=trust_status,
            reason_codes=reasons,
            recommended_action=action,
            model_version="v1.0.0-rc",
            thresholds_applied=self.thresholds,
            evidence_summary=evidence_dict,
            evidence_contributions=evidence_contributions,
            conventional_screening=conventional_screening,
            reviewer_notes=None
        )
