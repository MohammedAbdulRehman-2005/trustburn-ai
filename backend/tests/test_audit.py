"""Tests for persistent audit trail and cryptographic SHA-256 hash chaining."""
import os
import tempfile
import pytest
from backend.app.schemas.audit import AuditRunRecord, ComponentAuditRecord
from backend.app.audit.storage import AuditStore


def test_sha256_hash_chain_integrity():
    """Verify that audit records are chained with SHA-256 and detect tampering."""
    with tempfile.TemporaryDirectory() as tmpdir:
        db_path = os.path.join(tmpdir, "test_audit.db")
        store = AuditStore(db_path=db_path)

        # 1. Log Run 1 (Genesis block)
        run1 = AuditRunRecord(
            run_id="RUN-001",
            timestamp="2026-09-29T10:00:00",
            dataset_identifier="TEST-SET-1",
            data_seed=42,
            model_version="v1.0.0-rc",
            features_used=["f1", "f2"],
            train_lots=["LOT-A"],
            calibration_lots=["LOT-B"],
            test_lots=["LOT-C"],
            thresholds_applied={"spec": 50.0},
            total_screened=100,
            pass_count=90,
            review_count=8,
            high_risk_count=2
        )
        decisions1 = [
            ComponentAuditRecord(
                run_id="RUN-001",
                component_id="CMP-001",
                lot_id="LOT-C",
                timestamp="2026-09-29T10:00:00",
                measured_0h=10.0,
                measured_24h=10.5,
                measured_96h=11.0,
                measured_168h=11.5,
                anomaly_score=0.2,
                forecast_168h=11.6,
                conformal_lower=9.0,
                conformal_upper=14.0,
                shift_status="NORMAL",
                trust_status="NORMAL",
                decision="PASS",
                reason_codes=["REASON_NOMINAL_STABLE"],
                recommended_action="Clear"
            )
        ]
        store.log_run(run1, decisions1)

        # 2. Log Run 2 (Chained block)
        run2 = AuditRunRecord(
            run_id="RUN-002",
            timestamp="2026-09-29T11:00:00",
            dataset_identifier="TEST-SET-2",
            data_seed=43,
            model_version="v1.0.0-rc",
            features_used=["f1", "f2"],
            train_lots=["LOT-A"],
            calibration_lots=["LOT-B"],
            test_lots=["LOT-C"],
            thresholds_applied={"spec": 50.0},
            total_screened=100,
            pass_count=85,
            review_count=10,
            high_risk_count=5
        )
        decisions2 = [
            ComponentAuditRecord(
                run_id="RUN-002",
                component_id="CMP-002",
                lot_id="LOT-C",
                timestamp="2026-09-29T11:00:00",
                measured_0h=12.0,
                measured_24h=13.5,
                measured_96h=15.0,
                measured_168h=17.5,
                anomaly_score=1.5,
                forecast_168h=17.0,
                conformal_lower=14.0,
                conformal_upper=20.0,
                shift_status="NORMAL",
                trust_status="NORMAL",
                decision="PASS",
                reason_codes=["REASON_NOMINAL_STABLE"],
                recommended_action="Clear"
            )
        ]
        store.log_run(run2, decisions2)

        # 3. Verify intact chain
        verif = store.verify_chain_integrity()
        assert verif["valid"] is True
        assert verif["chain_length"] == 2
        assert verif["status"] == "CHAIN_VERIFIED_INTACT"
        assert verif["genesis_hash"] is not None
        assert verif["latest_hash"] is not None
        assert len(verif["genesis_hash"]) == 64  # SHA-256 length

        # 4. Tamper with Run 1 data directly in database
        with store._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE screening_runs SET pass_count = 999 WHERE run_id = 'RUN-001'")
            conn.commit()

        # 5. Verify that tampering is immediately detected!
        tampered_verif = store.verify_chain_integrity()
        assert tampered_verif["valid"] is False
        assert tampered_verif["status"] == "TAMPER_DETECTED"
        assert tampered_verif["broken_block_index"] == 0
