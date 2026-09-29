"""Unit tests for Explainable AI (XAI): SHAP Feature Attribution and Grok Diagnostic LLM."""
import pytest
import numpy as np
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.state import GLOBAL_STATE
from backend.app.ml.shap_explainer import ShapExplainer, EARLY_FEATURE_NAMES


@pytest.fixture(scope="module")
def client():
    return TestClient(app)


def test_shap_efficiency_axiom():
    """Verifies exact Shapley Efficiency Property: sum(phi_i) == f(x) - f(baseline)."""
    demo_cids = ["CMP-DEMO-WITHIN-SPEC", "CMP-DEMO-EARLY-DRIFT", "CMP-DEMO-NORMAL"]
    
    for cid in demo_cids:
        exp = GLOBAL_STATE.explain_component(cid)
        pred = exp["predicted_168h"]
        base = exp["base_value_168h"]
        expected_delta = pred - base
        
        sum_phi = sum(a["shap_value"] for a in exp["attributions"])
        
        assert abs(sum_phi - expected_delta) < 0.05, (
            f"Efficiency axiom violated for {cid}: sum(phi)={sum_phi:.4f}, expected delta={expected_delta:.4f}"
        )
        assert len(exp["attributions"]) == 10, "Should attribute across exactly 10 early features."


def test_shap_zero_future_leakage():
    """Verifies that SHAP explainer only operates on non-leaking <=24h features."""
    exp = GLOBAL_STATE.explain_component("CMP-DEMO-WITHIN-SPEC")
    feature_names = [a["feature_name"] for a in exp["attributions"]]
    
    # Assert strictly early features only
    assert set(feature_names) == set(EARLY_FEATURE_NAMES)
    for name in feature_names:
        assert "96h" not in name.lower()
        assert "168h" not in name.lower()


def test_grok_narrative_structure_and_authority_levels():
    """Verifies natural language narrative follows Blueprint Section 12 structure and authority rules."""
    narrative_data = GLOBAL_STATE.generate_grok_narrative("CMP-DEMO-WITHIN-SPEC")
    
    assert narrative_data["component_id"] == "CMP-DEMO-WITHIN-SPEC"
    assert narrative_data["diagnostic_authority_level"] == "LEVEL_3_HYPOTHESIS"
    
    narrative = narrative_data["narrative"]
    assert "### 1. Executive Screening Assessment" in narrative
    assert "### 2. SHAP Feature Attribution Breakdown" in narrative
    assert "### 3. Multi-Level Diagnostic Analysis (Levels 0–3)" in narrative
    assert "### 4. Recommended QA Disposition & Verification Next Steps" in narrative
    assert "### 5. Scientific Authority & Failure Analysis Disclaimer" in narrative
    
    # Must explicitly mention Diagnostic Levels 0, 1, 2, 3
    assert "Level 0" in narrative
    assert "Level 1" in narrative
    assert "Level 2" in narrative
    assert "Level 3" in narrative
    # Level 4 must be noted as requiring laboratory Physical Failure Analysis
    assert "Level 4 Confirmed Root Cause" in narrative or "Level 4" in narrative
    assert "Physical Failure Analysis" in narrative or "Failure Analysis" in narrative


def test_api_explain_endpoints(client):
    """Verifies HTTP GET /api/explain/{id} and POST /api/explain/{id}/grok-narrative."""
    # 1. GET /api/explain/{component_id}
    res = client.get("/api/explain/CMP-DEMO-WITHIN-SPEC")
    assert res.status_code == 200
    data = res.json()
    assert "predicted_168h" in data
    assert "base_value_168h" in data
    assert "attributions" in data
    assert len(data["attributions"]) == 10
    assert "top_risk_drivers" in data
    assert "top_protective_factors" in data

    # 2. POST /api/explain/{component_id}/grok-narrative
    res_narrative = client.post("/api/explain/CMP-DEMO-WITHIN-SPEC/grok-narrative", json={})
    assert res_narrative.status_code == 200
    narr_data = res_narrative.json()
    assert narr_data["component_id"] == "CMP-DEMO-WITHIN-SPEC"
    assert "narrative" in narr_data
    assert len(narr_data["narrative"]) > 500
    assert "source" in narr_data


def test_api_component_report_contains_xai(client):
    """Verifies that the exportable QA Audit Report contains XAI explainability attributions."""
    res = client.get("/api/reports/component/CMP-DEMO-WITHIN-SPEC")
    assert res.status_code == 200
    report = res.json()
    assert "xai_explainability" in report
    xai = report["xai_explainability"]
    assert xai is not None
    assert "attributions" in xai
    assert "top_risk_drivers" in xai
