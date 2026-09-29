"""Tests for cross-lot distribution shift diagnostic."""
import pytest
from backend.app.schemas.burnin import ComponentTrajectory
from backend.app.ml.shift_detector import DistributionShiftDetector


def test_distribution_shift_detection():
    """Verify detector flags shifted lot while marking nominal lot as NORMAL."""
    import numpy as np
    detector = DistributionShiftDetector()
    rng = np.random.default_rng(42)

    # Reference lots: baseline ~10.0 uA
    trajs = []
    for i in range(100):
        trajs.append(ComponentTrajectory(
            component_id=f"REF-{i}",
            lot_id="LOT-REF",
            val_0h=9.8,
            val_24h=float(rng.normal(10.0, 1.0)),
            split_group="TRAIN"
        ))

    detector.establish_reference_baseline(trajs, reference_split_groups=["TRAIN"])
    assert detector.is_referenced

    # Nominal lot: baseline ~10.1 uA
    nom_trajs = [
        ComponentTrajectory(component_id=f"NOM-{i}", lot_id="LOT-NOM", val_24h=float(rng.normal(10.1, 1.0)))
        for i in range(50)
    ]
    nom_diag = detector.evaluate_lot("LOT-NOM", nom_trajs)
    assert nom_diag.status in ["NORMAL", "WATCH"]

    # Shifted lot: baseline ~25.0 uA
    shifted_trajs = [
        ComponentTrajectory(component_id=f"SHF-{i}", lot_id="LOT-SHIFTED", val_24h=float(rng.normal(25.0, 2.5)))
        for i in range(50)
    ]
    shift_diag = detector.evaluate_lot("LOT-SHIFTED", shifted_trajs)
    assert shift_diag.status == "SHIFT_DETECTED"
    assert shift_diag.median_delta > 3.0
