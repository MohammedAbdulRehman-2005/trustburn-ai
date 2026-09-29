"""Cross-lot distribution shift diagnostic engine."""
import numpy as np
from typing import Dict, List, Optional, Any, Tuple
from backend.app.schemas.screening import ShiftDiagnostic
from backend.app.schemas.burnin import ComponentTrajectory


class DistributionShiftDetector:
    """Interpretable, non-parametric cross-lot distribution shift diagnostic.
    
    Compares the measurement distribution of an incoming lot against established reference lots.
    """

    def __init__(
        self,
        median_shift_threshold: float = 3.0,
        mad_ratio_threshold: float = 2.2,
        psi_threshold: float = 0.25
    ):
        self.median_shift_threshold = median_shift_threshold
        self.mad_ratio_threshold = mad_ratio_threshold
        self.psi_threshold = psi_threshold
        self.ref_lots: List[str] = []
        self.ref_median: float = 10.0
        self.ref_mad: float = 1.2
        self.ref_values: np.ndarray = np.array([])
        self.is_referenced: bool = False

    def establish_reference_baseline(
        self,
        trajectories: List[ComponentTrajectory],
        reference_split_groups: List[str] = ["TRAIN", "CALIBRATION"]
    ):
        """Builds empirical reference distribution from declared reference lots."""
        vals = []
        lots = set()
        for t in trajectories:
            if t.split_group in reference_split_groups and t.val_24h is not None:
                vals.append(float(t.val_24h))
                lots.add(t.lot_id)

        if len(vals) < 20:
            return

        self.ref_values = np.array(vals)
        self.ref_lots = sorted(list(lots))
        self.ref_median = float(np.median(self.ref_values))
        raw_mad = float(np.median(np.abs(self.ref_values - self.ref_median)))
        self.ref_mad = max(raw_mad * 1.4826, 0.05)
        self.is_referenced = True

    def calculate_psi(self, ref_vals: np.ndarray, curr_vals: np.ndarray, n_bins: int = 10) -> float:
        """Calculates Population Stability Index between reference and current distribution."""
        if len(ref_vals) < 10 or len(curr_vals) < 10:
            return 0.0

        percentiles = np.linspace(0, 100, n_bins + 1)
        raw_edges = np.percentile(ref_vals, percentiles)
        bin_edges = np.unique(raw_edges)
        if len(bin_edges) < 3:
            min_v, max_v = float(np.min(ref_vals)), float(np.max(ref_vals))
            if min_v == max_v:
                return 0.0
            bin_edges = np.linspace(min_v, max_v, n_bins + 1)

        bin_edges[0] = -np.inf
        bin_edges[-1] = np.inf

        ref_counts, _ = np.histogram(ref_vals, bins=bin_edges)
        curr_counts, _ = np.histogram(curr_vals, bins=bin_edges)

        ref_prop = np.maximum(ref_counts / len(ref_vals), 1e-4)
        curr_prop = np.maximum(curr_counts / len(curr_vals), 1e-4)

        psi = np.sum((curr_prop - ref_prop) * np.log(curr_prop / ref_prop))
        return float(round(psi, 3))

    def evaluate_lot(
        self,
        lot_id: str,
        trajectories: List[ComponentTrajectory]
    ) -> ShiftDiagnostic:
        """Evaluates lot-level shift metrics against reference baseline."""
        lot_vals = [float(t.val_24h) for t in trajectories if t.lot_id == lot_id and t.val_24h is not None]

        if not lot_vals or not self.is_referenced:
            return ShiftDiagnostic(
                lot_id=lot_id,
                reference_lot_ids=self.ref_lots,
                current_median=10.0,
                reference_median=self.ref_median,
                current_mad=1.2,
                reference_mad=self.ref_mad,
                median_delta=0.0,
                mad_ratio=1.0,
                psi_score=0.0,
                status="NORMAL",
                interpretation="Insufficient reference or lot data to evaluate distribution shift."
            )

        v_curr = np.array(lot_vals)
        c_med = float(np.median(v_curr))
        raw_c_mad = float(np.median(np.abs(v_curr - c_med)))
        c_mad = max(raw_c_mad * 1.4826, 0.05)

        # Standardized median deviation relative to reference spread
        median_delta = round(abs(c_med - self.ref_median) / self.ref_mad, 2)
        # Scale ratio
        mad_ratio = round(c_mad / self.ref_mad, 2)
        n_bins = 5 if len(v_curr) < 100 else 10
        psi = self.calculate_psi(self.ref_values, v_curr, n_bins=n_bins)

        # Decision on shift status: Location shift, Scale shift, or joint divergence
        if (
            median_delta >= self.median_shift_threshold
            or mad_ratio >= self.mad_ratio_threshold
            or (median_delta >= 1.5 and psi >= self.psi_threshold)
        ):
            status = "SHIFT_DETECTED"
            interpretation = (
                f"Significant distribution shift detected (Median Delta: {median_delta:.2f} MAD sigmas, "
                f"Scale Ratio: {mad_ratio:.2f}, PSI: {psi:.3f}). Automated trust reduced; route to REVIEW."
            )
        elif median_delta >= 1.8 or mad_ratio >= 1.6 or (median_delta >= 0.8 and psi >= 0.15):
            status = "WATCH"
            interpretation = (
                f"Moderate lot drift observed (Median Delta: {median_delta:.2f}, PSI: {psi:.3f}). "
                f"Screening predictions remain active with heightened sensitivity."
            )
        else:
            status = "NORMAL"
            interpretation = (
                f"Lot distribution closely aligns with reference baseline (Median Delta: {median_delta:.2f}, "
                f"Scale Ratio: {mad_ratio:.2f}, PSI: {psi:.3f}). Normal trust established."
            )

        return ShiftDiagnostic(
            lot_id=lot_id,
            reference_lot_ids=self.ref_lots,
            current_median=round(c_med, 2),
            reference_median=round(self.ref_median, 2),
            current_mad=round(c_mad, 2),
            reference_mad=round(self.ref_mad, 2),
            median_delta=median_delta,
            mad_ratio=mad_ratio,
            psi_score=psi,
            status=status,
            interpretation=interpretation
        )
