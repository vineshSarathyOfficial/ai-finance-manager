export { classifyTransaction, buildDedupKey } from "./classification";
export { getSpendingMetrics, getMonthlyTrend, getMonthOverMonthChange } from "./metrics";
export type { MetricsOptions } from "./metrics";
export {
  getCategorySpend,
  getTopMerchants,
  getCategoryMonthOverMonth,
  getAccountSpending,
  getCreditCardSummary,
  getDailySpendHeatmap,
  getNetWorthTrend,
} from "./aggregations";
export { generateInsights, getTopInsight } from "./insights";
export type { Insight } from "./insights";
export { findCrossSourceDuplicates } from "./deduplication";
export type { DedupMatch } from "./deduplication";
