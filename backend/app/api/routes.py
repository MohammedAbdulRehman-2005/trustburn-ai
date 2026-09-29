"""FastAPI HTTP Route Definitions for TrustBurn AI."""
from fastapi import APIRouter, HTTPException, UploadFile, File, Query, Response
from typing import List, Optional, Dict, Any
from backend.app.state import GLOBAL_STATE
from backend.app.schemas.api_responses import (
    OverviewStats,
    ComponentDetailResponse,
    DatasetGenerateRequest,
    DatasetUploadResponse,
    ModelValidationResponse,
    DemoScenario
)
from backend.app.schemas.burnin import ComponentTrajectory
from backend.app.schemas.screening import EarlyForecast, AnomalyEvidence, ScreeningDecision, ShiftDiagnostic
from backend.app.data.validator import validate_and_parse_csv, generate_sample_csv

router = APIRouter()


@router.get("/health")
def get_health():
    """System liveness and environment readiness health check."""
    return {
        "status": "healthy",
        "service": "TrustBurn AI Screening Backend",
        "version": "v1.0.0-rc",
        "models_trained": GLOBAL_STATE.forecaster.is_trained,
        "conformal_calibrated": GLOBAL_STATE.conformal.is_calibrated,
        "active_dataset": GLOBAL_STATE.dataset_id,
        "components_loaded": len(GLOBAL_STATE.trajectories)
    }


@router.get("/overview", response_model=OverviewStats)
def get_overview():
    """Returns overview statistics computed from active backend screening state."""
    stats = GLOBAL_STATE.get_overview_statistics()
    return stats


@router.get("/lots")
def get_lots():
    """Returns unique manufacturing lots with their screening metrics and shift status."""
    lots = sorted(list({t.lot_id for t in GLOBAL_STATE.trajectories}))
    res = []
    for lid in lots:
        diag = GLOBAL_STATE.shift_map.get(lid)
        stats = GLOBAL_STATE.lot_stats.get(lid, {})
        comps = [t for t in GLOBAL_STATE.trajectories if t.lot_id == lid]
        res.append({
            "lot_id": lid,
            "component_count": len(comps),
            "median_0h": stats.get("median_0h"),
            "median_24h": stats.get("median_24h"),
            "mad_24h": stats.get("mad_24h"),
            "shift_status": diag.status if diag else "UNKNOWN",
            "median_delta": diag.median_delta if diag else 0.0,
            "mad_ratio": diag.mad_ratio if diag else 1.0,
            "interpretation": diag.interpretation if diag else ""
        })
    return res


@router.get("/components")
def list_components(
    lot_id: Optional[str] = Query(None),
    decision: Optional[str] = Query(None),
    anomalous_only: bool = Query(False),
    within_spec_only: bool = Query(False),
    search: Optional[str] = Query(None),
    limit: int = Query(200, le=1000),
    offset: int = Query(0)
):
    """Searchable, filterable list of component trajectories with screening results."""
    items = []

    for t in GLOBAL_STATE.trajectories:
        cid = t.component_id
        lid = t.lot_id
        dec = GLOBAL_STATE.decision_map.get(cid)
        ev = GLOBAL_STATE.evidence_map.get(cid)
        fc = GLOBAL_STATE.forecast_map.get(cid)

        # Apply filters
        if lot_id and lid != lot_id:
            continue
        if decision and dec and dec.decision != decision:
            continue
        if anomalous_only and ev and ev.robust_z_score < 2.5:
            continue
        if within_spec_only and ev:
            # Within static limit but severe lot outlier
            if not (ev.absolute_spec_status == "WITHIN_LIMIT" and ev.robust_z_score >= 4.0):
                continue
        if search:
            q = search.lower()
            if q not in cid.lower() and q not in lid.lower():
                continue

        items.append({
            "component_id": cid,
            "lot_id": lid,
            "parameter_name": t.parameter_name,
            "unit": t.unit,
            "val_0h": t.val_0h,
            "val_24h": t.val_24h,
            "val_96h": t.val_96h,
            "val_168h": t.val_168h,
            "quality_24h": t.quality_24h,
            "absolute_spec_status": ev.absolute_spec_status if ev else "UNKNOWN",
            "robust_z_score": ev.robust_z_score if ev else 0.0,
            "lot_relative_status": ev.lot_relative_status if ev else "UNKNOWN",
            "predicted_168h": fc.predicted_168h if fc else None,
            "conformal_lower": fc.conformal_lower_bound if fc else None,
            "conformal_upper": fc.conformal_upper_bound if fc else None,
            "decision": dec.decision if dec else "UNKNOWN",
            "trust_status": dec.trust_status if dec else "NORMAL",
            "reason_codes": dec.reason_codes if dec else [],
            "recommended_action": dec.recommended_action if dec else "",
            "is_demo_fixture": t.is_demo_fixture,
            "demo_scenario_id": t.demo_scenario_id,
        })

    total = len(items)
    paged = items[offset: offset + limit]
    return {
        "total": total,
        "offset": offset,
        "limit": limit,
        "items": paged
    }


@router.get("/components/{component_id}", response_model=ComponentDetailResponse)
def get_component_detail(component_id: str):
    """Retrieves complete 4-point trajectory, evidence, forecast, and decision for a component."""
    traj = next((t for t in GLOBAL_STATE.trajectories if t.component_id == component_id), None)
    if not traj:
        raise HTTPException(status_code=404, detail=f"Component '{component_id}' not found.")

    ev = GLOBAL_STATE.evidence_map.get(component_id)
    fc = GLOBAL_STATE.forecast_map.get(component_id)
    sh = GLOBAL_STATE.shift_map.get(traj.lot_id)
    dec = GLOBAL_STATE.decision_map.get(component_id)
    l_stats = GLOBAL_STATE.lot_stats.get(traj.lot_id, {})

    return ComponentDetailResponse(
        trajectory=traj,
        evidence=ev,
        forecast=fc,
        shift=sh,
        decision=dec,
        historical_context={
            "lot_median_24h": l_stats.get("median_24h"),
            "lot_mad_24h": l_stats.get("mad_24h"),
            "lot_component_count": l_stats.get("count"),
            "spec_upper_limit": traj.absolute_upper_limit
        }
    )


@router.post("/datasets/generate")
def generate_dataset(req: DatasetGenerateRequest):
    """Regenerates BurnIn-Bench synthetic trajectories with specified seed and component count."""
    GLOBAL_STATE.generate_and_load(seed=req.seed, n_components=req.n_components)
    return {
        "status": "success",
        "dataset_id": GLOBAL_STATE.dataset_id,
        "seed": req.seed,
        "total_components": len(GLOBAL_STATE.trajectories),
        "total_lots": len(GLOBAL_STATE.dataset_meta.get("lots", []))
    }


@router.post("/datasets/upload", response_model=DatasetUploadResponse)
async def upload_dataset(file: UploadFile = File(...)):
    """Uploads and validates user CSV (long or wide format)."""
    contents = await file.read()
    try:
        csv_str = contents.decode("utf-8")
    except Exception:
        raise HTTPException(status_code=400, detail="File must be valid UTF-8 CSV.")

    records, trajectories, summary = validate_and_parse_csv(csv_str, filename=file.filename or "upload.csv")

    GLOBAL_STATE.records = records
    GLOBAL_STATE.trajectories = trajectories
    GLOBAL_STATE.dataset_id = f"UPLOAD-{file.filename}"
    GLOBAL_STATE.dataset_meta = summary

    # Check if upload contains dedicated training partition
    has_train = any(t.split_group == "TRAIN" for t in trajectories)
    if has_train:
        GLOBAL_STATE.train_pipeline()
    else:
        # Update lot statistics for the incoming uploaded lot(s)
        GLOBAL_STATE.lot_stats = GLOBAL_STATE.anomaly_detector.calculate_lot_statistics(GLOBAL_STATE.trajectories)

    GLOBAL_STATE.run_full_screening()

    return DatasetUploadResponse(
        success=True,
        message="Dataset uploaded, validated, and screened successfully.",
        total_rows=summary["total_rows_parsed"],
        total_components=summary["total_components"],
        total_lots=summary["total_lots"],
        quality_issues_found=summary["total_issues_count"],
        summary=summary
    )


@router.get("/datasets/sample-csv")
def download_sample_csv(format: str = Query("long")):
    """Returns downloadable sample CSV file."""
    csv_content = generate_sample_csv(format_type=format)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=trustburn_sample_{format}.csv"}
    )


@router.post("/forecast/early-signal")
def analyze_early_signal(component_id: str = Query(...)):
    """Runs inference strictly using <=24h early measurements."""
    traj = next((t for t in GLOBAL_STATE.trajectories if t.component_id == component_id), None)
    if not traj:
        raise HTTPException(status_code=404, detail="Component not found.")

    l_stats = GLOBAL_STATE.lot_stats.get(traj.lot_id, {"median_0h": 10.0, "median_24h": 10.2, "mad_24h": 1.2})
    from backend.app.ml.feature_pipeline import build_early_features
    feats = build_early_features(
        val_0h=traj.val_0h,
        val_24h=traj.val_24h,
        quality_0h=traj.quality_0h,
        quality_24h=traj.quality_24h,
        lot_context_0h_median=l_stats.get("median_0h", 10.0),
        lot_context_24h_median=l_stats.get("median_24h", 10.2),
        lot_context_24h_mad=l_stats.get("mad_24h", 1.2)
    )

    pt_pred = GLOBAL_STATE.forecaster.predict_point(feats)
    c_low, c_high, c_width, u_flag = GLOBAL_STATE.conformal.predict_interval(pt_pred)
    ev = GLOBAL_STATE.anomaly_detector.evaluate_component(traj, l_stats, feats)
    shift_diag = GLOBAL_STATE.shift_map.get(traj.lot_id)

    forecast = EarlyForecast(
        predicted_168h=round(pt_pred, 2),
        baseline_linear_168h=round(GLOBAL_STATE.forecaster.predict_linear_baseline(traj.val_0h, traj.val_24h), 2),
        conformal_lower_bound=c_low,
        conformal_upper_bound=c_high,
        interval_width=c_width,
        projected_slope=round((pt_pred - (traj.val_24h or 10.0)) / 144.0, 4),
        confidence_level=0.90,
        actual_168h_heldout=None,  # Frozen!
        error_heldout=None,
        heldout_revealed=False,
        uncertainty_flag=u_flag
    )

    dec = GLOBAL_STATE.decision_engine.evaluate(
        trajectory=traj,
        evidence=ev,
        forecast=forecast,
        shift=shift_diag,
        run_id=GLOBAL_STATE.active_run_id
    )

    return {
        "component_id": component_id,
        "lot_id": traj.lot_id,
        "early_observations": {"val_0h": traj.val_0h, "val_24h": traj.val_24h},
        "forecast": forecast,
        "evidence": ev,
        "decision": dec
    }


@router.post("/forecast/reveal-heldout")
def reveal_heldout_outcome(component_id: str = Query(...)):
    """Retrospectively reveals 96h and 168h measurements for evaluation without modifying the early forecast."""
    traj = next((t for t in GLOBAL_STATE.trajectories if t.component_id == component_id), None)
    if not traj:
        raise HTTPException(status_code=404, detail="Component not found.")

    fc = GLOBAL_STATE.forecast_map.get(component_id)
    if not fc:
        raise HTTPException(status_code=400, detail="Early forecast must be run first.")

    actual_168 = traj.val_168h
    actual_96 = traj.val_96h
    error = round(actual_168 - fc.predicted_168h, 2) if actual_168 is not None else None
    crossed = actual_168 >= traj.absolute_upper_limit if actual_168 is not None else False

    return {
        "component_id": component_id,
        "predicted_168h": fc.predicted_168h,
        "conformal_lower": fc.conformal_lower_bound,
        "conformal_upper": fc.conformal_upper_bound,
        "actual_96h": actual_96,
        "actual_168h": actual_168,
        "prediction_error": error,
        "actual_crossed_spec_limit": crossed,
        "within_conformal_interval": (
            (fc.conformal_lower_bound <= actual_168 <= fc.conformal_upper_bound)
            if actual_168 is not None else False
        ),
        "synthetic_ground_truth": traj.synthetic_ground_truth
    }


@router.get("/validation", response_model=ModelValidationResponse)
def get_validation():
    """Returns actual held-out validation metrics, conformal coverage, and distribution shift degradation."""
    if not GLOBAL_STATE.validation_metrics:
        raise HTTPException(status_code=400, detail="Models have not yet been evaluated.")
    return GLOBAL_STATE.validation_metrics


@router.get("/decisions")
def get_decisions(
    status: Optional[str] = Query(None),
    limit: int = Query(100),
    offset: int = Query(0)
):
    """Retrieves QA decision triage queue."""
    all_decs = list(GLOBAL_STATE.decision_map.values())
    if status:
        all_decs = [d for d in all_decs if d.decision == status]

    total = len(all_decs)
    paged = all_decs[offset: offset + limit]
    return {
        "total": total,
        "items": paged
    }


@router.post("/decisions/{component_id}/notes")
def update_decision_notes(component_id: str, payload: Dict[str, str]):
    """Appends QA reviewer notes to component audit record without mutating machine decision."""
    notes = payload.get("notes", "")
    dec = GLOBAL_STATE.decision_map.get(component_id)
    if dec:
        dec.reviewer_notes = notes
    GLOBAL_STATE.audit_store.update_reviewer_notes(GLOBAL_STATE.active_run_id, component_id, notes)
    return {"status": "success", "component_id": component_id, "notes": notes}


@router.get("/scenarios", response_model=List[DemoScenario])
def get_scenarios():
    """Returns the 5 locked demonstration scenarios for testing and screen-recording."""
    return GLOBAL_STATE.get_demo_scenarios()


@router.get("/audit/runs")
def list_audit_runs():
    """Lists historical screening runs in persistent storage."""
    return GLOBAL_STATE.audit_store.list_runs()


@router.get("/audit/verify-chain")
def verify_audit_chain():
    """Cryptographically verifies the SHA-256 tamper-evident hash chain."""
    return GLOBAL_STATE.audit_store.verify_chain_integrity()


@router.get("/reports/component/{component_id}")
def generate_component_report(component_id: str):
    """Generates an exportable engineering QA report for a specific component."""
    traj = next((t for t in GLOBAL_STATE.trajectories if t.component_id == component_id), None)
    if not traj:
        raise HTTPException(status_code=404, detail="Component not found.")

    ev = GLOBAL_STATE.evidence_map.get(component_id)
    fc = GLOBAL_STATE.forecast_map.get(component_id)
    sh = GLOBAL_STATE.shift_map.get(traj.lot_id)
    dec = GLOBAL_STATE.decision_map.get(component_id)

    return {
        "system": "TrustBurn AI — Screening & Risk Intelligence",
        "report_type": "COMPONENT_RISK_AUDIT_REPORT",
        "component_id": component_id,
        "lot_id": traj.lot_id,
        "run_id": GLOBAL_STATE.active_run_id,
        "screening_decision": dec.decision if dec else "UNKNOWN",
        "reason_codes": dec.reason_codes if dec else [],
        "recommended_action": dec.recommended_action if dec else "",
        "measurements": {
            "0h": traj.val_0h,
            "24h": traj.val_24h,
            "96h_heldout": traj.val_96h,
            "168h_heldout": traj.val_168h,
            "unit": traj.unit,
            "spec_limit": traj.absolute_upper_limit
        },
        "anomaly_evidence": {
            "spec_status": ev.absolute_spec_status if ev else None,
            "lot_median_24h": ev.lot_median if ev else None,
            "lot_mad_24h": ev.lot_mad if ev else None,
            "robust_z_score": ev.robust_z_score if ev else None,
            "rationale": ev.rationale if ev else None
        },
        "drift_forecast": {
            "predicted_168h": fc.predicted_168h if fc else None,
            "conformal_lower_bound": fc.conformal_lower_bound if fc else None,
            "conformal_upper_bound": fc.conformal_upper_bound if fc else None,
            "confidence_level": "90% Marginal Conformal",
            "projected_slope": fc.projected_slope if fc else None
        },
        "shift_trust_diagnostic": {
            "lot_status": sh.status if sh else None,
            "median_delta": sh.median_delta if sh else None,
            "mad_ratio": sh.mad_ratio if sh else None,
            "interpretation": sh.interpretation if sh else None
        },
        "provenance_and_audit": {
            "model_version": GLOBAL_STATE.forecaster.model_version,
            "data_seed": GLOBAL_STATE.active_seed,
            "feature_set": "Strict <=24h non-leaking features",
            "disclaimer": "SYNTHETIC DEMONSTRATION DATA / RESEARCH PROTOTYPE. A prediction is not an observed physical failure. Not certified ISRO screening software."
        }
    }
