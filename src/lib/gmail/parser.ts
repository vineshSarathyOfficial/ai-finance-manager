export interface ParsedEmailTransaction {
  amount: number;
  type: "INCOME" | "EXPENSE";
  description: string;
  transactionDate: Date;
  paymentMethod: string | null;
  rawMerchant: string;
}

/**
 * Strips HTML tags and collapses extra whitespace
 */
export function cleanEmailBody(htmlOrText: string): string {
  return htmlOrText
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Parses bank alerts and transaction notifications from email subject and body
 */
export function parseTransactionFromEmail(
  subject: string,
  body: string,
  emailDate: Date
): ParsedEmailTransaction | null {
  const cleanBody = cleanEmailBody(body);
  const fullText = `${subject} ${cleanBody}`;

  // 1. Check if this email is a financial transaction notification
  const isFinancial =
    /\b(debited|credited|spent|paid|withdrawn|transferred|refunded|purchase|transaction alert|payment of|deposited)\b/i.test(
      fullText
    );

  if (!isFinancial) {
    return null;
  }

  // 2. Extract Amount
  // Matches: INR 1,234.50 | Rs. 500.00 | Rs 450 | ₹ 1,499.00 | USD 45.00 | $50.00
  const amountPatterns = [
    /(?:INR|Rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
    /(?:USD|\$)\s*([\d,]+(?:\.\d{1,2})?)/i,
    /(?:amount of|for)\s*(?:INR|Rs\.?|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
    /([\d,]+(?:\.\d{1,2})?)\s*(?:INR|Rs\.?|₹|has been debited|has been credited)/i,
  ];

  let amount: number | null = null;
  for (const regex of amountPatterns) {
    const match = fullText.match(regex);
    if (match && match[1]) {
      const parsed = parseFloat(match[1].replace(/,/g, ""));
      // Basic sanity check: amount > 0 and reasonable (< 1 crore)
      if (!isNaN(parsed) && parsed > 0 && parsed < 100_000_000) {
        amount = parsed;
        break;
      }
    }
  }

  if (!amount) {
    return null;
  }

  // 3. Determine Type (Credit / Income vs Debit / Expense)
  const isCredit =
    /\b(credited to|deposited in|received from|refunded|salary credited|cashback of|received a payment of)\b/i.test(
      fullText
    ) &&
    !/\b(debited from|paid to|spent on)\b/i.test(fullText);

  const type: "INCOME" | "EXPENSE" = isCredit ? "INCOME" : "EXPENSE";

  // 4. Extract Payment Method
  let paymentMethod: string | null = null;
  if (/\bUPI\b/i.test(fullText)) {
    paymentMethod = "UPI";
  } else if (/\bCredit Card\b/i.test(fullText)) {
    paymentMethod = "Credit Card";
  } else if (/\bDebit Card\b/i.test(fullText)) {
    paymentMethod = "Debit Card";
  } else if (/\bNetBanking|IMPS|NEFT|RTGS\b/i.test(fullText)) {
    paymentMethod = "Net Banking";
  } else if (/\bATM\b/i.test(fullText)) {
    paymentMethod = "ATM";
  } else if (/\bWallet|Paytm|PhonePe|GPay\b/i.test(fullText)) {
    paymentMethod = "UPI / Wallet";
  }

  // 5. Extract Merchant / Narration
  let rawMerchant = "";

  const merchantPatterns = [
    /(?:towards|at|to|info:?|vpa:?|merchant:?)\s+([A-Za-z0-9\s*.\-_/@]{3,45})/i,
    /(?:paid to|transferred to|spent at)\s+([A-Za-z0-9\s*.\-_/@]{3,45})/i,
    /(?:received from|sent by)\s+([A-Za-z0-9\s*.\-_/@]{3,45})/i,
  ];

  for (const regex of merchantPatterns) {
    const match = cleanBody.match(regex);
    if (match && match[1]) {
      const candidate = match[1].trim();
      // Avoid matching generic text like "your account" or "our bank"
      if (!/^(your account|a\/c|card|the merchant|bank|inr|rs)/i.test(candidate)) {
        rawMerchant = candidate;
        break;
      }
    }
  }

  // Fallback to cleaned subject if no merchant identified
  if (!rawMerchant) {
    rawMerchant = subject
      .replace(/^(alert|notification|update|transaction alert|bank update):?\s*/i, "")
      .trim()
      .slice(0, 50);
  }

  // Clean description of noise (UPI ref IDs, card numbers, random digits)
  const description = rawMerchant
    .replace(/\b(?:A\/c|Acct|Card)\s*(?:no\.?)?\s*(?:ending\s*)?[xX\d]+\b/gi, "")
    .replace(/\b(?:Ref|UPI|Txn|ID|Ref no\.?)\s*[:#]?\s*\d+\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80) || "Bank Transaction";

  // 6. Extract Date
  let transactionDate = emailDate;
  const datePatterns = [
    /\b(\d{1,2}[-/](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[-/]\d{2,4})\b/i,
    /\b(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\b/,
    /\b(\d{4}[-/]\d{1,2}[-/]\d{1,2})\b/,
  ];

  for (const regex of datePatterns) {
    const match = cleanBody.match(regex);
    if (match && match[1]) {
      const parsedDate = new Date(match[1]);
      if (!isNaN(parsedDate.getTime())) {
        // Ensure date is reasonable (not in far future or before 2000)
        const now = new Date();
        if (parsedDate <= now && parsedDate.getFullYear() > 2010) {
          transactionDate = parsedDate;
          break;
        }
      }
    }
  }

  return {
    amount,
    type,
    description,
    transactionDate,
    paymentMethod,
    rawMerchant,
  };
}
