"use client";

import {
  BarChart3,
  Database,
  FileBarChart,
  FileText,
  Layers,
  LayoutDashboard,
  LineChart,
  Settings,
  ShieldAlert,
  Workflow,
} from "lucide-react";

export default function Sidebar({
  page,
  setPage,
}: {
  page: string;
  setPage: (page: string) => void;
}) {
  const items = [
    ["Overview", LayoutDashboard],
    ["Analytics", LineChart],
    ["Hexbin Explorer", BarChart3],
    ["Outliers", ShieldAlert],
    ["Categories", Layers],
    ["Data Pipeline", Workflow],
    ["Data Quality", Database],
    ["Reports", FileBarChart],
    ["Methodology", FileText],
    ["Settings", Settings],
  ];

  return (
    <aside
      className="hidden lg:flex w-72 shrink-0 flex-col p-4 border-r sticky top-0 h-screen"
      style={{
        borderColor: "var(--border)",
        background: "var(--bg)",
      }}
    >
      <div className="px-3 py-6">
        <div className="text-xl font-black tracking-tight">
          AppInsight
        </div>

        <div
          className="text-xl font-black"
          style={{ color: "var(--accent)" }}
        >
          Analytics
        </div>

        <div className="text-[10px] uppercase tracking-[0.2em] muted mt-3">
          Mobile App Intelligence
        </div>
      </div>

      <nav className="space-y-1 mt-4">
        {items.map(([name, Icon]) => {
          const active = page === name;

          return (
            <button
              key={name as string}
              onClick={() => setPage(name as string)}
              className={[
                "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition",
                active
                  ? "bg-white/10 border border-white/10"
                  : "hover:bg-white/5",
              ].join(" ")}
            >
              {<Icon size={18} />}

              <span className="text-sm font-medium">
                {name as string}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto p-3">
        <div
          className="rounded-xl p-4"
          style={{ background: "var(--card)" }}
        >
          <div className="text-xs muted">
            DATA SOURCE
          </div>

          <div className="font-semibold text-sm mt-1">
            Google Play Store
          </div>

          <div className="text-xs muted mt-2">
            Real supplied dataset
          </div>
        </div>
      </div>
    </aside>
  );
}