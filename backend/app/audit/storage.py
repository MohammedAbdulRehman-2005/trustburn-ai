"""Persistent SQLite audit trail and decision store with SHA-256 cryptographic hash chaining."""
import sqlite3
import json
import os
import hashlib
from typing import List, Dict, Any, Optional
from datetime import datetime
from backend.app.schemas.audit import AuditRunRecord, ComponentAuditRecord


from contextlib import contextmanager


class AuditStore:
    """Manages persistent SQLite logging for all screening runs and component decisions
    with cryptographic SHA-256 tamper-evident hash chaining.
    """

    def __init__(self, db_path: str = "data/trustburn_audit.db"):
        self.db_path = db_path
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        self._init_db()

    @contextmanager
    def _get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        finally:
            conn.close()

    def _init_db(self):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS screening_runs (
                    run_id TEXT PRIMARY KEY,
                    timestamp TEXT NOT NULL,
                    dataset_identifier TEXT NOT NULL,
                    data_seed INTEGER NOT NULL,
                    model_version TEXT NOT NULL,
                    features_used TEXT NOT NULL,
                    train_lots TEXT NOT NULL,
                    calibration_lots TEXT NOT NULL,
                    test_lots TEXT NOT NULL,
                    thresholds_applied TEXT NOT NULL,
                    total_screened INTEGER NOT NULL,
                    pass_count INTEGER NOT NULL,
                    review_count INTEGER NOT NULL,
                    high_risk_count INTEGER NOT NULL,
                    decision_policy_version TEXT NOT NULL,
                    previous_hash TEXT NOT NULL DEFAULT '',
                    record_hash TEXT NOT NULL DEFAULT ''
                )
            """)
            # Check if columns exist in existing DB (migration safeguard)
            cursor.execute("PRAGMA table_info(screening_runs)")
            cols = [c[1] for c in cursor.fetchall()]
            if "previous_hash" not in cols:
                cursor.execute("ALTER TABLE screening_runs ADD COLUMN previous_hash TEXT NOT NULL DEFAULT ''")
            if "record_hash" not in cols:
                cursor.execute("ALTER TABLE screening_runs ADD COLUMN record_hash TEXT NOT NULL DEFAULT ''")

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS component_decisions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    run_id TEXT NOT NULL,
                    component_id TEXT NOT NULL,
                    lot_id TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    measured_0h REAL,
                    measured_24h REAL,
                    measured_96h REAL,
                    measured_168h REAL,
                    anomaly_score REAL NOT NULL,
                    forecast_168h REAL NOT NULL,
                    conformal_lower REAL NOT NULL,
                    conformal_upper REAL NOT NULL,
                    shift_status TEXT NOT NULL,
                    trust_status TEXT NOT NULL DEFAULT 'NORMAL',
                    decision TEXT NOT NULL,
                    reason_codes TEXT NOT NULL,
                    recommended_action TEXT NOT NULL,
                    reviewer_notes TEXT,
                    FOREIGN KEY (run_id) REFERENCES screening_runs (run_id)
                )
            """)
            cursor.execute("PRAGMA table_info(component_decisions)")
            comp_cols = [c[1] for c in cursor.fetchall()]
            if "trust_status" not in comp_cols:
                cursor.execute("ALTER TABLE component_decisions ADD COLUMN trust_status TEXT NOT NULL DEFAULT 'NORMAL'")

            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_decisions_run_comp 
                ON component_decisions (run_id, component_id)
            """)
            conn.commit()

    def _compute_hash(self, prev_hash: str, run: AuditRunRecord) -> str:
        """Computes deterministic SHA-256 hash chaining block fingerprint."""
        serialized = (
            f"{prev_hash}|{run.run_id}|{run.timestamp}|{run.dataset_identifier}|"
            f"{run.data_seed}|{run.model_version}|{run.total_screened}|"
            f"{run.pass_count}|{run.review_count}|{run.high_risk_count}|"
            f"{run.decision_policy_version}"
        )
        return hashlib.sha256(serialized.encode("utf-8")).hexdigest()

    def log_run(self, run: AuditRunRecord, decisions: List[ComponentAuditRecord]):
        """Persists a complete screening execution with SHA-256 hash chaining."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            # Fetch most recent run hash to link chain
            cursor.execute("SELECT record_hash FROM screening_runs ORDER BY timestamp DESC LIMIT 1")
            last_row = cursor.fetchone()
            prev_hash = last_row["record_hash"] if last_row and last_row["record_hash"] else ("0" * 64)
            record_hash = self._compute_hash(prev_hash, run)

            run.previous_hash = prev_hash
            run.record_hash = record_hash

            cursor.execute("""
                INSERT OR REPLACE INTO screening_runs VALUES (
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
                )
            """, (
                run.run_id,
                run.timestamp,
                run.dataset_identifier,
                run.data_seed,
                run.model_version,
                json.dumps(run.features_used),
                json.dumps(run.train_lots),
                json.dumps(run.calibration_lots),
                json.dumps(run.test_lots),
                json.dumps(run.thresholds_applied),
                run.total_screened,
                run.pass_count,
                run.review_count,
                run.high_risk_count,
                run.decision_policy_version,
                prev_hash,
                record_hash
            ))

            rows = [(
                d.run_id,
                d.component_id,
                d.lot_id,
                d.timestamp,
                d.measured_0h,
                d.measured_24h,
                d.measured_96h,
                d.measured_168h,
                d.anomaly_score,
                d.forecast_168h,
                d.conformal_lower,
                d.conformal_upper,
                d.shift_status,
                d.trust_status,
                d.decision,
                json.dumps(d.reason_codes),
                d.recommended_action,
                d.reviewer_notes
            ) for d in decisions]

            cursor.executemany("""
                INSERT INTO component_decisions (
                    run_id, component_id, lot_id, timestamp,
                    measured_0h, measured_24h, measured_96h, measured_168h,
                    anomaly_score, forecast_168h, conformal_lower, conformal_upper,
                    shift_status, trust_status, decision, reason_codes, recommended_action, reviewer_notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, rows)
            conn.commit()

    def list_runs(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Lists recent screening runs."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM screening_runs ORDER BY timestamp DESC LIMIT ?", (limit,))
            rows = cursor.fetchall()
            return [dict(r) for r in rows]

    def verify_chain_integrity(self) -> Dict[str, Any]:
        """Cryptographically verifies the SHA-256 tamper-evident hash chain."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM screening_runs ORDER BY timestamp ASC")
            rows = cursor.fetchall()

            if not rows:
                return {
                    "valid": True,
                    "chain_length": 0,
                    "genesis_hash": None,
                    "latest_hash": None,
                    "algorithm": "SHA-256",
                    "status": "EMPTY_CHAIN",
                    "message": "No screening runs recorded yet."
                }

            expected_prev = "0" * 64
            all_valid = True
            broken_index = None

            for i, r in enumerate(rows):
                run_dict = dict(r)
                if run_dict.get("previous_hash") != expected_prev:
                    all_valid = False
                    broken_index = i
                    break

                # Recompute hash
                serialized = (
                    f"{expected_prev}|{run_dict['run_id']}|{run_dict['timestamp']}|{run_dict['dataset_identifier']}|"
                    f"{run_dict['data_seed']}|{run_dict['model_version']}|{run_dict['total_screened']}|"
                    f"{run_dict['pass_count']}|{run_dict['review_count']}|{run_dict['high_risk_count']}|"
                    f"{run_dict['decision_policy_version']}"
                )
                computed = hashlib.sha256(serialized.encode("utf-8")).hexdigest()
                if run_dict.get("record_hash") != computed:
                    all_valid = False
                    broken_index = i
                    break

                expected_prev = run_dict["record_hash"]

            return {
                "valid": all_valid,
                "chain_length": len(rows),
                "genesis_hash": rows[0]["record_hash"] if rows else None,
                "latest_hash": rows[-1]["record_hash"] if rows else None,
                "algorithm": "SHA-256",
                "broken_block_index": broken_index,
                "status": "CHAIN_VERIFIED_INTACT" if all_valid else "TAMPER_DETECTED",
                "message": (
                    f"Cryptographic SHA-256 chain integrity verified: all {len(rows)} screening run blocks intact and un-tampered."
                    if all_valid else
                    f"Integrity check failed at block index {broken_index}."
                )
            }

    def get_run_decisions(self, run_id: str) -> List[Dict[str, Any]]:
        """Retrieves all component decisions for a specific screening run."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM component_decisions WHERE run_id = ?", (run_id,))
            rows = cursor.fetchall()
            res = []
            for r in rows:
                d = dict(r)
                d["reason_codes"] = json.loads(d["reason_codes"])
                res.append(d)
            return res

    def update_reviewer_notes(self, run_id: str, component_id: str, notes: str):
        """Attaches QA human review notes without modifying the deterministic machine decision."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE component_decisions
                SET reviewer_notes = ?
                WHERE run_id = ? AND component_id = ?
            """, (notes, run_id, component_id))
            conn.commit()
