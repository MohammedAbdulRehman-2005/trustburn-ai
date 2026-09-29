"""Tests for absolute screening and robust lot-relative anomaly detection."""
import pytest
from backend.app.schemas.burnin import ComponentTrajectory
from backend.app.ml.anomaly_detector import AnomalyDetector


def test_hidden_within_spec_anomaly_demonstration():
    """Verify 45.1 uA component in 10 uA lot with 50 uA limit is Static PASS but Lot-Relative Anomaly."""
    detector = AnomalyDetector()

    # Demonstration component: 45.1 uA (below 50 uA limit)
    traj = ComponentTrajectory(
        component_id="CMP-TEST-45UA",
        lot_id="LOT-TEST-1",
        parameter_name="Iddq_uA",
        unit="uA",
        absolute_upper_limit=50.0,
        val_0h=44.2,
        val_24h=45.1,
        quality_24h="GOOD"
    )

    lot_stats = {
        "median_24h": 10.1,
        "mad_24h": 1.2
    }

    evidence = detector.evaluate_component(traj, lot_stats)

    # 1. Static Absolute Specification Check: PASS!
    assert evidence.absolute_spec_status == "WITHIN_LIMIT"
    assert traj.val_24h <= traj.absolute_upper_limit

    # 2. Robust Lot-Relative Anomaly Check: SEVERE OUTLIER!
    assert evidence.robust_z_score > 15.0  # (45.1 - 10.1) / 1.2 = ~29.1
    assert evidence.lot_relative_status == "SEVERE_OUTLIER"
    assert "within-spec latent outlier" in evidence.rationale.lower()


def test_absolute_limit_exceeded():
    """Verify component strictly above 50 uA is flagged as EXCEEDED."""
    detector = AnomalyDetector()
    traj = ComponentTrajectory(
        component_id="CMP-TEST-55UA",
        lot_id="LOT-TEST-1",
        parameter_name="Iddq_uA",
        unit="uA",
        absolute_upper_limit=50.0,
        val_0h=48.0,
        val_24h=55.5,
        quality_24h="GOOD"
    )
    lot_stats = {"median_24h": 10.0, "mad_24h": 1.2}
    evidence = detector.evaluate_component(traj, lot_stats)

    assert evidence.absolute_spec_status == "EXCEEDED"


def test_zero_mad_safeguard():
    """Verify detector handles degenerate uniform lot without zero division."""
    detector = AnomalyDetector()
    traj = ComponentTrajectory(
        component_id="CMP-TEST-UNIFORM",
        lot_id="LOT-UNIFORM",
        val_0h=10.0,
        val_24h=12.0
    )
    # Zero MAD lot stats
    lot_stats = {"median_24h": 10.0, "mad_24h": 0.0}
    evidence = detector.evaluate_component(traj, lot_stats)

    assert evidence.robust_z_score > 0.0
    assert not float("inf") == evidence.robust_z_score
