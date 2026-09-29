"""Pre-Flight Verification Script for Live Demonstration.

Checks all critical API endpoints, data fixtures, ML inferences, and audit hash chains
before a live recording or judge demonstration.
"""
import sys
import json
import urllib.request
import urllib.error

BASE_URL = "http://127.0.0.1:8000"


def fetch_json(endpoint: str):
    url = f"{BASE_URL}{endpoint}"
    req = urllib.request.Request(url, headers={"User-Agent": "TrustBurn-PreFlight/1.0"})
    with urllib.request.urlopen(req, timeout=10) as response:
        if response.status != 200:
            raise RuntimeError(f"HTTP {response.status} from {url}")
        return json.loads(response.read().decode("utf-8"))


def run_preflight():
    print("=" * 60)
    print("TRUSTBURN AI -- PRE-FLIGHT SYSTEM VERIFICATION")
    print("=" * 60)
    failures = 0

    # 1. Health check
    try:
        health = fetch_json("/api/health")
        assert health.get("status") == "healthy", f"Unexpected health status: {health}"
        print("[PASS] [1/7] Backend health check (HTTP 200, status=healthy)")
    except Exception as e:
        print(f"[FAIL] [1/7] Backend health check: {e}")
        failures += 1

    # 2. Five locked demonstration scenarios
    try:
        scenarios = fetch_json("/api/scenarios")
        assert len(scenarios) == 5, f"Expected 5 scenarios, got {len(scenarios)}"
        print("[PASS] [2/7] Demonstration scenarios check (5 locked scenarios found)")
    except Exception as e:
        print(f"[FAIL] [2/7] Scenarios check: {e}")
        failures += 1

    # 3. Scenario A: CMP-DEMO-WITHIN-SPEC
    try:
        cmp_a = fetch_json("/api/components/CMP-DEMO-WITHIN-SPEC")
        traj = cmp_a.get("trajectory", {})
        ev = cmp_a.get("evidence", {})
        dec = cmp_a.get("decision", {})
        assert traj.get("val_24h") == 45.1, f"Expected 24h = 45.1, got {traj.get('val_24h')}"
        assert ev.get("robust_z_score", 0) >= 4.0, f"Expected robust_z >= 4.0, got {ev.get('robust_z_score')}"
        assert dec.get("decision") in ["REVIEW", "HIGH RISK"], f"Expected non-PASS decision, got {dec.get('decision')}"
        print(f"[PASS] [3/7] Scenario A (Within-Spec) (24h={traj.get('val_24h')} uA, Robust Z={ev.get('robust_z_score'):.1f}, Decision={dec.get('decision')})")
    except Exception as e:
        print(f"[FAIL] [3/7] Scenario A check: {e}")
        failures += 1

    # 4. Scenario B: CMP-DEMO-EARLY-DRIFT
    try:
        cmp_b = fetch_json("/api/components/CMP-DEMO-EARLY-DRIFT")
        fc = cmp_b.get("forecast", {})
        traj_b = cmp_b.get("trajectory", {})
        assert fc.get("predicted_168h", 0) > 50.0, f"Expected forecast > 50.0, got {fc.get('predicted_168h')}"
        assert traj_b.get("val_168h") is not None, "Held-out 168h outcome not available"
        print(f"[PASS] [4/7] Scenario B (Early Drift) (Forecast={fc.get('predicted_168h')} uA, Held-Out Actual={traj_b.get('val_168h')} uA)")
    except Exception as e:
        print(f"[FAIL] [4/7] Scenario B check: {e}")
        failures += 1

    # 5. Scenario C: CMP-DEMO-SHIFT
    try:
        cmp_c = fetch_json("/api/components/CMP-DEMO-SHIFT")
        sh = cmp_c.get("shift", {})
        dec_c = cmp_c.get("decision", {})
        assert sh.get("status") == "SHIFT_DETECTED", f"Expected SHIFT_DETECTED, got {sh.get('status')}"
        assert dec_c.get("trust_status") == "REDUCED", f"Expected REDUCED trust, got {dec_c.get('trust_status')}"
        print(f"[PASS] [5/7] Scenario C (Distribution Shift) (Shift={sh.get('status')}, Trust={dec_c.get('trust_status')})")
    except Exception as e:
        print(f"[FAIL] [5/7] Scenario C check: {e}")
        failures += 1

    # 6. Audit Chain Integrity
    try:
        chain = fetch_json("/api/audit/verify-chain")
        assert chain.get("valid") is True, f"Audit chain invalid: {chain}"
        print(f"[PASS] [6/7] SHA-256 Audit Chain (Status=CHAIN VERIFIED INTACT, Blocks={chain.get('chain_length')})")
    except Exception as e:
        print(f"[FAIL] [6/7] Audit chain verification: {e}")
        failures += 1

    # 7. Model Validation & Held-Out Metrics
    try:
        val = fetch_json("/api/validation")
        cm = val.get("confusion_matrix", {})
        assert val.get("model_version") is not None, "Missing model_version"
        assert cm.get("true_positive") is not None, "Missing confusion matrix"
        print(f"[PASS] [7/7] Model Validation (TP={cm.get('true_positive')}, FP={cm.get('false_positive')}, TN={cm.get('true_negative')}, FN={cm.get('false_negative')})")
    except Exception as e:
        print(f"[FAIL] [7/7] Validation metrics check: {e}")
        failures += 1

    print("=" * 60)
    if failures == 0:
        print("ALL PRE-FLIGHT CHECKS PASSED. Prototype is ready for demo recording.")
        print("=" * 60)
        return 0
    else:
        print(f"PRE-FLIGHT FAILED WITH {failures} ISSUE(S).")
        print("=" * 60)
        return 1


if __name__ == "__main__":
    sys.exit(run_preflight())
