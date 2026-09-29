"""BurnIn-Bench: Six-layer physics-informed synthetic burn-in trajectory generator.

Implements the locked scientific blueprint:
L1. Physics Prior (Arrhenius thermal rate, power-law latent drift)
L2. Manufacturing Variation (Lot baseline, component offsets)
L3. Latent State (Onset, acceleration, gradual vs abrupt degradation)
L4. Measurement Process (Noise, quantization, sensor quality flags, missingness)
L5. Distribution Shift (In-distribution lots vs shifted production lot)
L6. Ground Truth (Latent mechanism labels stored separately for evaluation)
"""
import numpy as np
import pandas as pd
from typing import Tuple, List, Dict, Any, Optional
from backend.app.schemas.burnin import MeasurementRecord, ComponentTrajectory


# Locked physical & engineering constants
DEFAULT_SPEC_LIMIT = 50.0  # Iddq upper limit in uA
STAGE_HOURS = [0.0, 24.0, 96.0, 168.0]


def generate_burnin_dataset(
    seed: int = 42,
    n_components: int = 800,
    include_demo_fixtures: bool = True
) -> Tuple[List[MeasurementRecord], List[ComponentTrajectory], Dict[str, Any]]:
    """Generates synthetic burn-in trajectories across strictly isolated lots.
    
    Lots:
    - LOT-2026-A: Training Lot (~40% of standard components, in-distribution baseline ~10.0 uA)
    - LOT-2026-B: Calibration Lot (~25% of standard components, in-distribution baseline ~10.2 uA)
    - LOT-2026-C: Test Lot (~25% of standard components, in-distribution held-out baseline ~10.1 uA)
    - LOT-2026-D-SHIFT: Shifted Test Lot (~10% of standard components, shifted baseline ~24.5 uA)
    """
    rng = np.random.default_rng(seed)

    lots_config = [
        {"lot_id": "LOT-2026-A", "split": "TRAIN", "ratio": 0.40, "base_mean": 10.0, "base_std": 1.2, "is_shifted": False},
        {"lot_id": "LOT-2026-B", "split": "CALIBRATION", "ratio": 0.25, "base_mean": 10.2, "base_std": 1.3, "is_shifted": False},
        {"lot_id": "LOT-2026-C", "split": "TEST", "ratio": 0.25, "base_mean": 10.1, "base_std": 1.2, "is_shifted": False},
        {"lot_id": "LOT-2026-D-SHIFT", "split": "TEST_SHIFT", "ratio": 0.10, "base_mean": 24.5, "base_std": 3.8, "is_shifted": True},
    ]

    records: List[MeasurementRecord] = []
    trajectories: List[ComponentTrajectory] = []

    # 1. Inject Locked Demonstration Fixtures First (Ensures guaranteed presence)
    if include_demo_fixtures:
        fixtures = [
            # Scenario A: Hidden Within-Spec Anomaly
            {
                "component_id": "CMP-DEMO-WITHIN-SPEC",
                "lot_id": "LOT-2026-C",
                "split": "TEST",
                "values": [44.2, 45.1, 46.8, 48.5],
                "qualities": ["GOOD", "GOOD", "GOOD", "GOOD"],
                "truth": "LATENT_GATE_OXIDE_CONTAMINATION",
                "scenario_id": "SCENARIO_A_WITHIN_SPEC",
            },
            # Scenario B: Early Drift Warning (Crosses limit by 168h)
            {
                "component_id": "CMP-DEMO-EARLY-DRIFT",
                "lot_id": "LOT-2026-C",
                "split": "TEST",
                "values": [14.5, 24.8, 44.0, 62.1],
                "qualities": ["GOOD", "GOOD", "GOOD", "GOOD"],
                "truth": "THERMAL_ELECTROMIGRATION_ACCELERATION",
                "scenario_id": "SCENARIO_B_EARLY_DRIFT",
            },
            # Scenario C: Distribution Shift Exemplar
            {
                "component_id": "CMP-DEMO-SHIFT",
                "lot_id": "LOT-2026-D-SHIFT",
                "split": "TEST_SHIFT",
                "values": [24.1, 25.2, 26.8, 28.5],
                "qualities": ["GOOD", "GOOD", "GOOD", "GOOD"],
                "truth": "PROCESS_CORNER_SHIFTED_LOT",
                "scenario_id": "SCENARIO_C_DISTRIBUTION_SHIFT",
            },
            # Scenario D: Normal Baseline Component
            {
                "component_id": "CMP-DEMO-NORMAL",
                "lot_id": "LOT-2026-C",
                "split": "TEST",
                "values": [9.8, 10.2, 10.9, 11.4],
                "qualities": ["GOOD", "GOOD", "GOOD", "GOOD"],
                "truth": "NOMINAL_HEALTHY_DEVICE",
                "scenario_id": "SCENARIO_D_NORMAL",
            },
            # Scenario E: High-Risk Multi-Signal Breach
            {
                "component_id": "CMP-DEMO-HIGHRISK",
                "lot_id": "LOT-2026-C",
                "split": "TEST",
                "values": [28.5, 52.4, 76.0, 104.2],
                "qualities": ["GOOD", "GOOD", "GOOD", "GOOD"],
                "truth": "CATASTROPHIC_DIE_ATTACH_VOID",
                "scenario_id": "SCENARIO_E_HIGH_RISK",
            },
            # Supplementary DAQ sensor fault exemplar
            {
                "component_id": "CMP-DEMO-UNRELIABLE",
                "lot_id": "LOT-2026-C",
                "split": "TEST",
                "values": [10.2, None, 11.5, 12.0],
                "qualities": ["GOOD", "UNRELIABLE", "GOOD", "GOOD"],
                "truth": "PROBE_CONTACT_INTERMITTENCY",
                "scenario_id": "SCENARIO_EXTRA_UNRELIABLE",
            },
        ]

        for fix in fixtures:
            cid = fix["component_id"]
            lid = fix["lot_id"]
            split = fix["split"]
            vals = fix["values"]
            quals = fix["qualities"]
            truth = fix["truth"]
            scen = fix["scenario_id"]

            traj = ComponentTrajectory(
                component_id=cid,
                lot_id=lid,
                parameter_name="Iddq_uA",
                unit="uA",
                absolute_upper_limit=DEFAULT_SPEC_LIMIT,
                val_0h=vals[0],
                val_24h=vals[1],
                val_96h=vals[2],
                val_168h=vals[3],
                quality_0h=quals[0],
                quality_24h=quals[1],
                quality_96h=quals[2],
                quality_168h=quals[3],
                split_group=split,
                synthetic_ground_truth=truth,
                is_demo_fixture=True,
                demo_scenario_id=scen
            )
            trajectories.append(traj)

            for hr, v, q in zip(STAGE_HOURS, vals, quals):
                if v is not None:
                    records.append(
                        MeasurementRecord(
                            component_id=cid,
                            lot_id=lid,
                            parameter_name="Iddq_uA",
                            unit="uA",
                            measurement_hour=hr,
                            measured_value=round(float(v), 2),
                            measurement_quality=q,
                            temperature_c=125.0,
                            absolute_upper_limit=DEFAULT_SPEC_LIMIT,
                            source="synthetic_demo_fixture",
                            synthetic_ground_truth=truth
                        )
                    )

    # 2. Generate Stochastic Physics-Informed Trajectories
    comp_counter = 1001
    for lot in lots_config:
        n_lot_comps = int(n_components * lot["ratio"])
        lot_id = lot["lot_id"]
        split = lot["split"]
        base_mean = lot["base_mean"]
        base_std = lot["base_std"]
        is_shifted = lot["is_shifted"]

        # Sample lot-level micro-offset
        lot_micro_offset = rng.normal(0.0, 0.2)
        actual_lot_center = base_mean + lot_micro_offset

        for _ in range(n_lot_comps):
            cid = f"CMP-{lot_id[-1]}-{comp_counter}"
            comp_counter += 1

            # Latent mechanism selection
            # 82% Nominal, 8% Gradual Drift, 5% Abrupt Late, 3% Outlier Baseline, 2% Sensor glitch
            rand_mech = rng.random()
            if rand_mech < 0.78:
                mech_type = "NOMINAL_HEALTHY"
                c_base = rng.normal(actual_lot_center, base_std)
                c_base = max(1.0, c_base)
                # Heteroscedastic measurement noise: variance scales with current level
                sigma_noise = 0.15 + 0.012 * c_base
                t_noise = rng.normal(0, sigma_noise, size=4)
                # Mild normal aging drift: power law delta_R = c * t^0.35 + noise
                aging_rate = rng.uniform(0.005, 0.018)
                v0 = c_base + t_noise[0]
                v24 = c_base + aging_rate * (24.0 ** 0.5) + t_noise[1]
                v96 = c_base + aging_rate * (96.0 ** 0.5) + t_noise[2]
                v168 = c_base + aging_rate * (168.0 ** 0.5) + t_noise[3]
                q0, q24, q96, q168 = "GOOD", "GOOD", "GOOD", "GOOD"

            elif rand_mech < 0.83:
                # Benign static offset: elevated initial leakage but zero accelerated drift
                mech_type = "BENIGN_MANUFACTURING_OFFSET"
                c_base = rng.normal(actual_lot_center + 4.5, 0.8)
                sigma_noise = 0.18 + 0.01 * c_base
                t_noise = rng.normal(0, sigma_noise, size=4)
                flat_rate = rng.uniform(0.001, 0.005)
                v0 = c_base + t_noise[0]
                v24 = c_base + flat_rate * (24.0 ** 0.4) + t_noise[1]
                v96 = c_base + flat_rate * (96.0 ** 0.4) + t_noise[2]
                v168 = c_base + flat_rate * (168.0 ** 0.4) + t_noise[3]
                q0, q24, q96, q168 = "GOOD", "GOOD", "GOOD", "GOOD"

            elif rand_mech < 0.90:
                mech_type = "GRADUAL_LATENT_DEGRADATION"
                c_base = rng.normal(actual_lot_center + 1.5, base_std)
                # Accelerated thermal drift: Arrhenius-inspired degradation
                drift_power = rng.uniform(0.75, 1.15)
                drift_coeff = rng.uniform(0.09, 0.24)
                sigma_noise = 0.20 + 0.015 * c_base
                t_noise = rng.normal(0, sigma_noise, size=4)
                v0 = c_base + t_noise[0]
                v24 = c_base + drift_coeff * (24.0 ** drift_power) + t_noise[1]
                v96 = c_base + drift_coeff * (96.0 ** drift_power) + t_noise[2]
                v168 = c_base + drift_coeff * (168.0 ** drift_power) + t_noise[3]
                q0, q24, q96, q168 = "GOOD", "GOOD", "GOOD", "GOOD"

            elif rand_mech < 0.95:
                mech_type = "ABRUPT_LATE_BREAKDOWN"
                c_base = rng.normal(actual_lot_center, base_std)
                sigma_noise = 0.18 + 0.012 * c_base
                t_noise = rng.normal(0, sigma_noise, size=4)
                v0 = c_base + t_noise[0]
                v24 = c_base + 0.5 + t_noise[1]  # Early looks almost normal!
                # Abrupt breakdown after 48h (gate oxide dielectric rupture)
                v96 = c_base + rng.uniform(8.0, 18.0) + t_noise[2]
                v168 = c_base + rng.uniform(25.0, 48.0) + t_noise[3]
                q0, q24, q96, q168 = "GOOD", "GOOD", "GOOD", "GOOD"

            elif rand_mech < 0.98:
                mech_type = "ELEVATED_WITHIN_SPEC_OUTLIER"
                # Elevated baseline close to specification limit
                c_base = rng.normal(38.0 if not is_shifted else 44.0, 2.0)
                sigma_noise = 0.25 + 0.015 * c_base
                t_noise = rng.normal(0, sigma_noise, size=4)
                v0 = c_base + t_noise[0]
                v24 = c_base + 1.2 + t_noise[1]
                v96 = c_base + 2.5 + t_noise[2]
                v168 = c_base + 4.0 + t_noise[3]
                q0, q24, q96, q168 = "GOOD", "GOOD", "GOOD", "GOOD"

            else:
                mech_type = "MEASUREMENT_ANOMALY_OR_CONTACT_NOISE"
                c_base = rng.normal(actual_lot_center, base_std)
                v0 = c_base + rng.normal(0, 0.3)
                # Glitch at 24h: either noisy or degraded quality
                glitch = rng.choice(["degraded", "missing", "extreme_spike"])
                if glitch == "degraded":
                    v24 = c_base + rng.normal(0, 3.5)
                    q24 = "DEGRADED"
                elif glitch == "missing":
                    v24 = None
                    q24 = "UNRELIABLE"
                else:
                    v24 = c_base + 32.0  # Transient spike
                    q24 = "NOISY"
                v96 = c_base + 1.0 + rng.normal(0, 0.3)
                v168 = c_base + 1.8 + rng.normal(0, 0.3)
                q0, q96, q168 = "GOOD", "GOOD", "GOOD"

            vals = [v0, v24, v96, v168]
            quals = [q0, q24, q96, q168]

            # Round non-none values
            clean_vals = [round(float(v), 2) if v is not None else None for v in vals]

            traj = ComponentTrajectory(
                component_id=cid,
                lot_id=lot_id,
                parameter_name="Iddq_uA",
                unit="uA",
                absolute_upper_limit=DEFAULT_SPEC_LIMIT,
                val_0h=clean_vals[0],
                val_24h=clean_vals[1],
                val_96h=clean_vals[2],
                val_168h=clean_vals[3],
                quality_0h=quals[0],
                quality_24h=quals[1],
                quality_96h=quals[2],
                quality_168h=quals[3],
                split_group=split,
                synthetic_ground_truth=mech_type,
                is_demo_fixture=False
            )
            trajectories.append(traj)

            for hr, v, q in zip(STAGE_HOURS, clean_vals, quals):
                if v is not None:
                    records.append(
                        MeasurementRecord(
                            component_id=cid,
                            lot_id=lot_id,
                            parameter_name="Iddq_uA",
                            unit="uA",
                            measurement_hour=hr,
                            measured_value=v,
                            measurement_quality=q,
                            temperature_c=125.0,
                            absolute_upper_limit=DEFAULT_SPEC_LIMIT,
                            source="burnin_bench_physics_generator",
                            synthetic_ground_truth=mech_type
                        )
                    )

    meta = {
        "seed": seed,
        "total_records": len(records),
        "total_components": len(trajectories),
        "total_lots": len(lots_config),
        "splits": {
            "TRAIN": sum(1 for t in trajectories if t.split_group == "TRAIN"),
            "CALIBRATION": sum(1 for t in trajectories if t.split_group == "CALIBRATION"),
            "TEST": sum(1 for t in trajectories if t.split_group == "TEST"),
            "TEST_SHIFT": sum(1 for t in trajectories if t.split_group == "TEST_SHIFT"),
        },
        "lots": [lot["lot_id"] for lot in lots_config],
    }

    return records, trajectories, meta
