/**
 * Recurring Transaction Detection Engine
 *
 * Scans a user's transaction history and identifies recurring patterns
 * by grouping similar descriptions and measuring interval regularity.
 */

import { prisma } from "@/lib/db/prisma";
import { getRequiredUserId } from "@/lib/auth/session";
import type { RecurringTransaction, Frequency } from "@/types/finance";

export type { RecurringTransaction, Frequency };

export interface DetectedPattern {
  matchKey: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  frequency: Frequency;
  nextDueDate: Date | null;
  lastSeenAt: Date;
  occurrences: number;
  confidence: number;
  categoryId: string | null;
  dates: Date[];
  amounts: number[];
}

// ---------------------------------------------------------------------------
// Normalisation helpers
// ---------------------------------------------------------------------------

/** Strip noise to produce a stable merchant key */
function normalizeDescription(raw: string): string {
  return raw
    .toUpperCase()
    // remove UPI reference IDs, phone numbers, random digits
    .replace(/\b\d{6,}\b/g, "")
    // remove common payment suffixes
    .replace(/\b(UPI|NEFT|IMPS|RTGS|POS|ECOM|ATM|CHQ|REF|TXN|DR|CR)\b/g, "")
    // remove special chars except spaces
    .replace(/[^A-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Compute cosine-like similarity on word bags (0–1) */
function descriptionSimilarity(a: string, b: string): number {
  const setA = new Set(a.split(" ").filter(Boolean));
  const setB = new Set(b.split(" ").filter(Boolean));
  const intersection = [...setA].filter((w) => setB.has(w)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

/** Group similar normalised descriptions together */
function groupByMerchant(
  rows: Array<{ norm: string; original: string; date: Date; amount: number; type: "INCOME" | "EXPENSE"; categoryId: string | null }>
): Map<string, typeof rows> {
  const groups = new Map<string, typeof rows>();

  for (const row of rows) {
    let matched = false;
    for (const [key, members] of groups.entries()) {
      if (descriptionSimilarity(row.norm, key) >= 0.6) {
        members.push(row);
        matched = true;
        break;
      }
    }
    if (!matched) {
      groups.set(row.norm, [row]);
    }
  }
  return groups;
}

// ---------------------------------------------------------------------------
// Interval detection
// ---------------------------------------------------------------------------

const FREQ_WINDOWS: Array<{ freq: Frequency; minDays: number; maxDays: number }> = [
  { freq: "WEEKLY",    minDays: 5,   maxDays: 9   },
  { freq: "BIWEEKLY",  minDays: 11,  maxDays: 18  },
  { freq: "MONTHLY",   minDays: 27,  maxDays: 34  },
  { freq: "QUARTERLY", minDays: 85,  maxDays: 100 },
  { freq: "YEARLY",    minDays: 355, maxDays: 380 },
];

function detectFrequency(sortedDates: Date[]): { frequency: Frequency; confidence: number } | null {
  if (sortedDates.length < 2) return null;

  const gaps: number[] = [];
  for (let i = 1; i < sortedDates.length; i++) {
    gaps.push(
      Math.round(
        (sortedDates[i].getTime() - sortedDates[i - 1].getTime()) / 86_400_000
      )
    );
  }

  const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;

  for (const { freq, minDays, maxDays } of FREQ_WINDOWS) {
    if (avgGap >= minDays && avgGap <= maxDays) {
      // Consistency: fraction of gaps within ±30% of avg
      const consistent = gaps.filter(
        (g) => g >= avgGap * 0.7 && g <= avgGap * 1.3
      ).length;
      const confidence = Math.round((consistent / gaps.length) * 80 + 20);
      return { frequency: freq, confidence: Math.min(confidence, 100) };
    }
  }
  return null;
}

function nextOccurrence(lastDate: Date, frequency: Frequency): Date {
  const d = new Date(lastDate);
  switch (frequency) {
    case "WEEKLY":    d.setDate(d.getDate() + 7);   break;
    case "BIWEEKLY":  d.setDate(d.getDate() + 14);  break;
    case "MONTHLY":   d.setMonth(d.getMonth() + 1); break;
    case "QUARTERLY": d.setMonth(d.getMonth() + 3); break;
    case "YEARLY":    d.setFullYear(d.getFullYear() + 1); break;
  }
  return d;
}

// ---------------------------------------------------------------------------
// Amount confidence
// ---------------------------------------------------------------------------

function amountConsistency(amounts: number[]): number {
  if (amounts.length === 0) return 0;
  const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const within10 = amounts.filter((a) => Math.abs(a - avg) / avg < 0.1).length;
  return Math.round((within10 / amounts.length) * 100);
}

// ---------------------------------------------------------------------------
// Main detection function
// ---------------------------------------------------------------------------

export async function detectRecurringPatterns(userId: string): Promise<DetectedPattern[]> {
  // Fetch last 18 months of transactions
  const since = new Date();
  since.setMonth(since.getMonth() - 18);

  const txns = await prisma.transaction.findMany({
    where: { userId, transactionDate: { gte: since } },
    select: {
      description: true,
      amount: true,
      type: true,
      transactionDate: true,
      categoryId: true,
    },
    orderBy: { transactionDate: "asc" },
  });

  if (txns.length === 0) return [];

  // Normalise
  const rows = txns.map((t:any) => ({
    norm: normalizeDescription(t.description),
    original: t.description,
    date: t.transactionDate,
    amount: Number(t.amount),
    type: t.type as "INCOME" | "EXPENSE",
    categoryId: t.categoryId,
  }));

  const groups = groupByMerchant(rows);
  const patterns: DetectedPattern[] = [];

  for (const [key, members] of groups.entries()) {
    if (members.length < 2) continue; // need at least 2 occurrences

    const sorted = [...members].sort((a, b) => a.date.getTime() - b.date.getTime());
    const dates = sorted.map((m) => m.date);
    const amounts = sorted.map((m) => m.amount);
    const freqResult = detectFrequency(dates);
    if (!freqResult) continue;

    const amtConf = amountConsistency(amounts);
    const combinedConf = Math.round((freqResult.confidence * 0.6 + amtConf * 0.4));
    if (combinedConf < 40) continue; // too noisy

    const lastSeen = sorted[sorted.length - 1];
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;

    // Clean display name: pick the most common original description word(s)
    const wordFreq = new Map<string, number>();
    for (const m of members) {
      for (const w of m.original.toUpperCase().split(/\s+/)) {
        if (w.length > 2) wordFreq.set(w, (wordFreq.get(w) ?? 0) + 1);
      }
    }
    const topWords = [...wordFreq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([w]) => w);
    const name = topWords.join(" ").slice(0, 60) || key.slice(0, 60);

    // Most common category
    const catFreq = new Map<string | null, number>();
    for (const m of members) catFreq.set(m.categoryId, (catFreq.get(m.categoryId) ?? 0) + 1);
    const categoryId = [...catFreq.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    patterns.push({
      matchKey: key.slice(0, 120),
      name: name.slice(0, 120),
      type: lastSeen.type,
      amount: Math.round(avgAmount * 100) / 100,
      frequency: freqResult.frequency,
      nextDueDate: nextOccurrence(lastSeen.date, freqResult.frequency),
      lastSeenAt: lastSeen.date,
      occurrences: members.length,
      confidence: combinedConf,
      categoryId,
      dates,
      amounts,
    });
  }

  // Sort by confidence desc
  return patterns.sort((a, b) => b.confidence - a.confidence);
}
