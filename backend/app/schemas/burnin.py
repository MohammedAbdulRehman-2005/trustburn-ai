"""Data schemas for burn-in measurement records and component trajectories."""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class MeasurementRecord(BaseModel):
    """Canonical single-point measurement record."""
    component_id: str = Field(..., description="Unique component identifier")
    lot_id: str = Field(..., description="Manufacturing lot identifier")
    parameter_name: str = Field(default="Iddq_uA", description="Electrical parameter measured")
    unit: str = Field(default="uA", description="Physical unit of parameter")
    measurement_hour: float = Field(..., description="Burn-in stage hour (0.0, 24.0, 96.0, 168.0)")
    measured_value: float = Field(..., description="Numerical measured value")
    measurement_quality: str = Field(default="GOOD", description="Quality flag: GOOD, DEGRADED, UNRELIABLE, NOISY")
    temperature_c: Optional[float] = Field(default=125.0, description="Stress temperature in Celsius")
    absolute_upper_limit: float = Field(default=50.0, description="Absolute specification upper limit")
    source: str = Field(default="synthetic_burnin_bench", description="Data source identifier")
    synthetic_ground_truth: Optional[str] = Field(default=None, description="Diagnostic defect label (evaluation only)")


class ComponentTrajectory(BaseModel):
    """Assembled 4-point burn-in trajectory for a single component."""
    component_id: str
    lot_id: str
    parameter_name: str = "Iddq_uA"
    unit: str = "uA"
    absolute_upper_limit: float = 50.0
    val_0h: Optional[float] = None
    val_24h: Optional[float] = None
    val_96h: Optional[float] = None
    val_168h: Optional[float] = None
    quality_0h: str = "GOOD"
    quality_24h: str = "GOOD"
    quality_96h: str = "GOOD"
    quality_168h: str = "GOOD"
    temperature_c: float = 125.0
    split_group: str = "TEST"  # TRAIN, CALIBRATION, TEST, TEST_SHIFT
    synthetic_ground_truth: Optional[str] = None
    is_demo_fixture: bool = False
    demo_scenario_id: Optional[str] = None
