"""Tests for BurnIn-Bench physics generator and CSV validator."""
import pytest
from backend.app.data.generator import generate_burnin_dataset
from backend.app.data.validator import validate_and_parse_csv, generate_sample_csv
from backend.app.data.splits import verify_lot_isolation


def test_deterministic_generation():
    """Verify that same seed generates identical records."""
    r1, t1, m1 = generate_burnin_dataset(seed=42, n_components=50)
    r2, t2, m2 = generate_burnin_dataset(seed=42, n_components=50)

    assert len(r1) == len(r2)
    assert len(t1) == len(t2)
    assert t1[0].val_0h == t2[0].val_0h
    assert t1[0].val_24h == t2[0].val_24h


def test_seed_variation():
    """Verify that different seeds produce different trajectories."""
    _, t1, _ = generate_burnin_dataset(seed=42, n_components=50)
    _, t2, _ = generate_burnin_dataset(seed=999, n_components=50)

    # First non-fixture component should differ
    assert t1[10].val_0h != t2[10].val_0h


def test_lot_isolation():
    """Verify train, calibration, and test lots are strictly isolated with no component overlap."""
    _, trajs, _ = generate_burnin_dataset(seed=42, n_components=100)
    isolation_info = verify_lot_isolation(trajs)
    assert isolation_info["status"] == "STRICTLY_ISOLATED"


def test_sample_csv_parsing():
    """Verify wide and long sample CSV generation and parsing."""
    wide_csv = generate_sample_csv("wide")
    records, trajs, summary = validate_and_parse_csv(wide_csv)
    assert summary["format_detected"] == "wide"
    assert len(trajs) == 6

    long_csv = generate_sample_csv("long")
    records_l, trajs_l, summary_l = validate_and_parse_csv(long_csv)
    assert summary_l["format_detected"] == "long"
    assert len(trajs_l) == 3


def test_invalid_csv_handling():
    """Verify parser detects missing required columns."""
    invalid_csv = "bad_col_1,bad_col_2\n1,2"
    with pytest.raises(ValueError):
        validate_and_parse_csv(invalid_csv)
