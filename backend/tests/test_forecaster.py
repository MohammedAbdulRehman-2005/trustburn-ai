"""Tests for 168h drift forecaster."""
import pytest
import numpy as np
from backend.app.ml.forecaster import DriftForecaster


def test_forecaster_training_and_prediction():
    """Verify supervised training on synthetic data and deterministic inference."""
    forecaster = DriftForecaster()

    # Synthetic training batch
    rng = np.random.default_rng(42)
    X_train = rng.normal(10.0, 2.0, size=(100, 10))
    # Target has realistic slight upward drift
    y_train = X_train[:, 1] + 1.5 + rng.normal(0, 0.3, size=100)

    train_meta = forecaster.train(X_train, y_train, seed=42)
    assert forecaster.is_trained
    assert train_meta["n_train_samples"] == 100
    assert train_meta["train_mae"] < 2.0

    # Deterministic prediction
    sample_feat = X_train[0]
    pred1 = forecaster.predict_point(sample_feat)
    pred2 = forecaster.predict_point(sample_feat)
    assert pred1 == pred2


def test_forecaster_evaluation_metrics():
    """Verify model evaluation compares against linear baseline without fabricating values."""
    forecaster = DriftForecaster()
    rng = np.random.default_rng(42)
    X = rng.normal(10.0, 1.5, size=(80, 10))
    y = X[:, 1] + 1.2 + rng.normal(0, 0.25, size=80)

    forecaster.train(X[:50], y[:50], seed=42)
    metrics = forecaster.evaluate_test_set(X[50:], y[50:])

    assert "model_mae" in metrics
    assert "baseline_mae" in metrics
    assert metrics["n_test_samples"] == 30
    assert metrics["model_mae"] >= 0.0
