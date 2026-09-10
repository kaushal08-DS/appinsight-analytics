import pandas as pd


def category_iqr_outliers(
    df: pd.DataFrame,
    dimensions=("size_mb", "rating_num"),
) -> pd.DataFrame:

    rows = []

    if df.empty:
        return pd.DataFrame(
            columns=[
                "row_index",
                "app",
                "category",
                "size_mb",
                "rating",
                "installs",
                "reviews",
                "subjectivity",
                "outlier_type",
                "value",
                "q1",
                "q3",
                "iqr",
                "lower_bound",
                "upper_bound",
            ]
        )

    for category, group in df.groupby(
        "category_key",
        dropna=False,
    ):
        for dimension in dimensions:

            series = pd.to_numeric(
                group[dimension],
                errors="coerce",
            ).dropna()

            if series.empty:
                continue

            q1 = float(
                series.quantile(0.25)
            )

            q3 = float(
                series.quantile(0.75)
            )

            iqr = q3 - q1

            lower_bound = (
                q1 - 1.5 * iqr
            )

            upper_bound = (
                q3 + 1.5 * iqr
            )

            mask = (
                group[dimension] < lower_bound
            ) | (
                group[dimension] > upper_bound
            )

            outlier_rows = group.loc[mask]

            for index, row in outlier_rows.iterrows():

                value = float(
                    row[dimension]
                )

                rows.append(
                    {
                        "row_index": int(index),

                        "app": str(
                            row["App"]
                        ),

                        "category": str(
                            row["category_key"]
                        ),

                        "size_mb": (
                            float(row["size_mb"])
                            if pd.notna(
                                row["size_mb"]
                            )
                            else None
                        ),

                        "rating": (
                            float(row["rating_num"])
                            if pd.notna(
                                row["rating_num"]
                            )
                            else None
                        ),

                        "installs": (
                            float(row["installs_num"])
                            if pd.notna(
                                row["installs_num"]
                            )
                            else None
                        ),

                        "reviews": (
                            float(row["reviews_num"])
                            if pd.notna(
                                row["reviews_num"]
                            )
                            else None
                        ),

                        "subjectivity": (
                            float(
                                row["subjectivity_num"]
                            )
                            if pd.notna(
                                row[
                                    "subjectivity_num"
                                ]
                            )
                            else None
                        ),

                        "outlier_type": (
                            "Size"
                            if dimension == "size_mb"
                            else "Rating"
                        ),

                        "value": value,

                        "q1": q1,

                        "q3": q3,

                        "iqr": iqr,

                        "lower_bound": lower_bound,

                        "upper_bound": upper_bound,
                    }
                )

    return pd.DataFrame(rows)