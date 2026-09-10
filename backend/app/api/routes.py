from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from app.services.state import state
from app.utils.time_window import now_ist, is_open, next_window
from app.analytics.hexbin import hexbin

import io
import pandas as pd
import numpy as np


router = APIRouter(prefix="/api")


def available_filtered(
    category=None,
    min_rating=3.5,
    min_installs=50000,
    min_reviews=500,
    min_size=10,
    max_size=100,
    game_only=False,
    search=None,
):
    """
    Applies all filters that can be truthfully calculated from
    the supplied dataset.

    Subjectivity is intentionally excluded here because the
    supplied dataset does not contain it.
    """

    d = state.eligible.copy()

    if category:
        if isinstance(category, str):
            category = [category]

        d = d[d["category_key"].isin(category)]

    d = d[
        (d["rating_num"] > min_rating)
        & (d["installs_num"] > min_installs)
        & (d["reviews_num"] > min_reviews)
        & (d["size_mb"].between(min_size, max_size))
    ].copy()

    if game_only:
        d = d[d["category_key"] == "GAME"]

    if search:
        d = d[
            d["App"]
            .astype(str)
            .str.contains(search, case=False, na=False)
        ]

    return d


@router.get("/dashboard/summary")
def summary():
    d = state.eligible

    return {
        "raw_rows": int(len(state.raw)),

        # None means the final requested analytical dataset
        # cannot be truthfully calculated because Subjectivity
        # is unavailable.
        "filtered_rows": (
            int(len(d))
            if state.meta["subjectivity_available"]
            else None
        ),

        # This is still a legitimate real-data analytical count.
        "pre_subjectivity_rows": int(len(d)),

        "avg_rating": (
            float(d["rating_num"].mean())
            if len(d)
            else None
        ),

        "avg_installs": (
            float(d["installs_num"].mean())
            if len(d)
            else None
        ),

        "outliers": int(len(state.outliers)),

        "categories": int(
            d["category_key"].nunique()
        ),

        "subjectivity_available": bool(
            state.meta["subjectivity_available"]
        ),

        "subjectivity_note": (
            "The supplied dataset has no review text or "
            "subjectivity column, so Subjectivity > 0.5 "
            "cannot be truthfully evaluated."
        ),
    }


@router.get("/analytics/status")
def status():
    current = now_ist()

    return {
        "open": is_open(current),
        "current_ist": current.isoformat(),
        "next_window": next_window(current),
        "message": (
            "The interactive App Size vs Rating analysis "
            "is available daily from 5:00 PM to 7:00 PM IST."
        ),
    }


@router.get("/analytics/pipeline")
def pipeline():
    return state.meta


@router.get("/analytics/data-quality")
def quality():
    missing = state.cleaned.isna().sum()

    return {
        "total_rows": int(len(state.raw)),

        "duplicate_rows": int(
            state.meta["exact_duplicates"]
        ),

        "invalid_values": int(
            state.meta["invalid_values"]
        ),

        "valid_cleaned_rows": int(
            len(state.cleaned)
        ),

        "missing": {
            str(k): int(v)
            for k, v in missing.items()
            if int(v) > 0
        },

        "subjectivity_available": bool(
            state.meta["subjectivity_available"]
        ),
    }


@router.get("/analytics/distributions")
def distributions():
    d = state.eligible.copy()

    rating = d["rating_num"].dropna()

    rating_bins = np.arange(3.5, 5.01, 0.1)

    rating_counts, rating_edges = np.histogram(
        rating,
        bins=rating_bins,
    )

    rating_result = []

    for i, count in enumerate(rating_counts):
        rating_result.append(
            {
                "bin": (
                    f"{rating_edges[i]:.1f}"
                    f"–"
                    f"{rating_edges[i + 1]:.1f}"
                ),
                "count": int(count),
            }
        )

    size = d["size_mb"].dropna()

    size_bins = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]

    size_counts, size_edges = np.histogram(
        size,
        bins=size_bins,
    )

    size_result = []

    for i, count in enumerate(size_counts):
        size_result.append(
            {
                "bin": (
                    f"{size_edges[i]:.0f}"
                    f"–"
                    f"{size_edges[i + 1]:.0f} MB"
                ),
                "count": int(count),
            }
        )

    installs = d["installs_num"].dropna()

    install_bins = [
        50000,
        100000,
        500000,
        1000000,
        5000000,
        10000000,
        50000000,
        float("inf"),
    ]

    install_counts, install_edges = np.histogram(
        installs,
        bins=install_bins,
    )

    install_labels = [
        "50K–100K",
        "100K–500K",
        "500K–1M",
        "1M–5M",
        "5M–10M",
        "10M–50M",
        "50M+",
    ]

    install_result = [
        {
            "bin": label,
            "count": int(count),
        }
        for label, count in zip(
            install_labels,
            install_counts,
        )
    ]

    return {
        "rating": rating_result,
        "size": size_result,
        "installs": install_result,
    }


@router.get("/analytics/hexbin")
def hexbin_api(
    category: list[str] | None = Query(default=None),
    min_rating: float = 3.5,
    min_installs: float = 50000,
    min_reviews: float = 500,
    min_size: float = 10,
    max_size: float = 100,
    min_subjectivity: float = 0.5,
    game_only: bool = False,
    search: str | None = None,
):
    # SERVER-SIDE TIME ENFORCEMENT
    if not is_open():
        raise HTTPException(
            status_code=403,
            detail="Analysis window closed",
        )

    # SERVER-SIDE SUBJECTIVITY ENFORCEMENT
    if not state.meta["subjectivity_available"]:
        raise HTTPException(
            status_code=409,
            detail=(
                "Subjectivity data unavailable in the supplied "
                "dataset. The required Subjectivity > 0.5 "
                "filter cannot be truthfully applied."
            ),
        )

    d = available_filtered(
        category=category,
        min_rating=min_rating,
        min_installs=min_installs,
        min_reviews=min_reviews,
        min_size=min_size,
        max_size=max_size,
        game_only=game_only,
        search=search,
    )

    d = d[
        d["subjectivity_num"] > min_subjectivity
    ].copy()

    result_hexbin = hexbin(d)

    return {
        "count": int(len(d)),
        "hexbin": result_hexbin,
        "points": d[
            [
                "App",
                "category_key",
                "size_mb",
                "rating_num",
                "installs_num",
                "reviews_num",
                "subjectivity_num",
            ]
        ].to_dict("records"),
    }


@router.get("/analytics/categories")
def categories():
    d = state.eligible

    rows = []

    for category, group in d.groupby(
        "category_key"
    ):
        rows.append(
            {
                "category": str(category),
                "count": int(len(group)),
                "avg_rating": float(
                    group["rating_num"].mean()
                ),
                "avg_installs": float(
                    group["installs_num"].mean()
                ),
                "avg_size": float(
                    group["size_mb"].mean()
                ),
                "avg_reviews": float(
                    group["reviews_num"].mean()
                ),
                "outliers": int(
                    (
                        state.outliers["category"]
                        == category
                    ).sum()
                ),
            }
        )

    return sorted(
        rows,
        key=lambda x: x["count"],
        reverse=True,
    )


@router.get("/analytics/outliers")
def outliers():
    return state.outliers.to_dict("records")


@router.get("/analytics/insights")
def insights():
    d = state.eligible

    if d.empty:
        return {
            "items": [
                "No records are available after the available filters."
            ]
        }

    items = []

    top_category = (
        d["category_key"]
        .value_counts()
        .idxmax()
    )

    top_category_count = int(
        d["category_key"]
        .value_counts()
        .max()
    )

    items.append(
        f"{top_category} has the largest qualifying "
        f"application population with "
        f"{top_category_count:,} apps."
    )

    game_percentage = (
        (d["category_key"] == "GAME").mean() * 100
    )

    items.append(
        f"Game applications represent "
        f"{game_percentage:.1f}% of the available "
        f"qualifying dataset."
    )

    largest_category_outliers = (
        state.outliers["category"]
        .value_counts()
        .idxmax()
        if len(state.outliers)
        else None
    )

    if largest_category_outliers:
        count = int(
            state.outliers["category"]
            .value_counts()
            .max()
        )

        items.append(
            f"{largest_category_outliers} contains "
            f"the highest number of category-level "
            f"IQR outliers ({count:,})."
        )

    avg_size = float(d["size_mb"].mean())

    items.append(
        f"The average qualifying app size is "
        f"{avg_size:.1f} MB."
    )

    avg_rating = float(d["rating_num"].mean())

    items.append(
        f"The average rating across the available "
        f"qualifying records is {avg_rating:.2f}."
    )

    if not state.meta["subjectivity_available"]:
        items.append(
            "Subjectivity analysis is blocked because "
            "the supplied dataset contains neither "
            "review text nor a subjectivity field."
        )

    return {
        "items": items
    }


# ---------------------------------------------------------------------------
# REPORTS
# ---------------------------------------------------------------------------


@router.get("/reports/processed-csv")
def processed_csv():
    buffer = io.StringIO()

    state.eligible.to_csv(
        buffer,
        index=False,
    )

    buffer.seek(0)

    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition":
                "attachment; filename=appinsight_processed.csv"
        },
    )


@router.get("/reports/outliers-csv")
def outliers_csv():
    buffer = io.StringIO()

    state.outliers.to_csv(
        buffer,
        index=False,
    )

    buffer.seek(0)

    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition":
                "attachment; filename=appinsight_outliers.csv"
        },
    )


@router.get("/reports/pipeline-csv")
def pipeline_csv():
    pipeline_df = pd.DataFrame(
        state.meta["stages"]
    )

    buffer = io.StringIO()

    pipeline_df.to_csv(
        buffer,
        index=False,
    )

    buffer.seek(0)

    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition":
                "attachment; filename=appinsight_pipeline.csv"
        },
    )