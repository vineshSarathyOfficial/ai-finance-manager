/** Utilization thresholds — documented in CreditUtilizationBar */
export function getUtilizationLevel(pct: number | null): "low" | "moderate" | "high" | "none" {
  if (pct == null) return "none";
  if (pct >= 70) return "high";
  if (pct >= 30) return "moderate";
  return "low";
}
