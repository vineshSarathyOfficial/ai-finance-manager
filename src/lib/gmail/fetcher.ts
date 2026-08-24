import type { gmail_v1 } from "googleapis";
import { parseTransactionFromEmail, type ParsedEmailTransaction } from "./parser";

export interface FetchedEmailTransaction extends ParsedEmailTransaction {
  emailMessageId: string;
}

const BANK_SENDER_DOMAINS = [
  "alerts@hdfcbank.net",
  "hdfcbank.com",
  "alerts@icicibank.com",
  "icicibank.com",
  "alerts@sbi.co.in",
  "sbi.co.in",
  "alerts@axisbank.com",
  "axisbank.com",
  "kotak.com",
  "indusind.com",
  "yesbank.in",
  "paytm.com",
  "phonepe.com",
  "cred.club",
  "googlepay.com",
  "razorpay.com",
  "zerodha.com",
  "groww.in",
];

/**
 * Builds an optimal search query for Gmail API to fetch all financial alert emails for current month
 */
export function buildGmailSearchQuery(fromDate?: Date): string {
  // Financial keywords
  const keywords = '("debited" OR "credited" OR "spent" OR "transaction alert" OR "INR" OR "Rs." OR "paid to" OR "received from")';

  // Bank senders query
  const senders = `from:(${BANK_SENDER_DOMAINS.join(" OR ")})`;

  // Exclude non-transactional emails (OTPs, password resets, logins)
  const exclusions = '-subject:OTP -subject:"verification code" -subject:"One Time Password" -subject:"Welcome to" -subject:"Login Alert"';

  // Time filter: 1st day of current month (e.g. 2026/08/01)
  const now = new Date();
  const targetDate = fromDate || new Date(now.getFullYear(), now.getMonth(), 1);
  const formattedDate = `${targetDate.getFullYear()}/${String(targetDate.getMonth() + 1).padStart(2, "0")}/${String(targetDate.getDate()).padStart(2, "0")}`;

  return `(${senders} OR ${keywords}) ${exclusions} after:${formattedDate}`;
}

/**
 * Decodes Gmail message body parts (handles multipart, base64url encoding)
 */
function extractBodyFromPayload(payload: gmail_v1.Schema$MessagePart | undefined): string {
  if (!payload) return "";

  // Direct body data
  if (payload.body?.data) {
    return Buffer.from(payload.body.data, "base64url").toString("utf-8");
  }

  // Nested parts (e.g. multipart/alternative)
  if (payload.parts && payload.parts.length > 0) {
    let body = "";
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return Buffer.from(part.body.data, "base64url").toString("utf-8");
      }
      if (part.mimeType === "text/html" && part.body?.data) {
        body = Buffer.from(part.body.data, "base64url").toString("utf-8");
      }
      if (part.parts) {
        const nested = extractBodyFromPayload(part);
        if (nested) return nested;
      }
    }
    return body;
  }

  return "";
}

/**
 * Fetches and parses financial transactions from Gmail with pagination support
 */
export async function fetchTransactionsFromGmail(
  gmail: gmail_v1.Gmail,
  fromDate?: Date,
  maxResults = 250
): Promise<FetchedEmailTransaction[]> {
  const query = buildGmailSearchQuery(fromDate);

  const allMessages: gmail_v1.Schema$Message[] = [];
  let pageToken: string | undefined = undefined;

  while (allMessages.length < maxResults) {
    const remaining = maxResults - allMessages.length;
    const listParams: gmail_v1.Params$Resource$Users$Messages$List = {
      userId: "me",
      q: query,
      maxResults: Math.min(remaining, 100),
      pageToken,
    };

    const response = await gmail.users.messages.list(listParams);
    const messages = response.data.messages;
    if (messages && messages.length > 0) {
      allMessages.push(...messages);
    }

    if (!response.data.nextPageToken) {
      break;
    }
    pageToken = response.data.nextPageToken;
  }

  if (allMessages.length === 0) {
    return [];
  }

  const results: FetchedEmailTransaction[] = [];

  // Process message contents in parallel batches of 15
  const chunkSize = 15;
  for (let i = 0; i < allMessages.length; i += chunkSize) {
    const chunk = allMessages.slice(i, i + chunkSize);

    const chunkPromises = chunk.map(async (msg) => {
      if (!msg.id) return null;

      try {
        const messageRes = await gmail.users.messages.get({
          userId: "me",
          id: msg.id,
          format: "full",
        });

        const headers = messageRes.data.payload?.headers || [];
        const subjectHeader = headers.find((h) => h.name?.toLowerCase() === "subject");
        const dateHeader = headers.find((h) => h.name?.toLowerCase() === "date");

        const subject = subjectHeader?.value || "";
        const emailDate = dateHeader?.value ? new Date(dateHeader.value) : new Date();
        const body = extractBodyFromPayload(messageRes.data.payload);

        const parsed = parseTransactionFromEmail(subject, body, emailDate);
        if (parsed) {
          return {
            ...parsed,
            emailMessageId: msg.id,
          };
        }
        return null;
      } catch (err) {
        console.error(`[GmailFetcher] Error processing message ${msg.id}:`, err);
        return null;
      }
    });

    const chunkResults = await Promise.all(chunkPromises);
    for (const item of chunkResults) {
      if (item) results.push(item);
    }
  }

  return results;
}
