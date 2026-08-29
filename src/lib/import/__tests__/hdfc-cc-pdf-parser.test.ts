import { parseBankStatementPdfText } from "../pdf-parser";
import { isHdfcCreditCardPdf, parseHdfcCreditCardPdfText } from "../hdfc-cc-pdf-parser";

const HDFC_NEW_FORMAT = `
HDFC Bank Credit Card Statement
Card No. 6529 25XX XXXX 1234
Statement Date 22 Jan, 2026

Domestic Transactions
DATE & TIME TRANSACTION DESCRIPTION AMOUNT PI

PRANJAL KUMAR
22/12/2025| 00:00 IGST-VPS2635768175329-RATE 18.0 -10 (Ref# 09999999981222007881808) C 12.96 l
24/12/2025| 22:47 UPI-LENSKART SOLUTIONSLIMITE C 800.00 l
07/01/2026| 09:32 BPPY CC PAYMENT DP016007093211kfeEP (Ref# ST260080083000010269459) + C 1,867.00 l
18/01/2026| 00:00 REDEMPTION PROC FEE (Ref# ST260190084000011669025) C 99.00 l
22/01/2026| 00:00 OFFUS EMI,PRIN NB:08,00000125735628 (Ref# 09999999980122008283940) C 1,802.00 l

TRANSACTIONS TOTAL AMOUNT
`;

const HDFC_OLD_FORMAT = `
HDFC Bank Credit Card Statement
Domestic Transactions
Date Transaction Description Amount (in Rs.) NeuCoins

DIBYENDU DAS
01/05/2025 FLIPKART INTERNET P Banglore 3 304.00
02/05/2025 WWW SWIGGY COM GURGAON -3 267.00 Cr
02/05/2025 WWW SWIGGY COM GURGAON 3 267.00
03/05/2025 ZOMATO NEW DELHI 4 424.40
20/05/2025 TELE TRANSFER CREDIT (Ref# ST251410083000010132938) 1,567.00 Cr
`;

const HDFC_CONCATENATED = `
HDFC Bank Credit Card Domestic Transactions DATE & TIME TRANSACTION DESCRIPTION AMOUNT PI
RAVI PRAKASH PAL 08/03/2026| 00:00 PTM*Flipkart TSPBanglore (Ref# VT260790075031390000098) + C 875.00 l
12/03/2026| 08:00 EMI RAZ*DREAMPLUG PAYTECHSOLMumbai C 10,300.00 l
31/03/2026| 07:47 CC PAYMENT 094923436473 PayZapp (Ref# 00000000000331019055291) + C 1,997.00 l
TRANSACTIONS TOTAL AMOUNT
`;

function runTests() {
  console.log("🧪 Running HDFC Credit Card PDF Parser Tests...");

  if (!isHdfcCreditCardPdf(HDFC_NEW_FORMAT)) {
    throw new Error("Should detect HDFC credit card PDF");
  }

  const newTxns = parseHdfcCreditCardPdfText(HDFC_NEW_FORMAT);
  console.log(`- New format: ${newTxns.length} transactions`);
  if (newTxns.length !== 5) {
    throw new Error(`Expected 5 new-format transactions, got ${newTxns.length}`);
  }

  const lenskart = newTxns.find((t) => t.description.includes("LENSKART"));
  if (!lenskart || lenskart.type !== "EXPENSE" || lenskart.amount !== 800) {
    throw new Error("Lenskart purchase should be EXPENSE 800");
  }

  const payment = newTxns.find((t) => t.description.includes("CC PAYMENT"));
  if (!payment || payment.type !== "INCOME" || payment.amount !== 1867) {
    throw new Error("CC payment should be INCOME 1867");
  }

  const oldTxns = parseHdfcCreditCardPdfText(HDFC_OLD_FORMAT);
  console.log(`- Old format: ${oldTxns.length} transactions`);
  if (oldTxns.length < 5) {
    throw new Error(`Expected at least 5 old-format transactions, got ${oldTxns.length}`);
  }

  const swiggyRefund = oldTxns.find((t) => t.description.includes("SWIGGY") && t.type === "INCOME");
  if (!swiggyRefund) {
    throw new Error("Swiggy Cr refund should be INCOME");
  }

  const flatTxns = parseHdfcCreditCardPdfText(HDFC_CONCATENATED);
  console.log(`- Concatenated format: ${flatTxns.length} transactions`);
  if (flatTxns.length !== 3) {
    throw new Error(`Expected 3 concatenated transactions, got ${flatTxns.length}`);
  }

  const pdfResult = parseBankStatementPdfText(HDFC_NEW_FORMAT);
  if (!pdfResult.success || pdfResult.detectedFormat !== "HDFC Credit Card PDF") {
    throw new Error(`Integration failed: ${pdfResult.error}`);
  }

  console.log("🎉 All HDFC Credit Card PDF Parser Tests Passed!");
}

runTests();
