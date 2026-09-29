"""Persistent SQLite audit trail and decision store."""
import sqlite3
import json
import os
from typing import List, Dict, Any, Optional
from datetime import datetime
from backend.app.schemas.audit import AuditRunRecord, ComponentAuditRecord


class AuditStore:
    """Manages persistent SQLite logging for all screening runs and component decisions."""

    def __init__(self, db_path: str = "data/trustburn_audit.db"):
        self.db_path = db_path
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

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
                    decision_policy_version TEXT NOT NULL
                )
            """)
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
                    decision TEXT NOT NULL,
                    reason_codes TEXT NOT NULL,
                    recommended_action TEXT NOT NULL,
                    reviewer_notes TEXT,
                    FOREIGN KEY (run_id) REFERENCES screening_runs (run_id)
                )
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_decisions_run_comp 
                ON component_decisions (run_id, component_id)
            """)
            conn.commit()

    def log_run(self, run: AuditRunRecord, decisions: List[ComponentAuditRecord]):
        """Persists a complete screening execution with all component decisions."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO screening_runs VALUES (
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
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
                run.decision_policy_version
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
                    shift_status, decision, reason_codes, recommended_action, reviewer_notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, rows)
            conn.commit()

    def list_runs(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Lists recent screening runs."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM screening_runs ORDER BY timestamp DESC LIMIT ?", (limit,))
            rows = cursor.fetchall()
            return [dict(r) for r in rows]

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
