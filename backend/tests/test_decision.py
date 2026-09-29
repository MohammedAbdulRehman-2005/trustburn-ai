"""Tests for deterministic screening decision engine."""
import pytest
from backend.app.schemas.burnin import ComponentTrajectory
from backend.app.schemas.screening import AnomalyEvidence, EarlyForecast, ShiftDiagnostic
from backend.app.decision.engine import DecisionEngine


@pytest.fixture
def base_context():
    engine = DecisionEngine()
    traj = ComponentTrajectory(
        component_id="CMP-TEST-1",
        lot_id="LOT-1",
        parameter_name="Iddq_uA",
        unit="uA",
        absolute_upper_limit=50.0,
        val_0h=10.0,
        val_24h=10.5,
        quality_24h="GOOD"
    )
    ev = AnomalyEvidence(
        absolute_spec_status="WITHIN_LIMIT",
        lot_median=10.2,
        lot_mad=1.2,
        robust_z_score=0.25,
        lot_relative_status="NOMINAL",
        rationale="Nominal"
    )
    fc = EarlyForecast(
        predicted_168h=11.5,
        baseline_linear_168h=13.0,
        conformal_lower_bound=8.0,
        conformal_upper_bound=15.0,
        interval_width=7.0,
        projected_slope=0.007,
        confidence_level=0.90
    )
    sh = ShiftDiagnostic(
        lot_id="LOT-1",
        reference_lot_ids=["LOT-REF"],
        current_median=10.2,
        reference_median=10.0,
        current_mad=1.2,
        reference_mad=1.2,
        median_delta=0.15,
        mad_ratio=1.0,
        status="NORMAL",
        interpretation="Normal"
    )
    return engine, traj, ev, fc, sh


def test_decision_pass(base_context):
    engine, traj, ev, fc, sh = base_context
    decision = engine.evaluate(traj, ev, fc, sh, run_id="TEST-RUN")
    assert decision.decision == "PASS"
    assert "REASON_NOMINAL_STABLE" in decision.reason_codes


def test_decision_absolute_limit_high_risk(base_context):
    engine, traj, ev, fc, sh = base_context
    traj.val_24h = 55.0
    ev.absolute_spec_status = "EXCEEDED"
    decision = engine.evaluate(traj, ev, fc, sh, run_id="TEST-RUN")
    assert decision.decision == "HIGH RISK"
    assert "REASON_ABSOLUTE_LIMIT_EXCEEDED" in decision.reason_codes


def test_decision_forecast_breach_high_risk(base_context):
    engine, traj, ev, fc, sh = base_context
    fc.predicted_168h = 55.0
    decision = engine.evaluate(traj, ev, fc, sh, run_id="TEST-RUN")
    assert decision.decision == "HIGH RISK"
    assert "REASON_FORECAST_BREACHES_SPEC" in decision.reason_codes


def test_decision_distribution_shift_review(base_context):
    engine, traj, ev, fc, sh = base_context
    sh.status = "SHIFT_DETECTED"
    decision = engine.evaluate(traj, ev, fc, sh, run_id="TEST-RUN")
    assert decision.decision == "REVIEW"
    assert "REASON_DISTRIBUTION_SHIFT_REDUCED_TRUST" in decision.reason_codes


def test_decision_unreliable_quality_review(base_context):
    engine, traj, ev, fc, sh = base_context
    traj.quality_24h = "UNRELIABLE"
    decision = engine.evaluate(traj, ev, fc, sh, run_id="TEST-RUN")
    assert decision.decision == "REVIEW"
    assert "REASON_POOR_MEASUREMENT_QUALITY" in decision.reason_codes
