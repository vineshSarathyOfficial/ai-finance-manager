import PDFDocument from "pdfkit";
import { parseBankStatementPdfBuffer } from "../pdf-parser";

async function createMockPdfStatement(options?: { password?: string }): Promise<Buffer> {
  return new Promise((resolve) => {
    const doc = new PDFDocument({
      margin: 40,
      ...(options?.password
        ? { userPassword: options.password, ownerPassword: options.password }
        : {}),
    });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    // Header
    doc.fontSize(16).text("HDFC BANK STATEMENT", { align: "center" });
    doc.fontSize(10).text("Account: 5010023910249 | Period: Aug 2024", { align: "center" });
    doc.moveDown(2);

    // Table Header
    doc.fontSize(10).text("Date        Particulars / Narration                 Withdrawal     Deposit     Closing Balance");
    doc.text("--------------------------------------------------------------------------------------------------");

    // Transaction rows
    doc.text("01/08/2024  UPI/42158912/SWIGGY BANGALORE           450.00                    48550.00");
    doc.text("03/08/2024  POS/AMAZON PAY RETAIL                   2199.00                   46351.00");
    doc.text("05/08/2024  NEFT CR-ACME CORP SALARY                               95000.00  141351.00");
    doc.text("08/08/2024  UPI/UBER INDIA BANGALORE                380.00                   140971.00");
    doc.text("12/08/2024  ECOM/NETFLIX SUBSCRIPTION               649.00                   140322.00");

    doc.end();
  });
}

async function runPdfTests() {
  console.log("🧪 Testing PDF Statement Parsing...");

  const pdfBuffer = await createMockPdfStatement();
  console.log(`- Created in-memory PDF statement (${pdfBuffer.length} bytes)`);

  const result = await parseBankStatementPdfBuffer(pdfBuffer);
  console.log(`- Parse result: success=${result.success}, totalRows=${result.transactions.length}`);

  if (!result.success || result.transactions.length !== 5) {
    throw new Error(`Expected 5 transactions, got ${result.transactions.length}. Error: ${result.error}`);
  }

  for (const t of result.transactions) {
    console.log(`  ✓ ${t.rawDateStr} | ${t.description} | ${t.type} ₹${t.amount} (${t.paymentMethod})`);
  }

  console.log("🎉 PDF Statement Parser Test Passed Successfully!");
}

async function runPasswordPdfTests() {
  console.log("\n🧪 Testing Password-Protected PDF Parsing...");

  const protectedPdf = await createMockPdfStatement({ password: "test1234" });

  const noPasswordResult = await parseBankStatementPdfBuffer(protectedPdf);
  if (noPasswordResult.success || noPasswordResult.errorCode !== "PASSWORD_REQUIRED") {
    throw new Error(`Expected PASSWORD_REQUIRED, got ${noPasswordResult.errorCode}`);
  }

  const wrongPasswordResult = await parseBankStatementPdfBuffer(protectedPdf, "wrong");
  if (wrongPasswordResult.success || wrongPasswordResult.errorCode !== "PASSWORD_INCORRECT") {
    throw new Error(`Expected PASSWORD_INCORRECT, got ${wrongPasswordResult.errorCode}`);
  }

  const correctPasswordResult = await parseBankStatementPdfBuffer(protectedPdf, "test1234");
  if (!correctPasswordResult.success || correctPasswordResult.transactions.length !== 5) {
    throw new Error(
      `Expected 5 transactions with correct password, got ${correctPasswordResult.transactions.length}`
    );
  }

  console.log("🎉 Password-Protected PDF Parser Test Passed Successfully!");
}

runPdfTests()
  .then(() => runPasswordPdfTests())
  .catch((e) => {
    console.error("PDF Test Failed:", e);
    process.exit(1);
  });
