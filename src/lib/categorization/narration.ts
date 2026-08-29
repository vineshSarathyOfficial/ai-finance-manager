/**
 * Normalizes raw bank statement narrations into cleaner text for categorization.
 * Handles UPI/IMPS/NEFT/RTGS/POS prefixes, reference IDs, and location suffixes.
 */
export function normalizeBankNarration(raw: string): string {
  let text = raw.trim();

  // Extract merchant from common UPI narration formats:
  // UPI-123456789012-SWIGGY@paytm / UPI/DR/42158912/SWIGGY BANGALORE
  const upiMerchant =
    /(?:UPI[/-](?:DR|CR)?[/-]?\d+[/-])([A-Za-z][A-Za-z0-9*._\s@-]{2,50})/i.exec(text) ??
    /(?:UPI[/-]\d+[/-])([A-Za-z][A-Za-z0-9*._\s@-]{2,50})/i.exec(text);
  if (upiMerchant?.[1]) {
    text = upiMerchant[1];
  }

  // RAZORPAY*MERCHANT / PAYU*MERCHANT patterns
  const gatewayMerchant = /(?:RAZORPAY|PAYU|CASHFREE|PHONEPE|GPAY|PAYTM)[*\/\s]+([A-Za-z][A-Za-z0-9\s]{2,40})/i.exec(text);
  if (gatewayMerchant?.[1]) {
    text = gatewayMerchant[1];
  }

  return text
    .replace(/\b\d{6,}\b/g, " ")
    .replace(/\b(?:UPI|NEFT|IMPS|RTGS|POS|ECOM|ATM|CHQ|REF|TXN|DR|CR|INB|IFT|ACH|ECS|NACH)\b/gi, " ")
    .replace(/@[a-z0-9.]+/gi, " ")
    .replace(/\b(?:BANGALORE|BENGALURU|MUMBAI|DELHI|NEW DELHI|HYDERABAD|CHENNAI|KOLKATA|PUNE|GURGAON|GURUGRAM|NOIDA|INDIA|IN)\b/gi, " ")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Stable merchant key used for history matching */
export function extractMerchantKey(raw: string): string {
  const normalized = normalizeBankNarration(raw);
  const words = normalized.split(" ").filter((w) => w.length > 1);
  return words.slice(0, 4).join(" ");
}
