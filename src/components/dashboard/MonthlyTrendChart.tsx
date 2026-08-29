"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface MonthlyTrendChartProps {
  data: Array<{ month: string; income: number; expenses: number }>;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ color: string; name: string; value: number }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-[var(--color-hairline)] rounded-[var(--radius-lg)] p-3 shadow-level-2">
        <p className="eyebrow text-[var(--color-ink-muted)] mb-2">{label}</p>
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2 caption text-[var(--color-ink)]">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="capitalize">{entry.name}:</span>
            <span className="font-medium">{formatCurrency(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  const isEmpty = data.every((d) => d.income === 0 && d.expenses === 0);

  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-hairline)] p-5 shadow-level-1 h-full">
      <h2 className="title text-[var(--color-ink)] mb-4">Monthly Trend</h2>
      {isEmpty ? (
        <div className="flex items-center justify-center h-52 text-[var(--color-ink-faint)] caption">
          No data yet. Add transactions to see your trend.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} barGap={4} barCategoryGap="30%">
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-hairline)"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: "var(--color-ink-faint)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) =>
                v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`
              }
              tick={{ fontSize: 12, fill: "var(--color-ink-faint)" }}
              axisLine={false}
              tickLine={false}
              width={56}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--color-canvas-soft)" }} />
            <Legend
              wrapperStyle={{ fontSize: "12px", color: "var(--color-ink-muted)", paddingTop: "12px" }}
              iconType="circle"
              iconSize={8}
            />
            <Bar dataKey="income" name="Income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" name="Expenses" fill="var(--color-ink)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
