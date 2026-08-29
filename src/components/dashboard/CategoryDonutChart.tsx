"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface CategoryDonutChartProps {
  data: Array<{ name: string; icon: string | null; amount: number }>;
}

const COLORS = [
  "var(--color-accent-sky)",
  "var(--color-accent-purple)",
  "var(--color-accent-pink)",
  "var(--color-accent-orange)",
  "var(--color-accent-teal)",
  "var(--color-accent-green)",
  "var(--color-accent-brown)",
  "var(--color-accent-purple-deep)",
];

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { icon: string | null } }>;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-[var(--color-hairline)] rounded-[var(--radius-lg)] p-3 shadow-level-2">
        <p className="caption font-medium text-[var(--color-ink)]">
          {payload[0].payload.icon} {payload[0].name}
        </p>
        <p className="caption text-[var(--color-ink-muted)] mt-0.5">
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export function CategoryDonutChart({ data }: CategoryDonutChartProps) {
  const isEmpty = data.length === 0;

  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-hairline)] p-4 sm:p-5 shadow-level-1 min-w-0">
      <h2 className="title text-[var(--color-ink)] mb-3 sm:mb-4">Expenses by Category</h2>
      {isEmpty ? (
        <div className="flex items-center justify-center h-40 sm:h-52 text-[var(--color-ink-faint)] caption">
          No expenses this month.
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={72}
                paddingAngle={2}
                dataKey="amount"
                nameKey="name"
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <ul className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 mt-2">
            {data.map((item, index) => (
              <li key={item.name} className="flex items-center gap-1.5 caption text-[var(--color-ink-muted)]">
                <span
                  className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="truncate max-w-[9rem]">{item.icon} {item.name}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
