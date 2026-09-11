"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import ReactECharts from "echarts-for-react";
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Clock3,
  Database,
  Download,
  Info,
  Moon,
  Search,
  ShieldAlert,
  Sparkles,
  Sun,
  Workflow,
  XCircle,
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import Kpi from "../components/Kpi";
import StatusBanner from "../components/StatusBanner";
import HexbinChart from "../components/HexbinChart";
import { api } from "../services/api";


/* -------------------------------------------------------------------------- */
/* CONSTANTS */
/* -------------------------------------------------------------------------- */

const categories = [
  "GAME",
  "BEAUTY",
  "BUSINESS",
  "COMICS",
  "COMMUNICATION",
  "DATING",
  "ENTERTAINMENT",
  "SOCIAL",
  "EVENTS",
];


const categoryTranslations: Record<string, string> = {
  BEAUTY: "ब्यूटी",
  BUSINESS: "வணிகம்",
  DATING: "Partnersuche",
};


function translateCategory(category: string) {
  return categoryTranslations[category] || category;
}


/* -------------------------------------------------------------------------- */
/* TYPES */
/* -------------------------------------------------------------------------- */

type Summary = {
  raw_rows?: number;
  filtered_rows?: number | null;
  pre_subjectivity_rows?: number;
  avg_rating?: number | null;
  avg_installs?: number | null;
  outliers?: number;
  categories?: number;
  subjectivity_available?: boolean;
  subjectivity_note?: string;
};


type Status = {
  open?: boolean;
  current_ist?: string;
  next_window?: string | null;
  message?: string;
};


type CategoryRow = {
  category: string;
  count: number;
  avg_rating: number;
  avg_installs: number;
  avg_size: number;
  avg_reviews: number;
  outliers: number;
};


type Outlier = {
  row_index: number;
  app: string;
  category: string;
  size_mb: number | null;
  rating: number | null;
  installs: number | null;
  reviews: number | null;
  subjectivity: number | null;
  outlier_type: string;
  value: number;
  q1: number;
  q3: number;
  iqr: number;
  lower_bound: number;
  upper_bound: number;
};


type PipelineData = {
  stages: {
    name: string;
    count: number | null;
  }[];
};


type QualityData = {
  total_rows: number;
  duplicate_rows: number;
  invalid_values: number;
  valid_cleaned_rows: number;
  missing: Record<string, number>;
  subjectivity_available: boolean;
};


type DistributionData = {
  rating: {
    bin: string;
    count: number;
  }[];

  size: {
    bin: string;
    count: number;
  }[];

  installs: {
    bin: string;
    count: number;
  }[];
};


/* -------------------------------------------------------------------------- */
/* MAIN APP */
/* -------------------------------------------------------------------------- */

export default function Home() {
  const [page, setPage] = useState("Landing");
  const [dark, setDark] = useState(true);

  const [summary, setSummary] = useState<Summary>({});
  const [status, setStatus] = useState<Status>({});
  const [categoriesData, setCategoriesData] = useState<CategoryRow[]>([]);
  const [outs, setOuts] = useState<Outlier[]>([]);
  const [pipeline, setPipeline] = useState<PipelineData | null>(null);
  const [quality, setQuality] = useState<QualityData | null>(null);

  const [distributions, setDistributions] =
    useState<DistributionData | null>(null);

  const [insights, setInsights] = useState<string[]>([]);

  const [hex, setHex] = useState<any>(null);

  const [showOut, setShowOut] = useState(true);
  const [cat, setCat] = useState("");

  const [search, setSearch] = useState("");
  const [outlierFilter, setOutlierFilter] = useState("ALL");


  /* ------------------------------------------------------------------------ */
  /* THEME */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);


  /* ------------------------------------------------------------------------ */
  /* LOAD DASHBOARD DATA */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    async function loadDashboard() {
      const results = await Promise.allSettled([
        api<Summary>("/api/dashboard/summary"),

        api<Status>("/api/analytics/status"),

        api<CategoryRow[]>(
          "/api/analytics/categories"
        ),

        api<Outlier[]>(
          "/api/analytics/outliers"
        ),

        api<PipelineData>(
          "/api/analytics/pipeline"
        ),

        api<QualityData>(
          "/api/analytics/data-quality"
        ),

        api<DistributionData>(
          "/api/analytics/distributions"
        ),

        api<{ items: string[] }>(
          "/api/analytics/insights"
        ),
      ]);


      const [
        summaryResult,
        statusResult,
        categoryResult,
        outlierResult,
        pipelineResult,
        qualityResult,
        distributionResult,
        insightResult,
      ] = results;


      /* -------------------------------------------------------------------- */
      /* SUMMARY */
      /* -------------------------------------------------------------------- */

      if (summaryResult.status === "fulfilled") {
        setSummary(summaryResult.value);
      } else {
        console.error(
          "Summary API failed:",
          summaryResult.reason
        );
      }


      /* -------------------------------------------------------------------- */
      /* STATUS */
      /* -------------------------------------------------------------------- */

      if (statusResult.status === "fulfilled") {
        setStatus(statusResult.value);
      } else {
        console.error(
          "Status API failed:",
          statusResult.reason
        );
      }


      /* -------------------------------------------------------------------- */
      /* CATEGORIES */
      /* -------------------------------------------------------------------- */

      if (categoryResult.status === "fulfilled") {
        setCategoriesData(categoryResult.value);
      } else {
        console.error(
          "Categories API failed:",
          categoryResult.reason
        );
      }


      /* -------------------------------------------------------------------- */
      /* OUTLIERS */
      /* -------------------------------------------------------------------- */

      if (outlierResult.status === "fulfilled") {
        setOuts(outlierResult.value);
      } else {
        console.error(
          "Outliers API failed:",
          outlierResult.reason
        );
      }


      /* -------------------------------------------------------------------- */
      /* PIPELINE */
      /* -------------------------------------------------------------------- */

      if (pipelineResult.status === "fulfilled") {
        setPipeline(pipelineResult.value);
      } else {
        console.error(
          "Pipeline API failed:",
          pipelineResult.reason
        );
      }


      /* -------------------------------------------------------------------- */
      /* DATA QUALITY */
      /* -------------------------------------------------------------------- */

      if (qualityResult.status === "fulfilled") {
        setQuality(qualityResult.value);
      } else {
        console.error(
          "Quality API failed:",
          qualityResult.reason
        );
      }


      /* -------------------------------------------------------------------- */
      /* DISTRIBUTIONS */
      /* -------------------------------------------------------------------- */

      if (distributionResult.status === "fulfilled") {
        setDistributions(
          distributionResult.value
        );
      } else {
        console.error(
          "Distribution API failed:",
          distributionResult.reason
        );
      }


      /* -------------------------------------------------------------------- */
      /* INSIGHTS */
      /* -------------------------------------------------------------------- */

      if (insightResult.status === "fulfilled") {
        setInsights(
          insightResult.value.items || []
        );
      } else {
        console.error(
          "Insights API failed:",
          insightResult.reason
        );
      }
    }


    loadDashboard();
  }, []);


  /* ------------------------------------------------------------------------ */
  /* HEXBIN DATA */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (page !== "Hexbin Explorer") {
      return;
    }


    if (!status.open) {
      setHex(null);
      return;
    }


    async function loadHexbin() {
      try {
        const query = cat
          ? `?category=${encodeURIComponent(cat)}`
          : "";


        const result = await api<any>(
          `/api/analytics/hexbin${query}`
        );


        setHex(result);
      } catch (error) {
        console.error(
          "Hexbin API failed:",
          error
        );

        setHex(null);
      }
    }


    loadHexbin();
  }, [page, status.open, cat]);


  /* ------------------------------------------------------------------------ */
  /* OUTLIER SEARCH */
  /* ------------------------------------------------------------------------ */

  const filteredOutliers = useMemo(() => {
    return outs.filter((item) => {
      const matchesSearch =
        !search ||
        item.app
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        item.category
          .toLowerCase()
          .includes(search.toLowerCase());


      const matchesType =
        outlierFilter === "ALL" ||
        item.outlier_type
          .toUpperCase() === outlierFilter;


      return matchesSearch && matchesType;
    });
  }, [outs, search, outlierFilter]);


  /* ------------------------------------------------------------------------ */
  /* PAGE TITLE */
  /* ------------------------------------------------------------------------ */

  const title =
    page === "Overview"
      ? "Mobile App Intelligence"
      : page;


  /* ------------------------------------------------------------------------ */
  /* LANDING */
  /* ------------------------------------------------------------------------ */

  if (page === "Landing") {
    return (
      <Landing
        onExplore={() =>
          setPage("Overview")
        }
      />
    );
  }


  /* ------------------------------------------------------------------------ */
  /* MAIN LAYOUT */
  /* ------------------------------------------------------------------------ */

  return (
    <div
      className={
        dark
          ? "dark min-h-screen"
          : "min-h-screen"
      }
    >
      <div className="flex min-h-screen bg-[var(--bg)] text-[var(--text)]">

        <Sidebar
          page={page}
          setPage={setPage}
        />


        <main className="flex-1 min-w-0 p-5 md:p-8">

          {/* HEADER */}

          <header className="flex items-center justify-between mb-7">

            <div>

              <div className="text-xs md:text-sm tracking-[0.2em] muted font-semibold">
                APPINSIGHT ANALYTICS
              </div>


              <h1 className="text-3xl md:text-4xl font-black mt-1 tracking-tight">
                {title}
              </h1>

            </div>


            <div className="flex items-center gap-3">

              <div className="hidden md:flex items-center gap-2 card px-4 py-2.5">

                <Search size={17} />

                <span className="muted text-sm">
                  Search analytics
                </span>

              </div>


              <button
                className="card p-3 hover:scale-105 transition"
                onClick={() =>
                  setDark(!dark)
                }
                aria-label="Toggle theme"
              >
                {dark ? (
                  <Sun size={18} />
                ) : (
                  <Moon size={18} />
                )}
              </button>

            </div>

          </header>


          {/* OVERVIEW */}

          {page === "Overview" && (
            <Overview
              summary={summary}
              status={status}
              insights={insights}
              categories={categoriesData}
              quality={quality}
              onAnalytics={() =>
                setPage("Analytics")
              }
            />
          )}


          {/* ANALYTICS */}

          {page === "Analytics" && (
            <AnalyticsPage
              summary={summary}
              categories={categoriesData}
              distributions={distributions}
              insights={insights}
            />
          )}


          {/* HEXBIN */}

          {page === "Hexbin Explorer" && (
            <>
              <StatusBanner />

              {status.open && hex ? (
                <div className="card p-5 mt-5">

                  <div className="flex flex-wrap gap-4 items-center justify-between mb-5">

                    <div>

                      <div className="text-xs uppercase tracking-widest muted">
                        Primary visualization
                      </div>

                      <h2 className="font-black text-2xl mt-1">
                        App Size vs Rating
                      </h2>

                      <p className="muted text-sm mt-1">
                        Install density across the filtered application ecosystem.
                      </p>

                    </div>


                    <div className="flex flex-wrap gap-2">

                      <select
                        className="border rounded-xl px-3 py-2 bg-transparent"
                        value={cat}
                        onChange={(e) =>
                          setCat(e.target.value)
                        }
                      >

                        <option value="">
                          All categories
                        </option>


                        {categories.map((c) => (
                          <option
                            key={c}
                            value={c}
                          >
                            {translateCategory(c)}
                          </option>
                        ))}

                      </select>


                      <button
                        className="border rounded-xl px-3 py-2"
                        onClick={() =>
                          setShowOut(!showOut)
                        }
                      >
                        {showOut
                          ? "Hide"
                          : "Show"}{" "}
                        outliers
                      </button>

                    </div>

                  </div>


                  <HexbinChart
                    data={hex.hexbin}
                    points={
                      showOut
                        ? outs
                        : []
                    }
                  />


                  <div className="grid md:grid-cols-3 gap-4 mt-5">

                    <MiniInfo
                      icon={
                        <Activity size={18} />
                      }
                      title="Hexbin intensity"
                      value="Average installs"
                    />


                    <MiniInfo
                      icon={
                        <Sparkles size={18} />
                      }
                      title="Game overlay"
                      value="Pink / Magenta"
                      pink
                    />


                    <MiniInfo
                      icon={
                        <BarChart3 size={18} />
                      }
                      title="Applications"
                      value={
                        hex.count?.toLocaleString() ||
                        "0"
                      }
                    />

                  </div>

                </div>
              ) : (
                <BlockedAnalysis
                  status={status}
                />
              )}

            </>
          )}


          {/* OUTLIERS */}

          {page === "Outliers" && (
            <OutlierExplorer
              outliers={filteredOutliers}
              search={search}
              setSearch={setSearch}
              filter={outlierFilter}
              setFilter={setOutlierFilter}
            />
          )}


          {/* CATEGORIES */}

          {page === "Categories" && (
            <CategoryAnalysis
              categories={categoriesData}
            />
          )}


          {/* PIPELINE */}

          {page === "Data Pipeline" && (
            <PipelinePage
              pipeline={pipeline}
            />
          )}


          {/* DATA QUALITY */}

          {page === "Data Quality" && (
            <QualityPage
              quality={quality}
              distributions={distributions}
            />
          )}


          {/* REPORTS */}

          {page === "Reports" && (
            <ReportsPage />
          )}


          {/* METHODOLOGY */}

          {page === "Methodology" && (
            <Methodology />
          )}


          {/* SETTINGS */}

          {page === "Settings" && (
            <Settings />
          )}

        </main>
      </div>
    </div>
  );
}


/* -------------------------------------------------------------------------- */
/* OVERVIEW */
/* -------------------------------------------------------------------------- */

function Overview({
  summary,
  status,
  insights,
  categories,
  quality,
  onAnalytics,
}: {
  summary: Summary;
  status: Status;
  insights: string[];
  categories: CategoryRow[];
  quality: QualityData | null;
  onAnalytics: () => void;
}) {
  return (
    <>
      <StatusBanner />


      <div className="grid sm:grid-cols-2 xl:grid-cols-6 gap-4 mt-5">

        <Kpi
          label="Total Apps"
          value={
            summary.raw_rows?.toLocaleString()
          }
          sub="Original dataset"
        />


        <Kpi
          label="Pre-Subjectivity"
          value={
            summary.pre_subjectivity_rows?.toLocaleString()
          }
          sub="Real qualifying records"
        />


        <Kpi
          label="Average Rating"
          value={
            summary.avg_rating !== null &&
            summary.avg_rating !== undefined
              ? summary.avg_rating.toFixed(2)
              : "—"
          }
        />


        <Kpi
          label="Average Installs"
          value={
            summary.avg_installs !== null &&
            summary.avg_installs !== undefined
              ? summary.avg_installs.toLocaleString(
                  undefined,
                  {
                    maximumFractionDigits: 0,
                  }
                )
              : "—"
          }
        />


        <Kpi
          label="Outliers"
          value={
            summary.outliers?.toLocaleString()
          }
          sub="Category-level IQR"
        />


        <Kpi
          label="Categories"
          value={summary.categories}
          sub="Requested categories"
        />

      </div>


      <div className="grid xl:grid-cols-[1.4fr_.9fr] gap-5 mt-5">

        <div className="card p-6">

          <div className="flex items-start justify-between gap-5">

            <div>

              <div className="text-xs uppercase tracking-widest muted">
                Intelligence overview
              </div>

              <h2 className="text-xl font-black mt-1">
                Real-data analytics
              </h2>

              <p className="muted mt-2 max-w-2xl">
                Explore app ratings, size, installs,
                reviews, category behavior and
                category-level statistical outliers
                using the supplied Google Play dataset.
              </p>

            </div>


            <div className="rounded-xl p-3 bg-[var(--bg)]">
              <Activity size={22} />
            </div>

          </div>


          <div className="grid md:grid-cols-3 gap-3 mt-6">

            <InsightStat
              label="Duplicates"
              value={
                quality?.duplicate_rows ?? "—"
              }
            />


            <InsightStat
              label="Cleaned rows"
              value={
                quality?.valid_cleaned_rows ?? "—"
              }
            />


            <InsightStat
              label="Analysis window"
              value={
                status.open
                  ? "OPEN"
                  : "CLOSED"
              }
            />

          </div>


          <button
            onClick={onAnalytics}
            className="mt-6 px-5 py-3 rounded-xl font-semibold text-white"
            style={{
              background:
                "var(--accent)",
            }}
          >
            Explore analytics →
          </button>

        </div>


        <div className="card p-6">

          <div className="flex items-center gap-2">

            <Info size={18} />

            <h2 className="font-bold">
              Data integrity
            </h2>

          </div>


          <p className="muted text-sm mt-3">
            No synthetic KPI or subjectivity
            values are generated. The supplied CSV
            does not contain review text or a
            subjectivity column.
          </p>


          <div className="mt-5 space-y-3">

            <IntegrityItem
              ok
              text="Real Google Play dataset loaded"
            />

            <IntegrityItem
              ok
              text="Numeric fields normalized"
            />

            <IntegrityItem
              ok
              text="Category and threshold filters applied"
            />

            <IntegrityItem
              ok
              text="Category-level IQR available"
            />

            <IntegrityItem
              text="Subjectivity data unavailable"
            />

          </div>

        </div>

      </div>


      <div className="card p-6 mt-5">

        <div className="flex items-center gap-2">

          <Sparkles size={18} />

          <h2 className="font-bold text-lg">
            Dynamic insights
          </h2>

        </div>


        <div className="grid md:grid-cols-2 gap-3 mt-5">

          {insights.length ? (
            insights.map(
              (item, index) => (
                <div
                  key={index}
                  className="rounded-xl p-4"
                  style={{
                    background:
                      "var(--bg)",
                  }}
                >
                  <div className="text-sm">
                    {item}
                  </div>
                </div>
              )
            )
          ) : (
            <div className="muted text-sm">
              No insights are currently available.
            </div>
          )}

        </div>

      </div>
    </>
  );
}


/* -------------------------------------------------------------------------- */
/* ANALYTICS PAGE */
/* -------------------------------------------------------------------------- */

function AnalyticsPage({
  summary,
  categories,
  distributions,
  insights,
}: {
  summary: Summary;
  categories: CategoryRow[];
  distributions: DistributionData | null;
  insights: string[];
}) {
  const categoryOption = {
    tooltip: {
      trigger: "axis",
    },

    grid: {
      left: 45,
      right: 20,
      top: 30,
      bottom: 55,
    },

    xAxis: {
      type: "category",

      data: categories.map(
        (x) =>
          translateCategory(
            x.category
          )
      ),

      axisLabel: {
        rotate: 25,
      },
    },

    yAxis: {
      type: "value",
    },

    series: [
      {
        type: "bar",

        data: categories.map(
          (x) => x.count
        ),

        barMaxWidth: 38,

        itemStyle: {
          borderRadius: [
            7,
            7,
            0,
            0,
          ],
        },
      },
    ],
  };


  const ratingOption = {
    tooltip: {
      trigger: "axis",
    },

    grid: {
      left: 45,
      right: 20,
      top: 30,
      bottom: 50,
    },

    xAxis: {
      type: "category",

      data:
        distributions?.rating.map(
          (x) => x.bin
        ) || [],
    },

    yAxis: {
      type: "value",
    },

    series: [
      {
        type: "bar",

        data:
          distributions?.rating.map(
            (x) => x.count
          ) || [],

        barMaxWidth: 28,

        itemStyle: {
          borderRadius: [
            6,
            6,
            0,
            0,
          ],
        },
      },
    ],
  };


  const sizeOption = {
    tooltip: {
      trigger: "axis",
    },

    grid: {
      left: 45,
      right: 20,
      top: 30,
      bottom: 50,
    },

    xAxis: {
      type: "category",

      data:
        distributions?.size.map(
          (x) => x.bin
        ) || [],
    },

    yAxis: {
      type: "value",
    },

    series: [
      {
        type: "bar",

        data:
          distributions?.size.map(
            (x) => x.count
          ) || [],

        barMaxWidth: 28,

        itemStyle: {
          borderRadius: [
            6,
            6,
            0,
            0,
          ],
        },
      },
    ],
  };


  return (
    <div className="space-y-5">

      {/* HEADER */}

      <div className="card p-6">

        <div className="flex flex-wrap items-start justify-between gap-5">

          <div>

            <div className="text-xs uppercase tracking-widest muted">
              Interactive analytics
            </div>

            <h2 className="text-2xl font-black mt-1">
              Mobile App Analytics
            </h2>

            <p className="muted mt-2">
              Statistical exploration of the
              supplied Google Play dataset.
            </p>

          </div>


          <div className="rounded-xl px-4 py-3 bg-[var(--bg)]">

            <div className="text-xs muted">
              Real qualifying records
            </div>

            <div className="text-xl font-black mt-1">
              {
                summary.pre_subjectivity_rows?.toLocaleString() ||
                "—"
              }
            </div>

          </div>

        </div>

      </div>


      {/* KPI CARDS */}

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">

        <Kpi
          label="Qualifying Apps"
          value={
            summary.pre_subjectivity_rows?.toLocaleString()
          }
          sub="Before subjectivity requirement"
        />


        <Kpi
          label="Average Rating"
          value={
            summary.avg_rating !== null &&
            summary.avg_rating !== undefined
              ? summary.avg_rating.toFixed(2)
              : "—"
          }
        />


        <Kpi
          label="Average Installs"
          value={
            summary.avg_installs !== null &&
            summary.avg_installs !== undefined
              ? summary.avg_installs.toLocaleString(
                  undefined,
                  {
                    maximumFractionDigits: 0,
                  }
                )
              : "—"
          }
        />


        <Kpi
          label="IQR Outliers"
          value={
            summary.outliers?.toLocaleString()
          }
        />

      </div>


      {/* CHARTS */}

      <div className="grid xl:grid-cols-2 gap-5">

        {/* CATEGORY */}

        <div className="card p-5">

          <h3 className="font-bold text-lg">
            Qualifying Apps by Category
          </h3>

          <p className="muted text-sm mt-1">
            Real counts after available filters.
          </p>


          {categories.length > 0 ? (
            <ReactECharts
              option={categoryOption}
              style={{
                height: 360,
              }}
            />
          ) : (
            <EmptyChart
              message="No category data returned by the analytics API."
            />
          )}

        </div>


        {/* RATING */}

        <div className="card p-5">

          <h3 className="font-bold text-lg">
            Rating Distribution
          </h3>

          <p className="muted text-sm mt-1">
            Distribution of available rating values.
          </p>


          {distributions?.rating?.length ? (
            <ReactECharts
              option={ratingOption}
              style={{
                height: 360,
              }}
            />
          ) : (
            <EmptyChart
              message="No rating distribution data returned."
            />
          )}

        </div>


        {/* SIZE */}

        <div className="card p-5">

          <h3 className="font-bold text-lg">
            App Size Distribution
          </h3>

          <p className="muted text-sm mt-1">
            Normalized application sizes in MB.
          </p>


          {distributions?.size?.length ? (
            <ReactECharts
              option={sizeOption}
              style={{
                height: 360,
              }}
            />
          ) : (
            <EmptyChart
              message="No size distribution data returned."
            />
          )}

        </div>


        {/* INSIGHTS */}

        <div className="card p-5">

          <h3 className="font-bold text-lg">
            Analytical Insights
          </h3>


          <div className="space-y-3 mt-5">

            {insights.length ? (
              insights.map(
                (item, index) => (
                  <div
                    key={index}
                    className="rounded-xl p-4"
                    style={{
                      background:
                        "var(--bg)",
                    }}
                  >

                    <div className="flex gap-3">

                      <Sparkles size={17} />

                      <span className="text-sm">
                        {item}
                      </span>

                    </div>

                  </div>
                )
              )
            ) : (
              <div className="muted text-sm">
                No analytical insights returned by
                the backend.
              </div>
            )}

          </div>

        </div>

      </div>


      {/* SUBJECTIVITY NOTICE */}

      <div className="card p-6">

        <div className="flex items-start gap-3">

          <ShieldAlert size={20} />

          <div>

            <h3 className="font-bold">
              Subjectivity data limitation
            </h3>

            <p className="muted text-sm mt-2">
              The supplied dataset contains no
              review text and no Subjectivity field.
              Therefore Subjectivity &gt; 0.5 cannot
              be truthfully applied. The application
              does not invent NLP values.
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}


/* -------------------------------------------------------------------------- */
/* EMPTY CHART */
/* -------------------------------------------------------------------------- */

function EmptyChart({
  message,
}: {
  message: string;
}) {
  return (
    <div className="h-[360px] flex items-center justify-center">

      <div className="text-center max-w-sm">

        <div className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center bg-[var(--bg)]">
          <BarChart3 size={22} />
        </div>

        <div className="font-semibold mt-4">
          Analytics data unavailable
        </div>

        <div className="muted text-sm mt-1">
          {message}
        </div>

      </div>

    </div>
  );
}


/* -------------------------------------------------------------------------- */
/* OUTLIERS */
/* -------------------------------------------------------------------------- */

function OutlierExplorer({
  outliers,
  search,
  setSearch,
  filter,
  setFilter,
}: {
  outliers: Outlier[];
  search: string;
  setSearch: (value: string) => void;
  filter: string;
  setFilter: (value: string) => void;
}) {
  return (
    <div className="card p-5">

      <div className="flex flex-wrap justify-between gap-4">

        <div>

          <div className="text-xs uppercase tracking-widest muted">
            Statistical intelligence
          </div>

          <h2 className="font-black text-2xl mt-1">
            Outlier Explorer
          </h2>

          <p className="muted text-sm mt-1">
            Category-level IQR detection for Size
            and Rating.
          </p>

        </div>


        <div className="flex gap-2">

          <input
            className="border rounded-xl px-3 py-2 bg-transparent"
            placeholder="Search apps..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />


          <select
            className="border rounded-xl px-3 py-2 bg-transparent"
            value={filter}
            onChange={(e) =>
              setFilter(e.target.value)
            }
          >

            <option value="ALL">
              All
            </option>

            <option value="SIZE">
              Size
            </option>

            <option value="RATING">
              Rating
            </option>

          </select>

        </div>

      </div>


      <div className="overflow-auto mt-6">

        <table className="w-full text-sm">

          <thead>

            <tr className="border-b text-left">

              {[
                "App",
                "Category",
                "Size",
                "Rating",
                "Installs",
                "Reviews",
                "Type",
                "Value",
                "Q1",
                "Q3",
                "Boundary",
              ].map((heading) => (

                <th
                  key={heading}
                  className="p-3 whitespace-nowrap"
                >
                  {heading}
                </th>

              ))}

            </tr>

          </thead>


          <tbody>

            {outliers
              .slice(0, 250)
              .map(
                (item, index) => (

                  <tr
                    key={`${item.row_index}-${index}`}
                    className="border-b hover:bg-white/[0.025]"
                  >

                    <td className="p-3 font-medium max-w-[240px]">
                      {item.app}
                    </td>


                    <td className="p-3">
                      {translateCategory(
                        item.category
                      )}
                    </td>


                    <td className="p-3">
                      {item.size_mb?.toFixed(1) ??
                        "—"}
                    </td>


                    <td className="p-3">
                      {item.rating?.toFixed(2) ??
                        "—"}
                    </td>


                    <td className="p-3">
                      {item.installs?.toLocaleString() ??
                        "—"}
                    </td>


                    <td className="p-3">
                      {item.reviews?.toLocaleString() ??
                        "—"}
                    </td>


                    <td className="p-3">

                      <span
                        className="px-2 py-1 rounded-lg text-xs"
                        style={{
                          background:
                            item.outlier_type ===
                            "Size"
                              ? "rgba(99,91,255,.15)"
                              : "rgba(236,72,153,.15)",
                        }}
                      >
                        {item.outlier_type}
                      </span>

                    </td>


                    <td className="p-3">
                      {item.value.toFixed(2)}
                    </td>


                    <td className="p-3">
                      {item.q1.toFixed(2)}
                    </td>


                    <td className="p-3">
                      {item.q3.toFixed(2)}
                    </td>


                    <td className="p-3 whitespace-nowrap">

                      {item.lower_bound.toFixed(2)}
                      {" – "}
                      {item.upper_bound.toFixed(2)}

                    </td>

                  </tr>

                )
              )}

          </tbody>

        </table>


        {!outliers.length && (

          <div className="py-16 text-center">

            <ShieldAlert
              className="mx-auto mb-3 muted"
              size={32}
            />

            <h3 className="font-bold">
              No outliers found
            </h3>

            <p className="muted text-sm mt-1">
              No category-level IQR observations
              match the current search/filter.
            </p>

          </div>

        )}

      </div>

    </div>
  );
}


/* -------------------------------------------------------------------------- */
/* CATEGORY PAGE */
/* -------------------------------------------------------------------------- */

function CategoryAnalysis({
  categories,
}: {
  categories: CategoryRow[];
}) {
  return (
    <div className="space-y-5">

      <div className="card p-6">

        <div className="text-xs uppercase tracking-widest muted">
          Comparative intelligence
        </div>

        <h2 className="text-2xl font-black mt-1">
          Category Analysis
        </h2>

        <p className="muted mt-2">
          Compare the nine requested categories
          using actual calculated statistics.
        </p>

      </div>


      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">

        {categories.map((item) => (

          <motion.div
            key={item.category}
            whileHover={{
              y: -3,
            }}
            className="card p-5"
          >

            <div className="flex justify-between items-start">

              <div>

                <div className="text-sm muted">
                  {item.category}
                </div>

                <div className="font-bold text-lg mt-1">
                  {translateCategory(
                    item.category
                  )}
                </div>

              </div>


              <div className="rounded-lg p-2 bg-[var(--bg)]">
                <BarChart3 size={18} />
              </div>

            </div>


            <div className="text-3xl font-black mt-5">
              {item.count.toLocaleString()}
            </div>

            <div className="muted text-xs">
              qualifying applications
            </div>


            <div className="grid grid-cols-2 gap-3 mt-5">

              <Stat
                label="Rating"
                value={
                  item.avg_rating.toFixed(2)
                }
              />


              <Stat
                label="Size"
                value={`${item.avg_size.toFixed(1)} MB`}
              />


              <Stat
                label="Installs"
                value={
                  item.avg_installs.toLocaleString(
                    undefined,
                    {
                      maximumFractionDigits: 0,
                    }
                  )
                }
              />


              <Stat
                label="Reviews"
                value={
                  item.avg_reviews.toLocaleString(
                    undefined,
                    {
                      maximumFractionDigits: 0,
                    }
                  )
                }
              />

            </div>


            <div className="mt-4 text-xs muted">
              {item.outliers} category-level
              IQR outliers
            </div>

          </motion.div>

        ))}

      </div>

    </div>
  );
}


/* -------------------------------------------------------------------------- */
/* PIPELINE */
/* -------------------------------------------------------------------------- */

function PipelinePage({
  pipeline,
}: {
  pipeline: PipelineData | null;
}) {
  return (
    <div className="card p-6">

      <div className="text-xs uppercase tracking-widest muted">
        Processing architecture
      </div>

      <h2 className="text-2xl font-black mt-1">
        Data Pipeline
      </h2>

      <p className="muted mt-2">
        Actual record counts at each processing
        stage.
      </p>


      <div className="mt-8 space-y-4">

        {pipeline?.stages.map(
          (stage, index) => {

            const available =
              stage.count !== null;


            return (
              <div key={index}>

                <div className="flex gap-4 items-center">

                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      background:
                        available
                          ? "rgba(34,197,94,.12)"
                          : "rgba(234,179,8,.12)",
                    }}
                  >

                    {available ? (
                      <CheckCircle2 size={19} />
                    ) : (
                      <Info size={19} />
                    )}

                  </div>


                  <div className="flex-1">

                    <div className="font-bold">
                      {stage.name}
                    </div>

                    <div className="muted text-sm">

                      {available
                        ? `${stage.count?.toLocaleString()} records`
                        : "Blocked — source data unavailable"}

                    </div>

                  </div>

                </div>


                {index <
                  (pipeline.stages.length - 1) && (
                  <div className="ml-5 h-7 border-l border-dashed border-[var(--border)]" />
                )}

              </div>
            );
          }
        )}

      </div>

    </div>
  );
}


/* -------------------------------------------------------------------------- */
/* DATA QUALITY */
/* -------------------------------------------------------------------------- */

function QualityPage({
  quality,
  distributions,
}: {
  quality: QualityData | null;
  distributions: DistributionData | null;
}) {
  const missingEntries =
    Object.entries(
      quality?.missing || {}
    );


  const missingOption = {
    tooltip: {
      trigger: "axis",
    },

    grid: {
      left: 150,
      right: 25,
      top: 30,
      bottom: 30,
    },

    xAxis: {
      type: "value",
    },

    yAxis: {
      type: "category",
      data: missingEntries.map(
        ([key]) => key
      ),
    },

    series: [
      {
        type: "bar",
        data: missingEntries.map(
          ([, value]) => value
        ),
        barMaxWidth: 30,

        itemStyle: {
          borderRadius: [
            0,
            7,
            7,
            0,
          ],
        },
      },
    ],
  };


  const sizeOption = {
    tooltip: {
      trigger: "axis",
    },

    xAxis: {
      type: "category",

      data:
        distributions?.size.map(
          (x) => x.bin
        ) || [],
    },

    yAxis: {
      type: "value",
    },

    grid: {
      left: 45,
      right: 20,
      top: 30,
      bottom: 50,
    },

    series: [
      {
        type: "bar",

        data:
          distributions?.size.map(
            (x) => x.count
          ) || [],

        barMaxWidth: 30,

        itemStyle: {
          borderRadius: [
            6,
            6,
            0,
            0,
          ],
        },
      },
    ],
  };


  return (
    <div className="space-y-5">

      <div className="card p-6">

        <div className="text-xs uppercase tracking-widest muted">
          Dataset observability
        </div>

        <h2 className="text-2xl font-black mt-1">
          Data Quality
        </h2>

        <p className="muted mt-2">
          Data-quality metrics calculated directly
          from the supplied CSV.
        </p>

      </div>


      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <Kpi
          label="Total Rows"
          value={
            quality?.total_rows?.toLocaleString()
          }
        />

        <Kpi
          label="Duplicate Rows"
          value={
            quality?.duplicate_rows?.toLocaleString()
          }
        />

        <Kpi
          label="Invalid Values"
          value={
            quality?.invalid_values?.toLocaleString()
          }
        />

        <Kpi
          label="Cleaned Rows"
          value={
            quality?.valid_cleaned_rows?.toLocaleString()
          }
        />

      </div>


      <div className="grid xl:grid-cols-2 gap-5">

        <div className="card p-5">

          <h3 className="font-bold text-lg">
            Missing Values
          </h3>


          {missingEntries.length ? (
            <ReactECharts
              option={missingOption}
              style={{
                height: 360,
              }}
            />
          ) : (
            <div className="h-[360px] flex items-center justify-center muted text-sm">
              No missing values detected.
            </div>
          )}

        </div>


        <div className="card p-5">

          <h3 className="font-bold text-lg">
            Size Distribution
          </h3>


          {distributions?.size?.length ? (
            <ReactECharts
              option={sizeOption}
              style={{
                height: 360,
              }}
            />
          ) : (
            <EmptyChart
              message="No size distribution data returned."
            />
          )}

        </div>

      </div>


      <div className="card p-6">

        <h3 className="font-bold">
          Subjectivity availability
        </h3>


        <div className="flex items-center gap-3 mt-4">

          {quality?.subjectivity_available ? (
            <CheckCircle2 size={20} />
          ) : (
            <XCircle size={20} />
          )}


          <span className="text-sm">

            {quality?.subjectivity_available
              ? "Subjectivity field detected."
              : "No subjectivity field or review text exists in the supplied dataset."}

          </span>

        </div>

      </div>

    </div>
  );
}


/* -------------------------------------------------------------------------- */
/* REPORTS */
/* -------------------------------------------------------------------------- */

function ReportsPage() {

  const download = (
    url: string
  ) => {

    window.open(
      `${
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:8000"
      }${url}`,
      "_blank"
    );

  };


  return (
    <div className="space-y-5">

      <div className="card p-6">

        <div className="text-xs uppercase tracking-widest muted">
          Export center
        </div>

        <h2 className="text-2xl font-black mt-1">
          Reports & Exports
        </h2>

        <p className="muted mt-2">
          Download analytical outputs generated
          from the real dataset.
        </p>

      </div>


      <div className="grid md:grid-cols-3 gap-4">

        <ExportCard
          title="Processed Dataset"
          description="Download the cleaned analytical dataset."
          onClick={() =>
            download(
              "/api/reports/processed-csv"
            )
          }
        />


        <ExportCard
          title="Outlier CSV"
          description="Download category-level IQR outliers."
          onClick={() =>
            download(
              "/api/reports/outliers-csv"
            )
          }
        />


        <ExportCard
          title="Pipeline CSV"
          description="Download filtering-stage counts."
          onClick={() =>
            download(
              "/api/reports/pipeline-csv"
            )
          }
        />

      </div>

    </div>
  );
}


/* -------------------------------------------------------------------------- */
/* METHODOLOGY */
/* -------------------------------------------------------------------------- */

function Methodology() {

  const steps = [

    [
      "Dataset cleaning",
      "The original CSV is preserved. Numeric formats such as installs, reviews and size are normalized in a processed analytical copy.",
    ],

    [
      "Category filtering",
      "Only Game, Beauty, Business, Comics, Communication, Dating, Entertainment, Social and Events are retained.",
    ],

    [
      "Threshold filtering",
      "Rating > 3.5, Installs > 50,000, Reviews > 500 and Size between 10 MB and 100 MB.",
    ],

    [
      "Subjectivity",
      "Subjectivity > 0.5 is required by the specification, but the supplied dataset has no review text or subjectivity field. No synthetic values are created.",
    ],

    [
      "IQR",
      "Outliers are calculated independently inside every category using Q1, Q3 and 1.5 × IQR boundaries.",
    ],

    [
      "Hexbin",
      "App Size is plotted against Rating while average installs determine hexbin intensity.",
    ],

    [
      "Availability",
      "The live hexbin endpoint is available from 5:00 PM inclusive until 7:00 PM exclusive in Asia/Kolkata.",
    ],

  ];


  return (
    <div className="card p-6">

      <div className="text-xs uppercase tracking-widest muted">
        Analytical methodology
      </div>

      <h2 className="text-2xl font-black mt-1">
        Methodology
      </h2>


      <div className="space-y-4 mt-7">

        {steps.map(
          ([title, description], index) => (

            <div
              key={title}
              className="rounded-2xl p-5"
              style={{
                background:
                  "var(--bg)",
              }}
            >

              <div className="flex gap-4">

                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-bold shrink-0"
                  style={{
                    background:
                      "var(--card)",
                  }}
                >
                  {index + 1}
                </div>


                <div>

                  <h3 className="font-bold">
                    {title}
                  </h3>

                  <p className="muted text-sm mt-1">
                    {description}
                  </p>

                </div>

              </div>

            </div>

          )
        )}

      </div>

    </div>
  );
}


/* -------------------------------------------------------------------------- */
/* SETTINGS */
/* -------------------------------------------------------------------------- */

function Settings() {
  return (
    <div className="card p-6">

      <div className="text-xs uppercase tracking-widest muted">
        Configuration
      </div>

      <h2 className="text-2xl font-black mt-1">
        Settings
      </h2>


      <div className="grid md:grid-cols-2 gap-4 mt-6">

        <div
          className="rounded-2xl p-5"
          style={{
            background:
              "var(--bg)",
          }}
        >

          <Database size={20} />

          <h3 className="font-bold mt-3">
            Data source
          </h3>

          <p className="muted text-sm mt-1">
            Supplied Google Play CSV.
          </p>

        </div>


        <div
          className="rounded-2xl p-5"
          style={{
            background:
              "var(--bg)",
          }}
        >

          <Clock3 size={20} />

          <h3 className="font-bold mt-3">
            Analysis window
          </h3>

          <p className="muted text-sm mt-1">
            5:00 PM–7:00 PM IST for live hexbin
            analytics.
          </p>

        </div>

      </div>

    </div>
  );
}


/* -------------------------------------------------------------------------- */
/* BLOCKED ANALYSIS */
/* -------------------------------------------------------------------------- */

function BlockedAnalysis({
  status,
}: {
  status: Status;
}) {
  return (
    <div className="card p-12 mt-5 text-center">

      <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center bg-[var(--bg)]">

        {status.open ? (
          <XCircle size={27} />
        ) : (
          <Clock3 size={27} />
        )}

      </div>


      <h2 className="font-black text-2xl mt-5">

        {status.open
          ? "Analysis unavailable"
          : "ANALYSIS WINDOW CLOSED"}

      </h2>


      <p className="muted mt-2 max-w-xl mx-auto">

        {status.open
          ? "The supplied dataset does not contain subjectivity data, so the required Subjectivity > 0.5 filter cannot be truthfully applied."
          : "The interactive App Size vs Rating analysis is available daily from 5:00 PM to 7:00 PM IST."}

      </p>

    </div>
  );
}


/* -------------------------------------------------------------------------- */
/* LANDING */
/* -------------------------------------------------------------------------- */

function Landing({
  onExplore,
}: {
  onExplore: () => void;
}) {
  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "var(--bg)",
      }}
    >

      <div className="max-w-7xl mx-auto px-6 md:px-10 py-8">

        <header className="flex items-center justify-between">

          <div className="font-black text-xl">

            AppInsight{" "}

            <span
              style={{
                color:
                  "var(--accent)",
              }}
            >
              Analytics
            </span>

          </div>


          <div className="text-xs muted">
            DATA INTELLIGENCE PLATFORM
          </div>

        </header>


        <section className="grid lg:grid-cols-2 gap-12 items-center min-h-[75vh]">

          <div>

            <motion.div
              initial={{
                opacity: 0,
                y: 15,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="text-sm font-bold tracking-[0.2em]"
              style={{
                color:
                  "var(--accent)",
              }}
            >
              APPINSIGHT ANALYTICS
            </motion.div>


            <motion.h1
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.1,
              }}
              className="text-5xl md:text-7xl font-black leading-[0.95] mt-5"
            >

              Turn Mobile App Data Into{" "}

              <span
                style={{
                  color:
                    "var(--accent)",
                }}
              >
                Actionable Intelligence
              </span>

            </motion.h1>


            <p className="text-lg muted mt-7 max-w-xl">
              Explore application size, ratings,
              installs, reviews and statistical
              anomalies through an interactive
              analytics platform built around real
              Google Play data.
            </p>


            <div className="flex flex-wrap gap-3 mt-8">

              <button
                onClick={onExplore}
                className="px-6 py-3 rounded-xl text-white font-bold"
                style={{
                  background:
                    "var(--accent)",
                }}
              >
                Explore Analytics →
              </button>


              <button
                onClick={onExplore}
                className="px-6 py-3 rounded-xl border font-semibold"
              >
                View Methodology
              </button>

            </div>

          </div>


          <div className="card p-5">

            <div className="flex justify-between items-center">

              <div>

                <div className="text-xs muted uppercase tracking-widest">
                  Analytics preview
                </div>

                <div className="font-bold mt-1">
                  Size × Rating Intelligence
                </div>

              </div>


              <BarChart3 size={20} />

            </div>


            <div
              className="mt-5 rounded-2xl h-[360px] overflow-hidden"
              style={{
                background:
                  "var(--bg)",
              }}
            >

              <div className="h-full grid grid-cols-10 gap-1 p-8 items-end">

                {[
                  4,
                  7,
                  5,
                  10,
                  8,
                  13,
                  9,
                  15,
                  12,
                  17,
                ].map(
                  (height, index) => (

                    <motion.div
                      key={index}
                      initial={{
                        height: 0,
                      }}
                      animate={{
                        height:
                          `${height * 12}px`,
                      }}
                      transition={{
                        delay:
                          index * 0.06,
                      }}
                      className="rounded-t-lg"
                      style={{
                        background:
                          index % 3 === 0
                            ? "var(--accent-2)"
                            : "var(--accent)",
                      }}
                    />

                  )
                )}

              </div>

            </div>

          </div>

        </section>


        <section className="grid md:grid-cols-3 gap-4 pb-12">

          <FeatureCard
            icon={
              <BarChart3 size={20} />
            }
            title="Interactive visualization"
            description="Explore the analytical relationship between application size and rating."
          />


          <FeatureCard
            icon={
              <ShieldAlert size={20} />
            }
            title="Category-level IQR"
            description="Detect statistical outliers independently inside each category."
          />


          <FeatureCard
            icon={
              <Workflow size={20} />
            }
            title="Real-data pipeline"
            description="Every displayed KPI and record count is calculated from the supplied dataset."
          />

        </section>

      </div>

    </div>
  );
}


/* -------------------------------------------------------------------------- */
/* SMALL COMPONENTS */
/* -------------------------------------------------------------------------- */

function MiniInfo({
  icon,
  title,
  value,
  pink,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  pink?: boolean;
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background:
          "var(--bg)",
      }}
    >

      <div className="flex items-center gap-2 muted">

        {icon}

        <span className="text-xs uppercase tracking-wider">
          {title}
        </span>

      </div>


      <div
        className="font-bold mt-3"
        style={
          pink
            ? {
                color:
                  "var(--game)",
              }
            : undefined
        }
      >
        {value}
      </div>

    </div>
  );
}


function InsightStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background:
          "var(--bg)",
      }}
    >

      <div className="muted text-xs">
        {label}
      </div>

      <div className="font-black text-xl mt-1">

        {typeof value === "number"
          ? value.toLocaleString()
          : value}

      </div>

    </div>
  );
}


function IntegrityItem({
  text,
  ok = false,
}: {
  text: string;
  ok?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 text-sm">

      {ok ? (
        <CheckCircle2 size={17} />
      ) : (
        <XCircle size={17} />
      )}

      <span>
        {text}
      </span>

    </div>
  );
}


function Stat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>

      <div className="muted text-xs">
        {label}
      </div>

      <div className="font-bold mt-1">
        {value}
      </div>

    </div>
  );
}


function ExportCard({
  title,
  description,
  onClick,
}: {
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <div className="card p-5">

      <Download size={20} />

      <h3 className="font-bold mt-4">
        {title}
      </h3>

      <p className="muted text-sm mt-1">
        {description}
      </p>


      <button
        onClick={onClick}
        className="mt-5 border rounded-xl px-4 py-2 text-sm font-semibold"
      >
        Export
      </button>

    </div>
  );
}


function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="card p-5">

      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{
          background:
            "rgba(99,91,255,.12)",
        }}
      >
        {icon}
      </div>


      <h3 className="font-bold mt-4">
        {title}
      </h3>


      <p className="muted text-sm mt-2">
        {description}
      </p>

    </div>
  );
}