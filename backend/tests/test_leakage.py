"""Tests for strict no-future-leakage architecture."""
import pytest
import numpy as np
from backend.app.ml.feature_pipeline import build_early_features, EARLY_FEATURE_NAMES


def test_no_future_leakage_structural_enforcement():
    """Verify that attempting to pass post-24h data raises an explicit ValueError."""
    # Attempting to pass 96h measurement
    with pytest.raises(ValueError, match="LEAKAGE VIOLATION"):
        build_early_features(val_0h=10.0, val_24h=10.5, val_96h=15.0)

    # Attempting to pass 168h measurement
    with pytest.raises(ValueError, match="LEAKAGE VIOLATION"):
        build_early_features(val_0h=10.0, val_24h=10.5, val_168h=25.0)

    # Attempting to pass synthetic ground truth labels
    with pytest.raises(ValueError, match="LEAKAGE VIOLATION"):
        build_early_features(val_0h=10.0, val_24h=10.5, synthetic_ground_truth="DEFECTIVE")


def test_early_feature_dimensions():
    """Verify that valid feature extraction produces fixed expected dimension."""
    feats = build_early_features(
        val_0h=10.0,
        val_24h=10.5,
        quality_0h="GOOD",
        quality_24h="GOOD"
    )
    assert isinstance(feats, np.ndarray)
    assert len(feats) == len(EARLY_FEATURE_NAMES)
    assert len(feats) == 10
