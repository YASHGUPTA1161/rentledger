"use client";

import "./RentalBarChart.css";
import { useState, useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type TooltipItem,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

// ── Types ─────────────────────────────────────────────────────────────────────

interface RawBill {
  propertyId: string;
  month: string; // ISO string from server
  rent: number;
  electricity: number;
  water: number;
  collected: number;
}

interface PropertyOption {
  id: string;
  address: string;
}

interface Props {
  rawBills: RawBill[];
  properties: PropertyOption[];
  currency: string;
}

// ── Duration options ──────────────────────────────────────────────────────────
// Each option: label shown in UI → how many months back to show
const DURATION_OPTIONS = [
  { label: "1M", months: 1 },
  { label: "3M", months: 3 },
  { label: "6M", months: 6 },
  { label: "1Y", months: 12 },
  { label: "2Y", months: 24 },
] as const;

// ── Helper ────────────────────────────────────────────────────────────────────
function formatMonth(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
  });
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function RentalBarChart({
  rawBills,
  properties,
  currency,
}: Props) {
  const [months, setMonths] = useState<number>(6);
  const [propertyId, setPropertyId] = useState<string>("all");

  // ── Filter + aggregate client-side ──────────────────────────────────────
  const chartData = useMemo(() => {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - (months - 1));
    cutoff.setDate(1);
    cutoff.setHours(0, 0, 0, 0);

    const filtered = rawBills.filter((b) => {
      const billDate = new Date(b.month);
      const matchesProp = propertyId === "all" || b.propertyId === propertyId;
      const matchesDate = billDate >= cutoff;
      return matchesProp && matchesDate;
    });

    // Group by month label
    const map = new Map<
      string,
      { rent: number; electricity: number; water: number; collected: number }
    >();
    for (const b of filtered) {
      const key = formatMonth(b.month);
      const prev = map.get(key) ?? {
        rent: 0,
        electricity: 0,
        water: 0,
        collected: 0,
      };
      map.set(key, {
        rent: prev.rent + b.rent,
        electricity: prev.electricity + b.electricity,
        water: prev.water + b.water,
        collected: prev.collected + b.collected,
      });
    }

    return Array.from(map.entries()).map(([month, vals]) => ({
      month,
      ...vals,
    }));
  }, [rawBills, months, propertyId]);

  // ── Chart.js config ──────────────────────────────────────────────────────
  const data = {
    labels: chartData.map((d) => d.month),
    datasets: [
      {
        label: "Rent",
        data: chartData.map((d) => d.rent),
        backgroundColor: "#1d2c43",
        borderRadius: 5,
        borderSkipped: false,
      },
      {
        label: "Electricity",
        data: chartData.map((d) => d.electricity),
        backgroundColor: "#0e7490",
        borderRadius: 5,
        borderSkipped: false,
      },
      {
        label: "Water",
        data: chartData.map((d) => d.water),
        backgroundColor: "#b45309",
        borderRadius: 5,
        borderSkipped: false,
      },
      {
        label: "Collected",
        data: chartData.map((d) => d.collected),
        backgroundColor: "#15803d",
        borderRadius: 5,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          boxWidth: 12,
          boxHeight: 12,
          borderRadius: 3,
          useBorderRadius: true,
          font: { size: 12 },
          color: "#595964",
        },
      },
      title: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<"bar">) =>
            ` ${ctx.dataset.label ?? ""}: ${currency} ${(ctx.parsed.y ?? 0).toLocaleString()}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#a1a1a5", font: { size: 11 } },
      },
      y: {
        grid: { color: "#f0f0f0" },
        ticks: {
          color: "#a1a1a5",
          font: { size: 11 },
          callback: (value: number | string) =>
            `${currency} ${Number(value).toLocaleString()}`,
        },
        border: { display: false },
      },
    },
  };

  return (
    <div className="rental-chart-card">
      {/* ── Header: title + filters ── */}
      <div className="rental-chart-header">
        <div>
          <h3 className="rental-chart-title">Monthly Revenue Breakdown</h3>
          <p className="rental-chart-sub">
            {propertyId === "all"
              ? "All properties"
              : (properties.find((p) => p.id === propertyId)?.address ??
                "Selected property")}
          </p>
        </div>

        {/* ── Filter controls ── */}
        <div className="rental-chart-filters">
          {/* Property selector */}
          <select
            className="rental-chart-select"
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
          >
            <option value="all">All Properties</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.address.length > 30
                  ? p.address.slice(0, 30) + "…"
                  : p.address}
              </option>
            ))}
          </select>

          {/* Duration pill buttons */}
          <div className="rental-chart-duration">
            {DURATION_OPTIONS.map((opt) => (
              <button
                key={opt.months}
                className={`rental-chart-pill${months === opt.months ? " rental-chart-pill--active" : ""}`}
                onClick={() => setMonths(opt.months)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Chart body ── */}
      {chartData.length === 0 ? (
        <p className="rental-chart-empty">
          No billing data for the selected period.
        </p>
      ) : (
        <div className="rental-chart-body">
          <Bar data={data} options={options} />
        </div>
      )}
    </div>
  );
}
