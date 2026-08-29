"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/utils";

const COLORS = [
  "var(--color-accent-sky)",
  "var(--color-accent-purple)",
  "var(--color-accent-pink)",
  "var(--color-accent-orange)",
  "var(--color-accent-teal)",
  "var(--color-accent-green)",
];

interface CategoryMiniChartProps {
  data: Array<{ name: string; amount: number; icon: string | null }>;
}

export function CategoryMiniChart({ data }: CategoryMiniChartProps) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <PieChart>
        <Pie data={data} dataKey="amount" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={65}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} />
      </PieChart>
    </ResponsiveContainer>
  );
}
