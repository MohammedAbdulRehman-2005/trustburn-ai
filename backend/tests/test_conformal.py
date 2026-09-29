"""Tests for Split Conformal Uncertainty Quantification."""
import pytest
import numpy as np
from backend.app.ml.conformal import SplitConformalCalibrator


def test_split_conformal_calibration():
    """Verify calibration derives finite-sample quantile and accurate intervals."""
    calibrator = SplitConformalCalibrator(alpha=0.10)

    # 100 calibration points with known error distribution
    rng = np.random.default_rng(42)
    y_true_cal = np.array([12.0 + rng.normal(0, 1.0) for _ in range(100)])
    y_pred_cal = np.array([12.0 for _ in range(100)])

    cal_res = calibrator.calibrate(y_true_cal, y_pred_cal)
    assert calibrator.is_calibrated
    assert cal_res["status"] == "CALIBRATED"
    assert calibrator.q_hat is not None
    assert calibrator.q_hat > 0.5

    # Test interval generation
    low, high, width, flag = calibrator.predict_interval(point_prediction=20.0)
    assert low < 20.0 < high
    assert high - low == pytest.approx(width, 0.05)


def test_conformal_coverage_evaluation():
    """Verify empirical coverage is evaluated on held-out test data."""
    calibrator = SplitConformalCalibrator(alpha=0.10)
    rng = np.random.default_rng(42)
    y_true_cal = np.array([10.0 + rng.normal(0, 1.0) for _ in range(200)])
    y_pred_cal = np.array([10.0 for _ in range(200)])
    calibrator.calibrate(y_true_cal, y_pred_cal)

    # In-distribution test set
    y_true_test = np.array([10.0 + rng.normal(0, 1.0) for _ in range(200)])
    y_pred_test = np.array([10.0 for _ in range(200)])

    eval_res = calibrator.evaluate_coverage(y_true_test, y_pred_test)
    assert eval_res["status"] == "EVALUATED"
    # Nominal target is 90%; empirical coverage should be near 90% (85% - 95%)
    assert 82.0 <= eval_res["empirical_coverage_pct"] <= 98.0


def test_insufficient_calibration_data():
    """Verify honest behavior when calibration set is too small."""
    calibrator = SplitConformalCalibrator(alpha=0.10)
    res = calibrator.calibrate(np.array([1.0, 2.0]), np.array([1.0, 2.0]))
    assert res["status"] == "INSUFFICIENT_CALIBRATION_DATA"
    assert not calibrator.is_calibrated
