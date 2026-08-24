"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  ReferenceLine,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, Wallet, Target, ShoppingBag, BarChart2 } from "lucide-react";


// ─── Colour palette ───────────────────────────────────────────────────────────
const COLORS = [
  "#0075de", "#2a9d99", "#dd5b00", "#d6b6f6", "#62aef0",
  "#1aae39", "#ff64c8", "#f59e0b", "#ef4444", "#8b5cf6",
];

// ─── Shared tooltip ───────────────────────────────────────────────────────────
function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ color: string; name: string; value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[var(--color-hairline)] rounded-[var(--radius-lg)] p-3 shadow-level-2 text-sm min-w-[140px]">
      <p className="eyebrow text-[var(--color-ink-muted)] mb-2">{label}</p>
      {payload.map((e) => (
        <div key={e.name} className="flex items-center gap-2 caption text-[var(--color-ink)] mb-0.5">
          <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ background: e.color }} />
          <span>{e.name}:</span>
          <span className="font-semibold ml-auto">{formatCurrency(e.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface AnalyticsChartsProps {
  trend: Array<{ month: string; income: number; expenses: number }>;
  categorySpend: Array<{ name: string; icon: string | null; amount: number }>;
  monthlyCategoryData: Record<string, number | string>[];
  netWorthTrend: Array<{ month: string; netSavings: number; cumulative: number }>;
  dailyHeatmap: Array<{ day: string; avgSpend: number; totalSpend: number; txCount: number }>;
  topMerchants: Array<{ name: string; totalAmount: number; txCount: number }>;
}

// ─── Main component ───────────────────────────────────────────────────────────
export function AnalyticsCharts({
  trend,
  categorySpend,
  monthlyCategoryData,
  netWorthTrend,
  dailyHeatmap,
  topMerchants,
}: AnalyticsChartsProps) {
  const categoryNames = Array.from(
    new Set(monthlyCategoryData.flatMap((d) => Object.keys(d).filter((k) => k !== "month")))
  ).slice(0, 6);

  // ── KPI calculations ────────────────────────────────────────────────────────
  const latestMonth = trend[trend.length - 1];
  const totalSpend6m = trend.reduce((s, m) => s + m.expenses, 0);
  const avgMonthlySpend = trend.length ? Math.round(totalSpend6m / trend.length) : 0;
  const savingsRate =
    latestMonth && latestMonth.income > 0
      ? Math.round(((latestMonth.income - latestMonth.expenses) / latestMonth.income) * 100)
      : 0;
  const biggestCategory = categorySpend[0]?.name ?? "—";
  const maxDailyDay = [...dailyHeatmap].sort((a, b) => b.avgSpend - a.avgSpend)[0]?.day ?? "—";

  const kpiCards = [
    {
      label: "Total Spend (6m)",
      value: formatCurrency(totalSpend6m),
      icon: Wallet,
      iconColor: "text-[var(--color-primary)]",
      iconBg: "bg-blue-50",
    },
    {
      label: "Avg Monthly Spend",
      value: formatCurrency(avgMonthlySpend),
      icon: TrendingDown,
      iconColor: "text-rose-500",
      iconBg: "bg-rose-50",
    },
    {
      label: "Savings Rate (this month)",
      value: `${savingsRate}%`,
      icon: Target,
      iconColor:
        savingsRate >= 20
          ? "text-[var(--color-accent-green)]"
          : savingsRate >= 0
          ? "text-[var(--color-warning)]"
          : "text-[var(--color-error)]",
      iconBg:
        savingsRate >= 20 ? "bg-green-50" : savingsRate >= 0 ? "bg-amber-50" : "bg-red-50",
    },
    {
      label: "Biggest Category",
      value: biggestCategory,
      icon: ShoppingBag,
      iconColor: "text-[var(--color-accent-teal)]",
      iconBg: "bg-teal-50",
    },
    {
      label: "Highest Spend Day",
      value: maxDailyDay,
      icon: TrendingUp,
      iconColor: "text-[var(--color-accent-orange)]",
      iconBg: "bg-orange-50",
    },
  ];

  const hasAnyData = trend.some((d) => d.income > 0 || d.expenses > 0);

  return (
    <div className="space-y-6">

      {/* ── KPI Row ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpiCards.map(({ label, value, icon: Icon, iconColor, iconBg }) => (
          <div
            key={label}
            className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-hairline)] p-4 shadow-level-1"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="caption text-[var(--color-ink-muted)] leading-tight">{label}</span>
              <div className={`w-7 h-7 rounded-[var(--radius-sm)] flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
              </div>
            </div>
            <p className="text-xl font-bold text-[var(--color-ink)] tracking-tight truncate">{value}</p>
          </div>
        ))}
      </div>

      {/* ── Income vs Expenses line chart ───────────────────────────────────── */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-hairline)] p-5 shadow-level-1">
        <h2 className="title text-[var(--color-ink)] mb-4">Income vs Expenses (6 months)</h2>
        {!hasAnyData ? (
          <EmptyState />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-hairline)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--color-ink-faint)" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`} tick={{ fontSize: 12, fill: "var(--color-ink-faint)" }} axisLine={false} tickLine={false} width={60} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--color-hairline)" }} />
              <Legend wrapperStyle={{ fontSize: "12px", color: "var(--color-ink-muted)" }} iconType="circle" iconSize={8} />
              <Line type="monotone" dataKey="income" name="Income" stroke="var(--color-accent-green)" strokeWidth={2.5} dot={{ r: 4, fill: "var(--color-accent-green)", strokeWidth: 0 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="expenses" name="Expenses" stroke="var(--color-error)" strokeWidth={2.5} dot={{ r: 4, fill: "var(--color-error)", strokeWidth: 0 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Net savings area chart ──────────────────────────────────────────── */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-hairline)] p-5 shadow-level-1">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="title text-[var(--color-ink)]">Net Savings Trend</h2>
            <p className="caption text-[var(--color-ink-muted)] mt-0.5">Cumulative income minus expenses over time</p>
          </div>
          {netWorthTrend.length > 0 && (
            <div className={`px-3 py-1.5 rounded-[var(--radius-full)] text-sm font-semibold ${
              (netWorthTrend[netWorthTrend.length - 1]?.cumulative ?? 0) >= 0
                ? "bg-green-50 text-[var(--color-accent-green)]"
                : "bg-red-50 text-[var(--color-error)]"
            }`}>
              {formatCurrency(netWorthTrend[netWorthTrend.length - 1]?.cumulative ?? 0)}
            </div>
          )}
        </div>
        {!hasAnyData ? (
          <EmptyState />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={netWorthTrend}>
              <defs>
                <linearGradient id="cumulativeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1aae39" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#1aae39" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="netSavingsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0075de" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#0075de" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-hairline)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--color-ink-faint)" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`} tick={{ fontSize: 12, fill: "var(--color-ink-faint)" }} axisLine={false} tickLine={false} width={60} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--color-hairline)" }} />
              <ReferenceLine y={0} stroke="var(--color-hairline)" strokeDasharray="4 2" />
              <Legend wrapperStyle={{ fontSize: "12px", color: "var(--color-ink-muted)" }} iconType="circle" iconSize={8} />
              <Area type="monotone" dataKey="cumulative" name="Cumulative savings" stroke="#1aae39" strokeWidth={2.5} fill="url(#cumulativeGrad)" dot={{ r: 3, fill: "#1aae39", strokeWidth: 0 }} />
              <Area type="monotone" dataKey="netSavings" name="Monthly net" stroke="#0075de" strokeWidth={2} fill="url(#netSavingsGrad)" strokeDasharray="5 3" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Two-column: Category + Stacked Breakdown ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Categories Bar */}
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-hairline)] p-5 shadow-level-1">
          <h2 className="title text-[var(--color-ink)] mb-4">Top Expense Categories <span className="caption text-[var(--color-ink-muted)] font-normal">(this month)</span></h2>
          {categorySpend.length === 0 ? (
            <EmptyState />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={categorySpend} layout="vertical" barCategoryGap="28%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-hairline)" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "var(--color-ink-faint)" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "var(--color-ink-muted)" }} axisLine={false} tickLine={false} width={85} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-canvas-soft)" }} />
                <Bar dataKey="amount" name="Amount" fill="var(--color-primary)" radius={[0, 5, 5, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Monthly stacked breakdown */}
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-hairline)] p-5 shadow-level-1">
          <h2 className="title text-[var(--color-ink)] mb-4">Monthly Category Breakdown</h2>
          {monthlyCategoryData.length === 0 ? (
            <EmptyState />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyCategoryData} barCategoryGap="28%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-hairline)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--color-ink-faint)" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "var(--color-ink-faint)" }} axisLine={false} tickLine={false} width={56} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-canvas-soft)" }} />
                <Legend wrapperStyle={{ fontSize: "11px", color: "var(--color-ink-muted)" }} iconType="circle" iconSize={7} />
                {categoryNames.map((cat, i) => (
                  <Bar key={cat} dataKey={cat} stackId="a" fill={COLORS[i % COLORS.length]} radius={i === categoryNames.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Two-column: Day-of-Week heatmap + Top Merchants ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Day-of-week spending */}
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-hairline)] p-5 shadow-level-1">
          <div className="mb-4">
            <h2 className="title text-[var(--color-ink)]">Spending by Day of Week</h2>
            <p className="caption text-[var(--color-ink-muted)] mt-0.5">Average daily spend over last 90 days</p>
          </div>
          {dailyHeatmap.every((d) => d.avgSpend === 0) ? (
            <EmptyState />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={dailyHeatmap} barCategoryGap="22%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-hairline)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: "var(--color-ink-faint)" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "var(--color-ink-faint)" }} axisLine={false} tickLine={false} width={52} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload as { day: string; avgSpend: number; txCount: number };
                    return (
                      <div className="bg-white border border-[var(--color-hairline)] rounded-[var(--radius-lg)] p-3 shadow-level-2 text-sm">
                        <p className="eyebrow text-[var(--color-ink-muted)] mb-1">{label}</p>
                        <p className="caption text-[var(--color-ink)]">Avg spend: <span className="font-semibold">{formatCurrency(d.avgSpend)}</span></p>
                        <p className="caption text-[var(--color-ink-muted)]">{d.txCount} transactions</p>
                      </div>
                    );
                  }}
                  cursor={{ fill: "var(--color-canvas-soft)" }}
                />
                <Bar dataKey="avgSpend" name="Avg Spend" fill="var(--color-accent-teal)" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top merchants */}
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-hairline)] p-5 shadow-level-1">
          <div className="mb-4">
            <h2 className="title text-[var(--color-ink)]">Top Merchants</h2>
            <p className="caption text-[var(--color-ink-muted)] mt-0.5">Highest spend this month</p>
          </div>
          {topMerchants.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-2">
              {topMerchants.map((merchant, i) => {
                const maxAmount = topMerchants[0].totalAmount;
                const pct = maxAmount > 0 ? (merchant.totalAmount / maxAmount) * 100 : 0;
                return (
                  <div key={merchant.name} className="flex items-center gap-3">
                    <span className="eyebrow text-[var(--color-ink-faint)] w-4 flex-shrink-0">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="caption text-[var(--color-ink)] font-medium truncate pr-2">{merchant.name}</p>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="eyebrow text-[var(--color-ink-faint)]">{merchant.txCount}×</span>
                          <span className="caption font-semibold text-[var(--color-ink)]">{formatCurrency(merchant.totalAmount)}</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-[var(--color-canvas-soft)] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            background: COLORS[i % COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-48 gap-2">
      <div className="w-10 h-10 rounded-full bg-[var(--color-canvas-soft)] flex items-center justify-center">
        <BarChart2 className="w-5 h-5 text-[var(--color-ink-faint)]" />
      </div>
      <p className="caption text-[var(--color-ink-faint)]">No data yet — add transactions to see insights</p>
    </div>
  );
}

