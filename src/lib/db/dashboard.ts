import "server-only";

export {
  getSpendingMetrics as getDashboardSummary,
  getMonthlyTrend,
  getMonthOverMonthChange,
} from "@/lib/finance/metrics";

export {
  getCategorySpend,
  getTopMerchants,
  getCategoryMonthOverMonth,
  getDailySpendHeatmap,
  getNetWorthTrend,
  getCreditCardSummary,
  getAccountSpending,
} from "@/lib/finance/aggregations";

export { getTopInsight as getInsight, generateInsights } from "@/lib/finance/insights";
