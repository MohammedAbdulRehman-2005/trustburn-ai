"""Anomaly detection engines: Conventional Absolute Screening and Robust Lot-Relative MAD."""
import numpy as np
from typing import Dict, List, Optional, Any
from sklearn.ensemble import IsolationForest
from backend.app.schemas.screening import AnomalyEvidence
from backend.app.schemas.burnin import ComponentTrajectory


class AnomalyDetector:
    """Combines deterministic specification checks with robust non-parametric lot-relative anomaly evidence."""

    def __init__(self):
        self.iso_forest: Optional[IsolationForest] = None
        self.is_fitted: bool = False

    def fit_supplementary_model(self, X_train: np.ndarray, seed: int = 42):
        """Fits an unsupervised Isolation Forest strictly as supplementary evidence."""
        if len(X_train) > 10:
            self.iso_forest = IsolationForest(
                n_estimators=50,
                contamination=0.08,
                random_state=seed,
                n_jobs=1
            )
            self.iso_forest.fit(X_train)
            self.is_fitted = True

    def calculate_lot_statistics(self, trajectories: List[ComponentTrajectory]) -> Dict[str, Dict[str, float]]:
        """Calculates robust median and MAD for each lot using <=24h measurements."""
        lot_vals_0h: Dict[str, List[float]] = {}
        lot_vals_24h: Dict[str, List[float]] = {}

        for t in trajectories:
            lid = t.lot_id
            if lid not in lot_vals_0h:
                lot_vals_0h[lid] = []
                lot_vals_24h[lid] = []

            if t.val_0h is not None:
                lot_vals_0h[lid].append(float(t.val_0h))
            if t.val_24h is not None:
                lot_vals_24h[lid].append(float(t.val_24h))

        lot_stats: Dict[str, Dict[str, float]] = {}
        for lid in lot_vals_24h:
            v0 = np.array(lot_vals_0h[lid]) if lot_vals_0h[lid] else np.array([10.0])
            v24 = np.array(lot_vals_24h[lid]) if lot_vals_24h[lid] else np.array([10.2])

            med0 = float(np.median(v0))
            med24 = float(np.median(v24))
            raw_mad = float(np.median(np.abs(v24 - med24)))
            # Consistent estimator for normal distribution: scale factor 1.4826
            consistent_mad = raw_mad * 1.4826
            # Non-zero safeguard to prevent division by zero in uniform/degenerate lots
            effective_mad = max(consistent_mad, 0.05)

            lot_stats[lid] = {
                "median_0h": round(med0, 2),
                "median_24h": round(med24, 2),
                "raw_mad_24h": round(raw_mad, 3),
                "mad_24h": round(effective_mad, 3),
                "count": len(v24)
            }

        return lot_stats

    def evaluate_component(
        self,
        trajectory: ComponentTrajectory,
        lot_stats: Dict[str, float],
        features: Optional[np.ndarray] = None
    ) -> AnomalyEvidence:
        """Evaluates a component against both absolute specification limits and robust lot distribution."""
        v24 = trajectory.val_24h if trajectory.val_24h is not None else trajectory.val_0h
        limit = trajectory.absolute_upper_limit

        # Module A: Conventional Static Limit Screening
        if v24 is None:
            spec_status = "INDETERMINATE"
            robust_z = 0.0
            lot_rel_status = "INCOMPLETE_DATA"
            rationale = "Measurement at 24h is missing. Cannot verify absolute spec compliance or lot deviation."
        else:
            if v24 > limit:
                spec_status = "EXCEEDED"
            else:
                spec_status = "WITHIN_LIMIT"

            # Module B: Robust Lot-Relative Deviation
            med = lot_stats.get("median_24h", 10.0)
            mad = lot_stats.get("mad_24h", 1.2)
            safe_mad = max(mad, 0.05)

            robust_z = round(abs(v24 - med) / safe_mad, 2)

            if robust_z >= 4.0:
                lot_rel_status = "SEVERE_OUTLIER"
                if spec_status == "WITHIN_LIMIT":
                    rationale = (
                        f"Absolute spec: PASS ({v24:.2f} {trajectory.unit} <= {limit:.1f} {trajectory.unit}). "
                        f"Lot-relative evidence: SEVERE ANOMALY (Robust Z-score: {robust_z:.1f} relative to lot median {med:.2f} {trajectory.unit}, MAD {mad:.2f} {trajectory.unit}). "
                        f"Potential latent-defect indicator: Demonstrates within-spec latent outlier missed by traditional absolute screening."
                    )
                else:
                    rationale = (
                        f"Absolute spec EXCEEDED ({v24:.2f} {trajectory.unit} > {limit:.1f} {trajectory.unit}) "
                        f"and extreme lot outlier (Robust Z-score: {robust_z:.1f})."
                    )
            elif robust_z >= 2.5:
                lot_rel_status = "ELEVATED_DRIFT"
                rationale = (
                    f"Absolute spec: {spec_status}. "
                    f"Lot-relative evidence indicates moderately elevated drift (Robust Z-score: {robust_z:.1f} from lot median {med:.2f} {trajectory.unit})."
                )
            else:
                lot_rel_status = "NOMINAL"
                rationale = (
                    f"Absolute spec: {spec_status}. "
                    f"Within normal lot distribution (Robust Z-score: {robust_z:.1f}, lot median {med:.2f} {trajectory.unit})."
                )

        # Supplementary Isolation Forest Score
        iso_score = None
        if self.is_fitted and features is not None:
            try:
                # decision_function gives signed distance to separating hyperplane
                score = float(self.iso_forest.decision_function(features.reshape(1, -1))[0])
                iso_score = round(score, 3)
            except Exception:
                iso_score = None

        return AnomalyEvidence(
            absolute_spec_status=spec_status,
            lot_median=lot_stats.get("median_24h", 10.0),
            lot_mad=lot_stats.get("mad_24h", 1.2),
            robust_z_score=robust_z,
            lot_relative_status=lot_rel_status,
            isolation_forest_score=iso_score,
            rationale=rationale
        )
