"""FastAPI Endpoint integration tests."""
import pytest
from starlette.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_api_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["models_trained"] is True
    assert data["conformal_calibrated"] is True


def test_api_overview():
    res = client.get("/api/overview")
    assert res.status_code == 200
    data = res.json()
    assert data["total_components"] > 0
    assert data["pass_count"] >= 0
    assert data["review_count"] >= 0
    assert data["high_risk_count"] >= 0
    assert "risk_by_lot" in data


def test_api_components_and_detail():
    res = client.get("/api/components?limit=10")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] > 0
    assert len(data["items"]) <= 10

    first_id = data["items"][0]["component_id"]
    detail_res = client.get(f"/api/components/{first_id}")
    assert detail_res.status_code == 200
    det = detail_res.json()
    assert det["trajectory"]["component_id"] == first_id
    assert "evidence" in det
    assert "forecast" in det
    assert "decision" in det


def test_api_scenarios():
    res = client.get("/api/scenarios")
    assert res.status_code == 200
    scenarios = res.json()
    assert len(scenarios) == 5
    assert scenarios[0]["scenario_id"] == "SCENARIO_A_WITHIN_SPEC"


def test_api_forecast_and_reveal():
    # Test early signal on Scenario B component
    cid = "CMP-DEMO-EARLY-DRIFT"
    early_res = client.post(f"/api/forecast/early-signal?component_id={cid}")
    assert early_res.status_code == 200
    early_data = early_res.json()
    assert early_data["forecast"]["predicted_168h"] is not None

    # Reveal held out outcome
    reveal_res = client.post(f"/api/forecast/reveal-heldout?component_id={cid}")
    assert reveal_res.status_code == 200
    rev_data = reveal_res.json()
    assert rev_data["actual_168h"] == 62.1
    assert rev_data["actual_crossed_spec_limit"] is True


def test_api_validation():
    res = client.get("/api/validation")
    assert res.status_code == 200
    data = res.json()
    assert "forecast_metrics" in data
    assert "uncertainty_metrics" in data
    assert "shift_impact" in data


def test_api_download_sample_csv():
    res = client.get("/api/datasets/sample-csv?format=long")
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    assert "component_id" in res.text


def test_api_component_report():
    cid = "CMP-DEMO-WITHIN-SPEC"
    res = client.get(f"/api/reports/component/{cid}")
    assert res.status_code == 200
    data = res.json()
    assert data["component_id"] == cid
    assert "disclaimer" in data["provenance_and_audit"]
