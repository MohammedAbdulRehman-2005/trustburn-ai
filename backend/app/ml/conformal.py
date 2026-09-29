"""Split Conformal Prediction Engine for 168h Drift Forecasting Uncertainty Quantification."""
import numpy as np
from typing import Dict, List, Optional, Tuple, Any


class SplitConformalCalibrator:
    """Derives distribution-free finite-sample prediction intervals using a held-out calibration lot."""

    def __init__(self, alpha: float = 0.10):
        self.alpha = alpha  # 90% target coverage (1 - alpha)
        self.q_hat: Optional[float] = None
        self.calibration_residuals: Optional[np.ndarray] = None
        self.n_calibration: int = 0
        self.is_calibrated: bool = False

    def calibrate(
        self,
        y_true_cal: np.ndarray,
        y_pred_cal: np.ndarray
    ) -> Dict[str, Any]:
        """Calibrates conformal quantile score on independent calibration lot."""
        n = len(y_true_cal)
        if n < 10:
            self.is_calibrated = False
            return {
                "status": "INSUFFICIENT_CALIBRATION_DATA",
                "n_samples": n,
                "message": "At least 10 calibration trajectories are required for valid conformal calibration."
            }

        self.n_calibration = n
        residuals = np.abs(y_true_cal - y_pred_cal)
        self.calibration_residuals = residuals

        # Split conformal quantile with finite sample correction: ceil((n+1)*(1-alpha)) / n
        p = min(1.0, np.ceil((n + 1) * (1.0 - self.alpha)) / n)
        self.q_hat = float(np.quantile(residuals, p, method="higher"))
        self.is_calibrated = True

        return {
            "status": "CALIBRATED",
            "n_calibration_samples": n,
            "target_coverage": round((1.0 - self.alpha) * 100, 1),
            "conformal_quantile_q": round(self.q_hat, 3),
            "mean_calibration_residual": round(float(np.mean(residuals)), 3),
            "median_calibration_residual": round(float(np.median(residuals)), 3),
        }

    def predict_interval(self, point_prediction: float) -> Tuple[float, float, float, str]:
        """Returns (lower_bound, upper_bound, interval_width, uncertainty_flag)."""
        if not self.is_calibrated or self.q_hat is None:
            # Fallback heuristic if uncalibrated
            delta = max(2.5, point_prediction * 0.15)
            return (
                round(point_prediction - delta, 2),
                round(point_prediction + delta, 2),
                round(delta * 2.0, 2),
                "INSUFFICIENT_DATA"
            )

        lower = round(point_prediction - self.q_hat, 2)
        upper = round(point_prediction + self.q_hat, 2)
        width = round(2.0 * self.q_hat, 2)
        flag = "HIGH_UNCERTAINTY" if width > 12.0 else "STANDARD"

        return lower, upper, width, flag

    def evaluate_coverage(
        self,
        y_true_test: np.ndarray,
        y_pred_test: np.ndarray
    ) -> Dict[str, Any]:
        """Evaluates empirical coverage and interval width on test lot."""
        if not self.is_calibrated or self.q_hat is None or len(y_true_test) == 0:
            return {
                "empirical_coverage_pct": 0.0,
                "target_coverage_pct": (1.0 - self.alpha) * 100,
                "coverage_gap": 0.0,
                "mean_interval_width": 0.0,
                "n_samples": len(y_true_test),
                "status": "NOT_EVALUATED"
            }

        lower_bounds = y_pred_test - self.q_hat
        upper_bounds = y_pred_test + self.q_hat

        covered = (y_true_test >= lower_bounds) & (y_true_test <= upper_bounds)
        emp_coverage = float(np.mean(covered)) * 100.0
        target_coverage = (1.0 - self.alpha) * 100.0

        return {
            "empirical_coverage_pct": round(emp_coverage, 1),
            "target_coverage_pct": round(target_coverage, 1),
            "coverage_gap": round(emp_coverage - target_coverage, 1),
            "mean_interval_width": round(2.0 * self.q_hat, 3),
            "n_samples": len(y_true_test),
            "status": "EVALUATED",
            "interpretation": (
                "Nominal coverage maintained on in-distribution data."
                if emp_coverage >= target_coverage - 3.0
                else "Coverage degradation detected — likely due to distribution shift violating exchangeability."
            )
        }
