"use client";

import ReactECharts from "echarts-for-react";

type Hexbin = {
  polygon: number[][];
  count: number;
  avg_installs: number;
  avg_rating: number;
  avg_size: number;
};

type Outlier = {
  app: string;
  category: string;
  size_mb: number | null;
  rating: number | null;
  installs: number | null;
  reviews: number | null;
  outlier_type: string;
};

export default function HexbinChart({
  data,
  points,
  showOutliers = true,
}: {
  data: Hexbin[];
  points: Outlier[];
  showOutliers?: boolean;
}) {
  if (!data?.length) {
    return (
      <div className="h-[560px] flex items-center justify-center rounded-2xl bg-[var(--bg)]">
        <div className="text-center">
          <div className="font-bold">
            No hexbin data
          </div>

          <div className="muted text-sm mt-1">
            No applications match the current analytical
            conditions.
          </div>
        </div>
      </div>
    );
  }

  const maxInstalls = Math.max(
    ...data.map(
      (item) => item.avg_installs
    ),
    1
  );

  const hexSeries = data.map((item) => ({
    value: [
      item.avg_size,
      item.avg_rating,
      item.avg_installs,
    ],
    polygon: item.polygon,
    count: item.count,
    avg_installs: item.avg_installs,
    avg_rating: item.avg_rating,
    avg_size: item.avg_size,
  }));

  const outlierSeries = points
    .filter(
      (item) =>
        item.size_mb !== null &&
        item.rating !== null
    )
    .map((item) => ({
      value: [
        item.size_mb,
        item.rating,
      ],
      app: item.app,
      category: item.category,
      installs: item.installs,
      reviews: item.reviews,
      outlier_type: item.outlier_type,
    }));

  const option = {
    animation: true,

    tooltip: {
      trigger: "item",

      formatter: (params: any) => {
        if (
          params.seriesType === "scatter"
        ) {
          const d = params.data;

          return `
            <div style="min-width:220px">
              <strong>${d.app}</strong>
              <br/>
              Category: ${d.category}
              <br/>
              Size: ${d.value[0]?.toFixed(1)} MB
              <br/>
              Rating: ${d.value[1]?.toFixed(2)}
              <br/>
              Installs: ${
                d.installs?.toLocaleString() ??
                "—"
              }
              <br/>
              Reviews: ${
                d.reviews?.toLocaleString() ??
                "—"
              }
              <br/>
              Outlier: ${d.outlier_type}
            </div>
          `;
        }

        const d = params.data;

        return `
          <div style="min-width:220px">
            <strong>Hexbin region</strong>
            <br/>
            Apps: ${d.count}
            <br/>
            Average installs: ${
              d.avg_installs?.toLocaleString(
                undefined,
                {
                  maximumFractionDigits: 0,
                }
              )
            }
            <br/>
            Average rating: ${
              d.avg_rating?.toFixed(2)
            }
            <br/>
            Average size: ${
              d.avg_size?.toFixed(1)
            } MB
          </div>
        `;
      },
    },

    grid: {
      left: 65,
      right: 35,
      top: 40,
      bottom: 75,
    },

    xAxis: {
      type: "value",
      name: "App Size (MB)",
      nameLocation: "middle",
      nameGap: 45,
      min: 10,
      max: 100,
    },

    yAxis: {
      type: "value",
      name: "Rating",
      nameLocation: "middle",
      nameGap: 50,
      min: 3.5,
      max: 5,
    },

    dataZoom: [
      {
        type: "inside",
        xAxisIndex: 0,
      },
      {
        type: "inside",
        yAxisIndex: 0,
      },
      {
        type: "slider",
        xAxisIndex: 0,
        bottom: 10,
      },
    ],

    visualMap: {
      min: 0,
      max: maxInstalls,
      dimension: 2,
      orient: "vertical",
      right: 0,
      top: "center",
      text: ["High installs", "Low installs"],
      calculable: true,
      inRange: {
        color: [
          "#eef2ff",
          "#c7d2fe",
          "#818cf8",
          "#4f46e5",
          "#312e81",
        ],
      },
    },

    series: [
      {
        name: "Install density",
        type: "custom",

        renderItem(
          params: any,
          api: any
        ) {
          const item =
            hexSeries[
              params.dataIndex
            ];

          const points = item.polygon.map(
            (point) =>
              api.coord(point)
          );

          const intensity =
            item.avg_installs /
            maxInstalls;

          return {
            type: "polygon",

            shape: {
              points,
            },

            style: {
              fill: `rgba(79,70,229,${
                0.2 + intensity * 0.75
              })`,
              stroke:
                "rgba(255,255,255,.12)",
              lineWidth: 1,
            },
          };
        },

        data: hexSeries,
      },

      ...(showOutliers
        ? [
            {
              name: "Outliers",
              type: "scatter",

              data: outlierSeries,

              symbol: "circle",

              symbolSize: 13,

              itemStyle: {
                color: "#ec4899",
                borderColor: "#ffffff",
                borderWidth: 2,
              },

              label: {
                show: true,
                formatter: (params: any) =>
                  params.data.app,
                position: "top",
                fontSize: 10,
              },
            },
          ]
        : []),
    ],
  };

  return (
    <div>
      <ReactECharts
        option={option}
        style={{
          height: 560,
          width: "100%",
        }}
        opts={{
          renderer: "canvas",
        }}
      />

      <div className="flex flex-wrap gap-5 justify-center mt-3 text-xs muted">
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-sm"
            style={{
              background: "#4f46e5",
            }}
          />

          Average installs
        </div>

        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{
              background: "#ec4899",
            }}
          />

          IQR outlier / Game highlight
        </div>
      </div>
    </div>
  );
}