from pathlib import Path

import pandas as pd

from app.analytics.pipeline import load_and_prepare
from app.analytics.iqr import category_iqr_outliers


ROOT = Path(__file__).resolve().parents[3]

DATA = (
    ROOT
    / "data"
    / "raw"
    / "googleplaystore.csv"
)


class AnalyticsState:
    def __init__(self):
        (
            self.raw,
            self.cleaned,
            self.eligible,
            self.meta,
        ) = load_and_prepare(str(DATA))

        # IMPORTANT:
        # IQR outliers for Size and Rating do NOT require
        # Subjectivity. They are calculated from the real
        # available analytical dataset.
        self.outliers = category_iqr_outliers(
            self.eligible
        )


state = AnalyticsState()