import { parseBankStatementCsv } from "../csv-parser";
import { parseBankStatementPdfText } from "../pdf-parser";
import { categorizeTransaction } from "../../categorization/engine";
import { buildCategoryHistory } from "../../categorization/history";
import type { Category } from "@/types/finance";

const mockCategories: Category[] = [
  { id: "cat-1", userId: "u1", name: "Food", type: "EXPENSE", icon: "🍕", createdAt: new Date() },
  { id: "cat-2", userId: "u1", name: "Groceries", type: "EXPENSE", icon: "🛒", createdAt: new Date() },
  { id: "cat-3", userId: "u1", name: "Transport", type: "EXPENSE", icon: "🚌", createdAt: new Date() },
  { id: "cat-4", userId: "u1", name: "Shopping", type: "EXPENSE", icon: "🛍️", createdAt: new Date() },
  { id: "cat-5", userId: "u1", name: "Entertainment", type: "EXPENSE", icon: "🎬", createdAt: new Date() },
  { id: "cat-6", userId: "u1", name: "Salary", type: "INCOME", icon: "💼", createdAt: new Date() },
  { id: "cat-7", userId: "u1", name: "Bills", type: "EXPENSE", icon: "📄", createdAt: new Date() },
  { id: "cat-8", userId: "u1", name: "Other", type: "EXPENSE", icon: "📦", createdAt: new Date() },
];

const sampleHdfcCsv = `
Date,Narration,Chq/Ref No,Value Dt,Withdrawal Amt.,Deposit Amt.,Closing Balance
01/08/2024,SWIGGY BANGALORE IN,UPI-42158912,01/08/2024,420.00,,45200.00
02/08/2024,AMAZON PAY INDIA RETAIL,POS-98124,02/08/2024,1899.00,,43301.00
03/08/2024,UBER INDIA BANGALORE,UPI-99120144,03/08/2024,340.00,,42961.00
05/08/2024,SALARY CREDITED ACME CORP,NEFT-0012941,05/08/2024,,95000.00,137961.00
06/08/2024,BLINKIT QUICK COMMERCE,UPI-77120491,06/08/2024,650.00,,137311.00
08/08/2024,NETFLIX ENTERTAINMENT,ECOM-44102,08/08/2024,649.00,,136662.00
10/08/2024,UPI/DR/88291023/ZOMATO MEDIA PVT LTD,UPI-88291023,10/08/2024,280.00,,136382.00
11/08/2024,UPI-RAHUL SHARMA,UPI-99112233,11/08/2024,500.00,,135882.00
12/08/2024,AIRTEL PREPAID RECHARGE,UPI-44102911,12/08/2024,299.00,,135583.00
`;

function runTests() {
  console.log("🧪 Running Statement Parser & Categorization Engine Tests...");

  const parseResult = parseBankStatementCsv(sampleHdfcCsv);
  if (!parseResult.success) {
    throw new Error(`Parse failed: ${parseResult.error}`);
  }

  console.log(`✅ Parsed ${parseResult.transactions.length} transactions successfully.`);
  if (parseResult.transactions.length !== 9) {
    throw new Error(`Expected 9 transactions, got ${parseResult.transactions.length}`);
  }

  const assertCategory = (desc: string, type: "INCOME" | "EXPENSE", expected: string) => {
    const cat = categorizeTransaction(desc, type, mockCategories);
    console.log(`- ${desc} -> ${cat.categoryName} (${Math.round(cat.confidence * 100)}% ${cat.matchType})`);
    if (cat.categoryName !== expected) {
      throw new Error(`"${desc}" should be ${expected}, got ${cat.categoryName}`);
    }
  };

  assertCategory("SWIGGY BANGALORE IN", "EXPENSE", "Food");
  assertCategory("AMAZON PAY INDIA RETAIL", "EXPENSE", "Shopping");
  assertCategory("UBER INDIA BANGALORE", "EXPENSE", "Transport");
  assertCategory("SALARY CREDITED ACME CORP", "INCOME", "Salary");
  assertCategory("BLINKIT QUICK COMMERCE", "EXPENSE", "Groceries");
  assertCategory("NETFLIX ENTERTAINMENT", "EXPENSE", "Entertainment");
  assertCategory("UPI/DR/88291023/ZOMATO MEDIA PVT LTD", "EXPENSE", "Food");
  assertCategory("AIRTEL PREPAID RECHARGE", "EXPENSE", "Bills");

  // P2P UPI should not be misclassified as Food
  const p2p = categorizeTransaction("UPI-RAHUL SHARMA", "EXPENSE", mockCategories);
  console.log(`- UPI-RAHUL SHARMA -> ${p2p.categoryName} (${p2p.matchType})`);
  if (p2p.categoryName !== "Other") {
    throw new Error(`P2P UPI transfer should be Other, got ${p2p.categoryName}`);
  }

  // History learning: if user previously categorized Swiggy as Food, new Swiggy txn should match
  const history = buildCategoryHistory([
    {
      description: "UPI-SWIGGY BANGALORE",
      type: "EXPENSE",
      categoryId: "cat-1",
      category: { name: "Food" },
    },
  ]);
  const historyMatch = categorizeTransaction("SWIGGY INSTAMART BANGALORE", "EXPENSE", mockCategories, { history });
  console.log(`- History match: SWIGGY INSTAMART -> ${historyMatch.categoryName} (${historyMatch.matchType})`);
  if (historyMatch.matchType !== "HISTORY" && historyMatch.categoryName !== "Food") {
    throw new Error("Should learn from past Swiggy categorization");
  }

  console.log("🎉 All Statement Parser & Categorization Engine Tests Passed!");
}

function runCreditCardTests() {
  console.log("\n🧪 Running Credit Card Statement Parser Tests...");

  const hdfcCcCsv = `
Credit Card Statement
Transaction Date,Transaction Description,Transaction Amount,Debit/Credit Indicator
01/08/2024,SWIGGY BANGALORE,420.00,D
02/08/2024,AMAZON PAY INDIA,1899.00,D
03/08/2024,PAYMENT RECEIVED - THANK YOU,5000.00,C
04/08/2024,NETFLIX.COM,649.00,D
`;

  const hdfcResult = parseBankStatementCsv(hdfcCcCsv);
  if (!hdfcResult.success || hdfcResult.transactions.length !== 4) {
    throw new Error(`HDFC CC parse failed: ${hdfcResult.error ?? hdfcResult.transactions.length}`);
  }
  if (hdfcResult.detectedFormat !== "Auto-detected Credit Card CSV") {
    throw new Error(`Expected credit card format, got ${hdfcResult.detectedFormat}`);
  }

  const [swiggy, , payment, netflix] = hdfcResult.transactions;
  if (swiggy.type !== "EXPENSE" || swiggy.paymentMethod !== "Credit Card") {
    throw new Error("CC purchase should be EXPENSE with Credit Card payment method");
  }
  if (payment.type !== "INCOME" || !payment.description.includes("PAYMENT RECEIVED")) {
    throw new Error("CC payment should be INCOME");
  }
  if (netflix.type !== "EXPENSE") {
    throw new Error("Netflix CC charge should be EXPENSE");
  }

  const axisCcCsv = `
Merchant Name,Category,Transaction Date,Amount (INR)
SWIGGY,Food & Dining,01/08/2024,420.00
UBER TRIP,Transport,02/08/2024,340.00
`;

  const axisResult = parseBankStatementCsv(axisCcCsv);
  if (!axisResult.success || axisResult.transactions.length !== 2) {
    throw new Error(`Axis CC parse failed: ${axisResult.error ?? axisResult.transactions.length}`);
  }
  if (axisResult.transactions[0].description !== "SWIGGY") {
    throw new Error("Axis CC should use merchant name as description");
  }

  const iciciCcCsv = `
S.No.,Transaction Date,Transaction Details,Reward Points,Intl. Amount,Amount (in Rs)
1,01/08/2024,BLINKIT GROCERY,0,,650.00
2,02/08/2024,REFUND AMAZON,0,,299.00
`;

  const iciciResult = parseBankStatementCsv(iciciCcCsv);
  if (!iciciResult.success || iciciResult.transactions.length !== 2) {
    throw new Error(`ICICI CC parse failed: ${iciciResult.error ?? iciciResult.transactions.length}`);
  }
  if (iciciResult.transactions[0].type !== "EXPENSE") {
    throw new Error("ICICI CC purchase should be EXPENSE");
  }
  if (iciciResult.transactions[1].type !== "INCOME") {
    throw new Error("ICICI CC refund should be INCOME");
  }

  const pdfCcText = `
HDFC Bank Credit Card Statement
Card No. XXXX 1234
01/08/2024 SWIGGY BANGALORE 420.00
02/08/2024 PAYMENT RECEIVED 5000.00 CR
03/08/2024 NETFLIX ENTERTAINMENT 649.00
Minimum Amount Due: 500.00
`;

  const pdfResult = parseBankStatementPdfText(pdfCcText);
  if (!pdfResult.success || pdfResult.transactions.length < 3) {
    throw new Error(`CC PDF parse failed: ${pdfResult.transactions.length} transactions`);
  }
  if (pdfResult.detectedFormat !== "PDF Credit Card Statement") {
    throw new Error(`Expected PDF credit card format, got ${pdfResult.detectedFormat}`);
  }

  console.log("🎉 All Credit Card Statement Parser Tests Passed!");
}

runTests();
runCreditCardTests();
