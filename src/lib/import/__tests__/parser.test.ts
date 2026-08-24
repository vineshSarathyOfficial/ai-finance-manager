import { parseBankStatementCsv } from "../csv-parser";
import { categorizeTransaction } from "../../categorization/engine";
import type { Category } from "@/types/finance";

const mockCategories: Category[] = [
  { id: "cat-1", userId: "u1", name: "Food", type: "EXPENSE", icon: "🍕", createdAt: new Date() },
  { id: "cat-2", userId: "u1", name: "Groceries", type: "EXPENSE", icon: "🛒", createdAt: new Date() },
  { id: "cat-3", userId: "u1", name: "Transport", type: "EXPENSE", icon: "🚌", createdAt: new Date() },
  { id: "cat-4", userId: "u1", name: "Shopping", type: "EXPENSE", icon: "🛍️", createdAt: new Date() },
  { id: "cat-5", userId: "u1", name: "Entertainment", type: "EXPENSE", icon: "🎬", createdAt: new Date() },
  { id: "cat-6", userId: "u1", name: "Salary", type: "INCOME", icon: "💼", createdAt: new Date() },
  { id: "cat-7", userId: "u1", name: "Other", type: "EXPENSE", icon: "📦", createdAt: new Date() },
];

const sampleHdfcCsv = `
Date,Narration,Chq/Ref No,Value Dt,Withdrawal Amt.,Deposit Amt.,Closing Balance
01/08/2024,SWIGGY BANGALORE IN,UPI-42158912,01/08/2024,420.00,,45200.00
02/08/2024,AMAZON PAY INDIA RETAIL,POS-98124,02/08/2024,1899.00,,43301.00
03/08/2024,UBER INDIA BANGALORE,UPI-99120144,03/08/2024,340.00,,42961.00
05/08/2024,SALARY CREDITED ACME CORP,NEFT-0012941,05/08/2024,,95000.00,137961.00
06/08/2024,BLINKIT QUICK COMMERCE,UPI-77120491,06/08/2024,650.00,,137311.00
08/08/2024,NETFLIX ENTERTAINMENT,ECOM-44102,08/08/2024,649.00,,136662.00
`;

function runTests() {
  console.log("🧪 Running Statement Parser & Categorization Engine Tests...");

  const parseResult = parseBankStatementCsv(sampleHdfcCsv);
  if (!parseResult.success) {
    throw new Error(`Parse failed: ${parseResult.error}`);
  }

  console.log(`✅ Parsed ${parseResult.transactions.length} transactions successfully.`);
  if (parseResult.transactions.length !== 6) {
    throw new Error(`Expected 6 transactions, got ${parseResult.transactions.length}`);
  }

  // Verify extraction & categorization
  const swiggy = parseResult.transactions[0];
  const swiggyCat = categorizeTransaction(swiggy.description, swiggy.type, mockCategories);
  console.log(`- ${swiggy.description} (${swiggy.amount}) -> ${swiggyCat.categoryName} (${Math.round(swiggyCat.confidence * 100)}% ${swiggyCat.matchType})`);
  if (swiggyCat.categoryName !== "Food") throw new Error("Swiggy should be categorized as Food");

  const amazon = parseResult.transactions[1];
  const amazonCat = categorizeTransaction(amazon.description, amazon.type, mockCategories);
  console.log(`- ${amazon.description} (${amazon.amount}) -> ${amazonCat.categoryName} (${Math.round(amazonCat.confidence * 100)}% ${amazonCat.matchType})`);
  if (amazonCat.categoryName !== "Shopping") throw new Error("Amazon should be categorized as Shopping");

  const uber = parseResult.transactions[2];
  const uberCat = categorizeTransaction(uber.description, uber.type, mockCategories);
  console.log(`- ${uber.description} (${uber.amount}) -> ${uberCat.categoryName} (${Math.round(uberCat.confidence * 100)}% ${uberCat.matchType})`);
  if (uberCat.categoryName !== "Transport") throw new Error("Uber should be categorized as Transport");

  const salary = parseResult.transactions[3];
  const salaryCat = categorizeTransaction(salary.description, salary.type, mockCategories);
  console.log(`- ${salary.description} (${salary.amount}) -> ${salaryCat.categoryName} (${Math.round(salaryCat.confidence * 100)}% ${salaryCat.matchType})`);
  if (salaryCat.categoryName !== "Salary") throw new Error("Salary should be categorized as Salary");

  const blinkit = parseResult.transactions[4];
  const blinkitCat = categorizeTransaction(blinkit.description, blinkit.type, mockCategories);
  console.log(`- ${blinkit.description} (${blinkit.amount}) -> ${blinkitCat.categoryName} (${Math.round(blinkitCat.confidence * 100)}% ${blinkitCat.matchType})`);
  if (blinkitCat.categoryName !== "Groceries") throw new Error("Blinkit should be categorized as Groceries");

  const netflix = parseResult.transactions[5];
  const netflixCat = categorizeTransaction(netflix.description, netflix.type, mockCategories);
  console.log(`- ${netflix.description} (${netflix.amount}) -> ${netflixCat.categoryName} (${Math.round(netflixCat.confidence * 100)}% ${netflixCat.matchType})`);
  if (netflixCat.categoryName !== "Entertainment") throw new Error("Netflix should be categorized as Entertainment");

  console.log("🎉 All Statement Parser & Categorization Engine Tests Passed!");
}

runTests();
