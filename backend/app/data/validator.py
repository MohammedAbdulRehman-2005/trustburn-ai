"""Data validation, parsing, schema verification, and sample CSV generation."""
import io
import pandas as pd
import numpy as np
from typing import Tuple, List, Dict, Any, Optional
from backend.app.schemas.burnin import MeasurementRecord, ComponentTrajectory

VALID_HOURS = {0.0, 24.0, 96.0, 168.0}
VALID_QUALITIES = {"GOOD", "DEGRADED", "UNRELIABLE", "NOISY"}


def validate_and_parse_csv(
    file_content: str,
    filename: str = "upload.csv"
) -> Tuple[List[MeasurementRecord], List[ComponentTrajectory], Dict[str, Any]]:
    """Validates and parses uploaded CSV content into structured records and trajectories.
    
    Supports both:
    1. Long format: component_id, lot_id, parameter_name, unit, measurement_hour, measured_value, measurement_quality, ...
    2. Wide format: component_id, lot_id, val_0h, val_24h, val_96h, val_168h, [quality_0h, ...], ...
    """
    try:
        df = pd.read_csv(io.StringIO(file_content))
    except Exception as e:
        raise ValueError(f"Failed to parse CSV file: {str(e)}")

    if df.empty:
        raise ValueError("Uploaded CSV is empty.")

    issues: List[str] = []
    columns = [c.strip().lower() for c in df.columns]
    col_map = {orig: orig.strip().lower() for orig in df.columns}
    df = df.rename(columns=col_map)

    # Detect Wide vs Long format
    is_wide = ("val_0h" in df.columns or "0h" in df.columns or "val_24h" in df.columns)
    
    records: List[MeasurementRecord] = []
    trajectories: List[ComponentTrajectory] = []

    if is_wide:
        # Standardize wide column names
        c_map = {
            "0h": "val_0h", "24h": "val_24h", "96h": "val_96h", "168h": "val_168h",
            "val_0": "val_0h", "val_24": "val_24h", "val_96": "val_96h", "val_168": "val_168h"
        }
        df = df.rename(columns=c_map)

        req_cols = ["component_id", "lot_id"]
        for rc in req_cols:
            if rc not in df.columns:
                raise ValueError(f"Wide CSV missing required column: '{rc}'")

        duplicates = df.duplicated(subset=["component_id"]).sum()
        if duplicates > 0:
            issues.append(f"Detected {duplicates} duplicate component_id rows. Only unique components should be submitted.")

        for _, row in df.iterrows():
            cid = str(row["component_id"]).strip()
            lid = str(row["lot_id"]).strip()
            param = str(row.get("parameter_name", "Iddq_uA")).strip()
            unit = str(row.get("unit", "uA")).strip()
            limit = float(row.get("absolute_upper_limit", 50.0))

            vals = {}
            quals = {}
            for hr, h_col in [(0.0, "val_0h"), (24.0, "val_24h"), (96.0, "val_96h"), (168.0, "val_168h")]:
                v = row.get(h_col)
                if pd.isna(v) or str(v).strip() == "" or str(v).lower() == "nan":
                    vals[hr] = None
                else:
                    try:
                        vals[hr] = float(v)
                    except ValueError:
                        vals[hr] = None
                        issues.append(f"Invalid numerical value '{v}' for component {cid} at {hr}h.")

                q_col = f"quality_{int(hr)}h"
                q = str(row.get(q_col, "GOOD")).strip().upper()
                if q not in VALID_QUALITIES:
                    q = "DEGRADED"
                    issues.append(f"Unknown quality flag '{row.get(q_col)}' for component {cid} at {hr}h (defaulted to DEGRADED).")
                quals[hr] = q

            traj = ComponentTrajectory(
                component_id=cid,
                lot_id=lid,
                parameter_name=param,
                unit=unit,
                absolute_upper_limit=limit,
                val_0h=vals[0.0],
                val_24h=vals[24.0],
                val_96h=vals[96.0],
                val_168h=vals[168.0],
                quality_0h=quals[0.0],
                quality_24h=quals[24.0],
                quality_96h=quals[96.0],
                quality_168h=quals[168.0],
                split_group="TEST",
                synthetic_ground_truth=str(row.get("synthetic_ground_truth", "UPLOADED")),
                is_demo_fixture=False
            )
            trajectories.append(traj)

            for hr in [0.0, 24.0, 96.0, 168.0]:
                if vals[hr] is not None:
                    records.append(
                        MeasurementRecord(
                            component_id=cid,
                            lot_id=lid,
                            parameter_name=param,
                            unit=unit,
                            measurement_hour=hr,
                            measured_value=round(vals[hr], 2),
                            measurement_quality=quals[hr],
                            temperature_c=float(row.get("temperature_c", 125.0)),
                            absolute_upper_limit=limit,
                            source=f"upload_{filename}",
                            synthetic_ground_truth=traj.synthetic_ground_truth
                        )
                    )

    else:
        # Long format validation
        req_cols = ["component_id", "lot_id", "measurement_hour", "measured_value"]
        for rc in req_cols:
            if rc not in df.columns:
                raise ValueError(f"Long CSV missing required column: '{rc}'. Expected columns: {req_cols}")

        dups = df.duplicated(subset=["component_id", "measurement_hour"]).sum()
        if dups > 0:
            issues.append(f"Detected {dups} duplicate (component_id, measurement_hour) records.")

        grouped = df.groupby("component_id")
        for cid, group in grouped:
            cid = str(cid).strip()
            first_row = group.iloc[0]
            lid = str(first_row["lot_id"]).strip()
            param = str(first_row.get("parameter_name", "Iddq_uA")).strip()
            unit = str(first_row.get("unit", "uA")).strip()
            limit = float(first_row.get("absolute_upper_limit", 50.0))

            vals = {0.0: None, 24.0: None, 96.0: None, 168.0: None}
            quals = {0.0: "GOOD", 24.0: "GOOD", 96.0: "GOOD", 168.0: "GOOD"}

            for _, row in group.iterrows():
                try:
                    hr = float(row["measurement_hour"])
                except Exception:
                    issues.append(f"Invalid measurement_hour '{row['measurement_hour']}' for {cid}")
                    continue

                if hr not in VALID_HOURS:
                    issues.append(f"Hour {hr} not standard burn-in stage (0, 24, 96, 168) for {cid}.")

                try:
                    v = float(row["measured_value"])
                    if v < 0:
                        issues.append(f"Negative parameter measurement {v} for component {cid} at {hr}h.")
                except Exception:
                    v = None
                    issues.append(f"Non-numeric measurement for component {cid} at {hr}h.")

                q = str(row.get("measurement_quality", "GOOD")).strip().upper()
                if q not in VALID_QUALITIES:
                    q = "DEGRADED"

                if hr in vals:
                    vals[hr] = v
                    quals[hr] = q

                if v is not None:
                    records.append(
                        MeasurementRecord(
                            component_id=cid,
                            lot_id=lid,
                            parameter_name=param,
                            unit=unit,
                            measurement_hour=hr,
                            measured_value=round(v, 2),
                            measurement_quality=q,
                            temperature_c=float(row.get("temperature_c", 125.0)),
                            absolute_upper_limit=limit,
                            source=f"upload_{filename}",
                            synthetic_ground_truth=str(row.get("synthetic_ground_truth", "UPLOADED"))
                        )
                    )

            traj = ComponentTrajectory(
                component_id=cid,
                lot_id=lid,
                parameter_name=param,
                unit=unit,
                absolute_upper_limit=limit,
                val_0h=vals[0.0],
                val_24h=vals[24.0],
                val_96h=vals[96.0],
                val_168h=vals[168.0],
                quality_0h=quals[0.0],
                quality_24h=quals[24.0],
                quality_96h=quals[96.0],
                quality_168h=quals[168.0],
                split_group="TEST",
                synthetic_ground_truth=str(first_row.get("synthetic_ground_truth", "UPLOADED")),
                is_demo_fixture=False
            )
            trajectories.append(traj)

    # Compute Quality Metrics
    total_components = len(trajectories)
    complete_components = sum(1 for t in trajectories if all(v is not None for v in [t.val_0h, t.val_24h, t.val_96h, t.val_168h]))
    early_available = sum(1 for t in trajectories if t.val_0h is not None and t.val_24h is not None)
    unique_lots = list({t.lot_id for t in trajectories})

    summary = {
        "format_detected": "wide" if is_wide else "long",
        "total_rows_parsed": len(df),
        "total_components": total_components,
        "total_lots": len(unique_lots),
        "unique_lots": unique_lots,
        "complete_trajectories": complete_components,
        "early_stage_ready": early_available,
        "issues_detected": issues[:20],  # show first 20 warnings
        "total_issues_count": len(issues),
        "quality_score_percent": round(100.0 * (1.0 - min(1.0, len(issues) / max(1, total_components * 4))), 1)
    }

    return records, trajectories, summary


def generate_sample_csv(format_type: str = "long") -> str:
    """Generates a clean downloadable demonstration CSV."""
    if format_type == "wide":
        rows = [
            "component_id,lot_id,parameter_name,unit,absolute_upper_limit,val_0h,val_24h,val_96h,val_168h,quality_0h,quality_24h,quality_96h,quality_168h",
            "CMP-EXP-001,LOT-SAMPLE-1,Iddq_uA,uA,50.0,9.85,10.21,10.88,11.35,GOOD,GOOD,GOOD,GOOD",
            "CMP-EXP-002,LOT-SAMPLE-1,Iddq_uA,uA,50.0,10.12,10.45,11.02,11.58,GOOD,GOOD,GOOD,GOOD",
            "CMP-EXP-003,LOT-SAMPLE-1,Iddq_uA,uA,50.0,44.20,45.10,46.80,48.50,GOOD,GOOD,GOOD,GOOD",
            "CMP-EXP-004,LOT-SAMPLE-1,Iddq_uA,uA,50.0,14.50,24.80,44.00,62.10,GOOD,GOOD,GOOD,GOOD",
            "CMP-EXP-005,LOT-SAMPLE-1,Iddq_uA,uA,50.0,10.05,,11.20,11.75,GOOD,UNRELIABLE,GOOD,GOOD",
            "CMP-EXP-006,LOT-SAMPLE-2,Iddq_uA,uA,50.0,24.50,25.80,27.20,29.10,GOOD,GOOD,GOOD,GOOD",
        ]
        return "\n".join(rows)
    else:
        rows = [
            "component_id,lot_id,parameter_name,unit,measurement_hour,measured_value,measurement_quality,absolute_upper_limit",
            "CMP-EXP-001,LOT-SAMPLE-1,Iddq_uA,uA,0.0,9.85,GOOD,50.0",
            "CMP-EXP-001,LOT-SAMPLE-1,Iddq_uA,uA,24.0,10.21,GOOD,50.0",
            "CMP-EXP-001,LOT-SAMPLE-1,Iddq_uA,uA,96.0,10.88,GOOD,50.0",
            "CMP-EXP-001,LOT-SAMPLE-1,Iddq_uA,uA,168.0,11.35,GOOD,50.0",
            "CMP-EXP-002,LOT-SAMPLE-1,Iddq_uA,uA,0.0,10.12,GOOD,50.0",
            "CMP-EXP-002,LOT-SAMPLE-1,Iddq_uA,uA,24.0,10.45,GOOD,50.0",
            "CMP-EXP-002,LOT-SAMPLE-1,Iddq_uA,uA,96.0,11.02,GOOD,50.0",
            "CMP-EXP-002,LOT-SAMPLE-1,Iddq_uA,uA,168.0,11.58,GOOD,50.0",
            "CMP-EXP-003,LOT-SAMPLE-1,Iddq_uA,uA,0.0,44.20,GOOD,50.0",
            "CMP-EXP-003,LOT-SAMPLE-1,Iddq_uA,uA,24.0,45.10,GOOD,50.0",
            "CMP-EXP-003,LOT-SAMPLE-1,Iddq_uA,uA,96.0,46.80,GOOD,50.0",
            "CMP-EXP-003,LOT-SAMPLE-1,Iddq_uA,uA,168.0,48.50,GOOD,50.0",
        ]
        return "\n".join(rows)
