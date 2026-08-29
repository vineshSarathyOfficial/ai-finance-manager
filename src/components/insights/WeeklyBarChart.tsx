"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface WeeklyBarChartProps {
  data: Array<{ label: string; expenses: number }>;
}

export function WeeklyBarChart({ data }: WeeklyBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data}>
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`} />
        <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} />
        <Bar dataKey="expenses" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
