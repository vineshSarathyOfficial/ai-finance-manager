import type { ParsedRawTransaction } from "./csv-parser";
import { inferCreditCardTransactionType, isSkippableStatementRow } from "./statement-utils";

function containsHdfcMarker(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("hdfc") &&
    (lower.includes("credit card") ||
      lower.includes("domestic transactions") ||
      lower.includes("billedstatement") ||
      lower.includes("date & time") ||
      lower.includes("transaction description"))
  );
}

export function isHdfcCreditCardPdf(text: string): boolean {
  return containsHdfcMarker(text);
}

function normalizePdfText(text: string): string {
  return text
    .replace(/\[Link\]/gi, " ")
    .replace(/\u0000/g, " ")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n+/g, "\n")
    .trim();
}

function parseHdfcDate(dateStr: string): Date | null {
  const clean = dateStr.trim();
  const ddmmyyyy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(clean);
  if (!ddmmyyyy) return null;
  const [, day, month, year] = ddmmyyyy;
  const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return isNaN(d.getTime()) ? null : d;
}

function cleanAmount(amountStr: string): number {
  const num = parseFloat(amountStr.replace(/,/g, ""));
  return isNaN(num) ? 0 : num;
}

function cleanDescription(desc: string): string {
  return desc
    .replace(/\(Ref#\s*[^)]+\)/gi, "")
    .replace(/\s+/g, " ")
    .replace(/^[\s|:-]+/, "")
    .replace(/[\s|:-]+$/, "")
    .trim();
}

function isSegmentNoise(segment: string): boolean {
  const upper = segment.toUpperCase();
  if (isSkippableStatementRow(segment)) return true;
  if (/^DOMESTIC TRANSACTIONS/i.test(segment)) return true;
  if (/^INTERNATIONAL TRANSACTIONS/i.test(segment)) return true;
  if (/DATE\s*&\s*TIME/i.test(segment)) return true;
  if (/TRANSACTION\s+DESCRIPTION/i.test(segment)) return true;
  if (/^AMOUNT\s*\(IN\s*RS/i.test(segment)) return true;
  if (/^REWARDS?\b/i.test(segment.trim())) return true;
  if (/^TRANSACTIONS?\s+TOTAL/i.test(segment)) return true;
  if (/^OFFERS ON YOUR CARD/i.test(upper)) return true;
  if (/^GST\s+SUMMARY/i.test(upper)) return true;
  // Standalone cardholder name line (no date, no digits)
  if (/^[A-Z][A-Z\s.'-]{2,40}$/.test(segment.trim()) && !/\d/.test(segment)) return true;
  return false;
}

function isDescriptionNoise(description: string): boolean {
  return isSkippableStatementRow(description);
}

function parseNewFormatSegment(segment: string): ParsedRawTransaction | null {
  const trimmed = segment.replace(/\s+l\s*$/i, "").trim();

  const amountMatch = trimmed.match(/\s+(\+\s*)?C\s+([\d,]+\.\d{2})\s*$/i);
  if (!amountMatch || amountMatch.index === undefined) return null;

  const creditMarker = amountMatch[1];
  const amountStr = amountMatch[2];
  const beforeAmount = trimmed.slice(0, amountMatch.index);

  const headerMatch = /^(\d{2}\/\d{2}\/\d{4})\s*\|\s*\d{1,2}:\d{2}\s+(.+)$/i.exec(beforeAmount);
  if (!headerMatch) return null;

  const [, dateStr, rawDesc] = headerMatch;
  const parsedDate = parseHdfcDate(dateStr);
  if (!parsedDate) return null;

  const description = cleanDescription(rawDesc);
  if (!description || isDescriptionNoise(description)) return null;

  const amount = cleanAmount(amountStr);
  if (amount <= 0) return null;

  const isCredit = Boolean(creditMarker?.trim()) || inferCreditCardTransactionType(description) === "INCOME";

  return {
    date: parsedDate,
    rawDateStr: dateStr,
    description,
    amount,
    type: isCredit ? "INCOME" : "EXPENSE",
    paymentMethod: "Credit Card",
  };
}

function parseOldFormatSegment(segment: string): ParsedRawTransaction | null {
  const trimmed = segment.trim();

  const amountMatch = trimmed.match(/\s+(?:-?\d{1,4}\s+)?([\d,]+\.\d{2})(?:\s+Cr)?\s*$/i);
  if (!amountMatch || amountMatch.index === undefined) return null;

  const amountStr = amountMatch[1];
  const beforeAmount = trimmed.slice(0, amountMatch.index);

  const headerMatch = /^(\d{2}\/\d{2}\/\d{4})\s+(.+)$/i.exec(beforeAmount);
  if (!headerMatch) return null;

  const [, dateStr, rawDesc] = headerMatch;

  const parsedDate = parseHdfcDate(dateStr);
  if (!parsedDate) return null;

  const description = cleanDescription(rawDesc);
  if (!description || isDescriptionNoise(description)) return null;

  const amount = cleanAmount(amountStr);
  if (amount <= 0) return null;

  const isCredit =
    /cr$/i.test(trimmed) ||
    inferCreditCardTransactionType(description) === "INCOME";

  return {
    date: parsedDate,
    rawDateStr: dateStr,
    description,
    amount,
    type: isCredit ? "INCOME" : "EXPENSE",
    paymentMethod: "Credit Card",
  };
}

function splitByNewFormatAnchors(text: string): string[] {
  const flat = text.replace(/\n/g, " ");
  const anchorRegex = /\d{2}\/\d{2}\/\d{4}\s*\|\s*\d{1,2}:\d{2}/g;
  const indices: number[] = [];
  let match: RegExpExecArray | null;
  while ((match = anchorRegex.exec(flat)) !== null) {
    indices.push(match.index);
  }
  if (indices.length === 0) return [];

  const segments: string[] = [];
  for (let i = 0; i < indices.length; i++) {
    segments.push(flat.slice(indices[i], indices[i + 1]).trim());
  }
  return segments;
}

function splitByOldFormatAnchors(text: string): string[] {
  const flat = text.replace(/\n/g, " ");
  const anchorRegex = /\d{2}\/\d{2}\/\d{4}(?!\s*\|)/g;
  const indices: number[] = [];
  let match: RegExpExecArray | null;
  while ((match = anchorRegex.exec(flat)) !== null) {
    indices.push(match.index);
  }
  if (indices.length === 0) return [];

  const segments: string[] = [];
  for (let i = 0; i < indices.length; i++) {
    segments.push(flat.slice(indices[i], indices[i + 1]).trim());
  }
  return segments;
}

function extractDomesticSection(text: string): string {
  const lower = text.toLowerCase();
  const startIdx = lower.indexOf("domestic transactions");
  if (startIdx === -1) return text;

  let section = text.slice(startIdx);
  const intlIdx = section.toLowerCase().indexOf("international transactions");
  if (intlIdx > 0) {
    section = section.slice(0, intlIdx);
  }

  const endMarkers = [
    "transactions total",
    "gst summary",
    "offers on your card",
    "important information",
  ];
  for (const marker of endMarkers) {
    const idx = section.toLowerCase().indexOf(marker);
    if (idx > 100) {
      section = section.slice(0, idx);
      break;
    }
  }

  return section;
}

/**
 * Parses HDFC credit card statement PDF text (old and new Infinia/regalia formats).
 */
export function parseHdfcCreditCardPdfText(text: string): ParsedRawTransaction[] {
  const normalized = normalizePdfText(text);
  const section = extractDomesticSection(normalized);

  const transactions: ParsedRawTransaction[] = [];
  const seen = new Set<string>();

  const addParsed = (parsed: ParsedRawTransaction | null) => {
    if (!parsed) return;
    const key = `${parsed.rawDateStr}|${parsed.description}|${parsed.amount}|${parsed.type}`;
    if (seen.has(key)) return;
    seen.add(key);
    transactions.push(parsed);
  };

  // New HDFC format (DATE| TIME ... C AMOUNT)
  const hasNewFormat = /\d{2}\/\d{2}\/\d{4}\s*\|\s*\d{1,2}:\d{2}/.test(section);
  if (hasNewFormat) {
    for (const segment of splitByNewFormatAnchors(section)) {
      if (isSegmentNoise(segment)) continue;
      addParsed(parseNewFormatSegment(segment));
    }
  }

  // Older HDFC format (DATE DESCRIPTION [points] AMOUNT [Cr])
  if (transactions.length === 0) {
    for (const segment of splitByOldFormatAnchors(section)) {
      if (isSegmentNoise(segment)) continue;
      addParsed(parseOldFormatSegment(segment));
    }
  }

  return transactions;
}
