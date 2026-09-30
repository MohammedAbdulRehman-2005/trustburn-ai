"""168h Drift Forecasting Engine using HistGradientBoostingRegressor and Linear Extrapolation Baseline."""
import numpy as np
from typing import Dict, Any, Optional, Tuple
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, root_mean_squared_error
from backend.app.schemas.burnin import ComponentTrajectory
from backend.app.schemas.screening import EarlyForecast


class DriftForecaster:
    """Supervised regression model predicting 168h measurement strictly from <=24h early features."""

    def __init__(self, model_version: str = "v1.0.0-rc"):
        self.model_version = model_version
        self.model: Optional[HistGradientBoostingRegressor] = None
        self.is_trained: bool = False
        self.training_meta: Dict[str, Any] = {}

    def train(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        seed: int = 42
    ) -> Dict[str, Any]:
        """Trains HistGradientBoostingRegressor on training lots with strict early features."""
        if len(X_train) == 0:
            raise ValueError("Training dataset cannot be empty.")

        self.model = HistGradientBoostingRegressor(
            max_iter=160,
            learning_rate=0.06,
            max_depth=4,
            min_samples_leaf=10,
            random_state=seed,
            loss="absolute_error"
        )
        self.model.fit(X_train, y_train)
        self.is_trained = True

        y_train_pred = self.model.predict(X_train)
        train_mae = float(mean_absolute_error(y_train, y_train_pred))

        self.training_meta = {
            "model_version": self.model_version,
            "seed": seed,
            "n_train_samples": len(X_train),
            "train_mae": round(train_mae, 3),
        }
        return self.training_meta

    def predict_point(self, features: np.ndarray) -> float:
        """Generates point prediction for 168h value."""
        if not self.is_trained or self.model is None:
            # Fallback to linear extrapolation if untrained
            v0, v24 = features[0], features[1]
            return float(v24 + (v24 - v0) * 6.0)

        pred = float(self.model.predict(features.reshape(1, -1))[0])
        return pred

    def predict_linear_baseline(self, v0: Optional[float], v24: Optional[float]) -> float:
        """Simple linear extrapolation baseline: y_168 = v24 + 6.0 * (v24 - v0)."""
        if v0 is None or v24 is None:
            return 10.0
        return float(v24 + (v24 - v0) * (144.0 / 24.0))

    def evaluate_test_set(
        self,
        X_test: np.ndarray,
        y_test: np.ndarray
    ) -> Dict[str, float]:
        """Evaluates trained model vs linear extrapolation baseline on held-out test lots."""
        if not self.is_trained or len(X_test) == 0:
            return {"model_mae": 0.0, "baseline_mae": 0.0, "n_test_samples": 0}

        y_pred = self.model.predict(X_test)
        model_mae = float(mean_absolute_error(y_test, y_pred))
        model_rmse = float(root_mean_squared_error(y_test, y_pred))

        # Baseline predictions: v0 is index 0, v24 is index 1
        y_base = [self.predict_linear_baseline(row[0], row[1]) for row in X_test]
        base_mae = float(mean_absolute_error(y_test, y_base))
        base_rmse = float(root_mean_squared_error(y_test, y_base))

        norm_mae_pct = round((model_mae / 50.0) * 100.0, 1)
        base_norm_mae_pct = round((base_mae / 50.0) * 100.0, 1)

        return {
            "n_test_samples": len(X_test),
            "model_mae": round(model_mae, 3),
            "model_rmse": round(model_rmse, 3),
            "baseline_mae": round(base_mae, 3),
            "baseline_rmse": round(base_rmse, 3),
            "normalized_mae_pct": norm_mae_pct,
            "baseline_normalized_mae_pct": base_norm_mae_pct,
            "improvement_pct": round(100.0 * (base_mae - model_mae) / max(base_mae, 1e-4), 1)
        }
