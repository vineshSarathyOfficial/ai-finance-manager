"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from "recharts";
import { Tabs, TabPanel } from "@/components/ui/Tabs";
import { Card, CardTitle } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { formatCurrency } from "@/lib/utils";

const CHART_COLORS = [
  "#62aef0",
  "#d6b6f6",
  "#ff64c8",
  "#dd5b00",
  "#2a9d99",
  "#1aae39",
  "#523410",
  "#391c57",
];

interface AnalyticsChartsProps {
  trend: Array<{ month: string; income: number; expenses: number; netSavings?: number }>;
  categorySpend: Array<{ id?: string; name: string; amount: number; icon?: string | null }>;
  categoryMoM: Array<{ id: string; name: string; amount: number; prevAmount: number; pctChange: number; share: number }>;
  netWorthTrend: Array<{ month: string; cumulative: number }>;
  dailyHeatmap: Array<{ day: string; avgSpend: number }>;
  topMerchants: Array<{ name: string; totalAmount: number; txCount: number }>;
  accountSpending: Array<{ id: string; name: string; type: string; amount: number }>;
  summary: { incomeThisMonth: number; expensesThisMonth: number; savingsRate: number };
  initialTab?: string;
}

export function AnalyticsCharts({
  trend, categorySpend, categoryMoM, netWorthTrend, dailyHeatmap,
  topMerchants, accountSpending, summary, initialTab,
}: AnalyticsChartsProps) {
  const [activeTab, setActiveTab] = useState(initialTab || "overview");

  const now = new Date();
  const dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const dateTo = now.toISOString().slice(0, 10);

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "categories", label: "Categories" },
    { id: "merchants", label: "Merchants" },
    { id: "trends", label: "Trends" },
    { id: "accounts", label: "Accounts" },
  ];

  return (
    <div>
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <TabPanel active={activeTab === "overview"} id="overview">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          <StatCard label="Income" value={summary.incomeThisMonth} format="currency" variant="income" />
          <StatCard label="Expenses" value={summary.expensesThisMonth} format="currency" variant="expense" />
          <StatCard label="Savings Rate" value={summary.savingsRate} format="percent" variant="primary" />
        </div>

        {categoryMoM.length > 0 && (
          <Card padding="md" className="mb-6">
            <CardTitle>What changed this month</CardTitle>
            <div className="mt-4 space-y-2">
              {categoryMoM.slice(0, 6).map((cat) => (
                <Link
                  key={cat.id}
                  href={`/transactions?categoryId=${cat.id}&dateFrom=${dateFrom}&dateTo=${dateTo}`}
                  className="flex items-center justify-between py-2.5 border-b border-[var(--color-hairline-soft)] last:border-0 hover:bg-[var(--color-surface-soft)] -mx-2 px-2 rounded-[var(--radius-sm)]"
                >
                  <div>
                    <span className="body-sm text-[var(--color-ink)]">{cat.name}</span>
                    <span className="caption-sm text-[var(--color-ink-muted)] ml-2">{cat.share}% of spend</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="body-sm font-medium">{formatCurrency(cat.amount)}</span>
                    {cat.pctChange !== 0 && (
                      <span className={`caption-sm ${cat.pctChange > 0 ? "text-[var(--color-error)]" : "text-[var(--color-income)]"}`}>
                        {cat.pctChange > 0 ? "+" : ""}{cat.pctChange}%
                      </span>
                    )}
                    <ArrowRight className="w-4 h-4 text-[var(--color-ink-faint)]" />
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        )}
      </TabPanel>

      <TabPanel active={activeTab === "categories"} id="categories">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card padding="md">
            <CardTitle>Spending by Category</CardTitle>
            <div className="h-64 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categorySpend} dataKey="amount" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                    {categorySpend.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card padding="md">
            <CardTitle>Category Breakdown</CardTitle>
            <div className="mt-4 space-y-2">
              {categorySpend.map((cat) => (
                <Link
                  key={cat.name}
                  href={`/transactions?categoryId=${cat.id}&dateFrom=${dateFrom}&dateTo=${dateTo}`}
                  className="flex items-center justify-between py-2 border-b border-[var(--color-hairline-soft)] last:border-0"
                >
                  <span className="body-sm">{cat.icon} {cat.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="body-sm font-medium">{formatCurrency(cat.amount)}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[var(--color-ink-faint)]" />
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </TabPanel>

      <TabPanel active={activeTab === "merchants"} id="merchants">
        <Card padding="md">
          <CardTitle>Top Merchants</CardTitle>
          <div className="mt-4 space-y-2">
            {topMerchants.map((m) => (
              <Link
                key={m.name}
                href={`/transactions?search=${encodeURIComponent(m.name)}&dateFrom=${dateFrom}&dateTo=${dateTo}`}
                className="flex items-center justify-between py-3 border-b border-[var(--color-hairline-soft)] last:border-0"
              >
                <div>
                  <p className="body-sm text-[var(--color-ink)]">{m.name}</p>
                  <p className="caption-sm text-[var(--color-ink-muted)]">{m.txCount} transactions</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="title-md">{formatCurrency(m.totalAmount)}</span>
                  <ArrowRight className="w-4 h-4 text-[var(--color-ink-faint)]" />
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </TabPanel>

      <TabPanel active={activeTab === "trends"} id="trends">
        <div className="space-y-6">
          <Card padding="md">
            <CardTitle>Monthly Income vs Expenses</CardTitle>
            <div className="h-72 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-hairline)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                  <Bar dataKey="income" fill="var(--color-income)" name="Income" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="var(--color-ink)" name="Expenses" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card padding="md">
              <CardTitle>Net Savings Trend</CardTitle>
              <div className="h-56 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={netWorthTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-hairline)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                    <Line type="monotone" dataKey="cumulative" stroke="var(--color-primary)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card padding="md">
              <CardTitle>Spending by Day of Week</CardTitle>
              <div className="h-56 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyHeatmap}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-hairline)" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                    <Bar dataKey="avgSpend" fill="var(--color-primary)" name="Avg Spend" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>
      </TabPanel>

      <TabPanel active={activeTab === "accounts"} id="accounts">
        <Card padding="md">
          <CardTitle>Spending by Account</CardTitle>
          {accountSpending.length === 0 ? (
            <p className="body-sm text-[var(--color-ink-muted)] mt-4">No account spending data yet.</p>
          ) : (
            <div className="mt-4 space-y-2">
              {accountSpending.map((a) => (
                <Link
                  key={a.id}
                  href={`/transactions?accountId=${a.id}&dateFrom=${dateFrom}&dateTo=${dateTo}`}
                  className="flex items-center justify-between py-3 border-b border-[var(--color-hairline-soft)] last:border-0"
                >
                  <div>
                    <p className="body-sm text-[var(--color-ink)]">{a.name}</p>
                    <p className="caption-sm text-[var(--color-ink-muted)]">{a.type.replace("_", " ")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="title-md">{formatCurrency(a.amount)}</span>
                    <ArrowRight className="w-4 h-4 text-[var(--color-ink-faint)]" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </TabPanel>
    </div>
  );
}
