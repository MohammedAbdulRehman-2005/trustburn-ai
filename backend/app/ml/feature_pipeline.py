"""STRICT NO-FUTURE-LEAKAGE Feature Extraction Pipeline.

Non-Negotiable Architecture:
- Features are strictly constructed from 0h and 24h measurements and legitimate early lot context.
- Under NO circumstance may 96h, 168h, or synthetic defect ground truth enter the feature set.
- Any attempt to pass post-24h values will raise an explicit Security/Integrity ValueError.
"""
from typing import Dict, List, Optional, Any
import numpy as np


EARLY_FEATURE_NAMES = [
    "val_0h",
    "val_24h",
    "early_delta",
    "early_slope",
    "early_ratio",
    "early_abs_diff",
    "dev_from_lot_0h",
    "dev_from_lot_24h",
    "mad_deviation_24h",
    "early_quality_score",
]


def build_early_features(
    val_0h: Optional[float],
    val_24h: Optional[float],
    quality_0h: str = "GOOD",
    quality_24h: str = "GOOD",
    lot_context_0h_median: float = 10.0,
    lot_context_24h_median: float = 10.2,
    lot_context_24h_mad: float = 1.2,
    **kwargs: Any
) -> np.ndarray:
    """Structurally extracts early burn-in prediction features using only <=24h information.
    
    Raises ValueError if post-24h information or ground-truth defect labels are passed.
    """
    # STRUCTURAL LEAKAGE ENFORCEMENT
    forbidden_keys = {"val_96h", "val_168h", "measurement_96h", "measurement_168h", "synthetic_ground_truth", "ground_truth", "defect_label"}
    for k in kwargs:
        if k in forbidden_keys and kwargs[k] is not None:
            raise ValueError(f"LEAKAGE VIOLATION: Forbidden post-24h or target key '{k}' provided to early feature extractor!")

    if val_0h is None or val_24h is None:
        # Returns an array with default imputation flags for incomplete early reads
        v0 = val_0h if val_0h is not None else lot_context_0h_median
        v24 = val_24h if val_24h is not None else lot_context_24h_median
        q_score = 0.0  # severely penalize quality score
    else:
        v0 = float(val_0h)
        v24 = float(val_24h)
        q0 = 1.0 if quality_0h == "GOOD" else (0.5 if quality_0h == "DEGRADED" else 0.0)
        q24 = 1.0 if quality_24h == "GOOD" else (0.5 if quality_24h == "DEGRADED" else 0.0)
        q_score = (q0 + q24) / 2.0

    delta = v24 - v0
    slope = delta / 24.0
    safe_v0 = max(abs(v0), 0.01)
    ratio = v24 / safe_v0
    abs_diff = abs(delta)

    dev_0h = v0 - lot_context_0h_median
    dev_24h = v24 - lot_context_24h_median

    safe_mad = max(lot_context_24h_mad, 0.001)
    mad_dev_24h = abs(v24 - lot_context_24h_median) / safe_mad

    features = [
        v0,
        v24,
        delta,
        slope,
        ratio,
        abs_diff,
        dev_0h,
        dev_24h,
        mad_dev_24h,
        q_score,
    ]

    return np.array(features, dtype=np.float64)


def extract_features_matrix(
    trajectories: List[Any],
    lot_stats_map: Dict[str, Dict[str, float]]
) -> Tuple[np.ndarray, np.ndarray, List[str]]:
    """Builds the feature matrix X (from 0h and 24h) and target y (168h) for valid training trajectories."""
    X_list = []
    y_list = []
    cids = []

    for t in trajectories:
        # We need a valid 168h target for supervised training
        if t.val_168h is None:
            continue

        lid = t.lot_id
        stats = lot_stats_map.get(lid, {"median_0h": 10.0, "median_24h": 10.2, "mad_24h": 1.2})

        feats = build_early_features(
            val_0h=t.val_0h,
            val_24h=t.val_24h,
            quality_0h=t.quality_0h,
            quality_24h=t.quality_24h,
            lot_context_0h_median=stats["median_0h"],
            lot_context_24h_median=stats["median_24h"],
            lot_context_24h_mad=stats["mad_24h"]
        )

        X_list.append(feats)
        y_list.append(float(t.val_168h))
        cids.append(t.component_id)

    return np.array(X_list), np.array(y_list), cids
