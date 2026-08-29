import "server-only";
import PDFDocument from "pdfkit";
import { formatCurrency, formatDate } from "@/lib/utils";

export interface ExportTransactionRow {
  transactionDate: Date;
  description: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  categoryName: string;
  paymentMethod: string | null;
}

interface GeneratePdfOptions {
  transactions: ExportTransactionRow[];
  periodLabel: string;
  generatedAt?: Date;
}

function truncate(text: string, max: number) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

export async function generateTransactionsPdf({
  transactions,
  periodLabel,
  generatedAt = new Date(),
}: GeneratePdfOptions): Promise<Buffer> {
  const income = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0);
  const expense = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const colX = {
      date: 40,
      desc: 100,
      category: 280,
      type: 360,
      amount: 430,
    };

    const drawHeader = () => {
      doc.font("Helvetica-Bold").fontSize(18).fillColor("#111111");
      doc.text("FinPulse Transaction Report", 40, 40);

      doc.font("Helvetica").fontSize(10).fillColor("#555555");
      doc.text(`Period: ${periodLabel}`, 40, 64);
      doc.text(`Generated: ${formatDate(generatedAt)}`, 40, 78);
      doc.text(`Transactions: ${transactions.length}`, 40, 92);

      doc.moveDown(0.5);
      const summaryY = 112;
      doc.font("Helvetica-Bold").fontSize(11).fillColor("#111111");
      doc.text("Summary", 40, summaryY);
      doc.font("Helvetica").fontSize(10).fillColor("#333333");
      doc.text(`Income: ${formatCurrency(income)}`, 40, summaryY + 16);
      doc.text(`Expenses: ${formatCurrency(expense)}`, 180, summaryY + 16);
      doc.text(`Net: ${formatCurrency(income - expense)}`, 320, summaryY + 16);

      const tableTop = summaryY + 44;
      doc.moveTo(40, tableTop).lineTo(40 + pageWidth, tableTop).strokeColor("#dddddd").stroke();

      doc.font("Helvetica-Bold").fontSize(9).fillColor("#444444");
      doc.text("Date", colX.date, tableTop + 8);
      doc.text("Description", colX.desc, tableTop + 8);
      doc.text("Category", colX.category, tableTop + 8);
      doc.text("Type", colX.type, tableTop + 8);
      doc.text("Amount", colX.amount, tableTop + 8, { width: 110, align: "right" });

      doc.moveTo(40, tableTop + 24).lineTo(40 + pageWidth, tableTop + 24).strokeColor("#dddddd").stroke();

      return tableTop + 32;
    };

    let y = drawHeader();
    const rowHeight = 18;
    const bottomLimit = doc.page.height - 50;

    if (transactions.length === 0) {
      doc.font("Helvetica").fontSize(10).fillColor("#666666");
      doc.text("No transactions found for this period.", 40, y);
      doc.end();
      return;
    }

    for (const tx of transactions) {
      if (y > bottomLimit) {
        doc.addPage();
        y = drawHeader();
      }

      doc.font("Helvetica").fontSize(8.5).fillColor("#222222");
      doc.text(formatDate(tx.transactionDate), colX.date, y, { width: 54 });
      doc.text(truncate(tx.description, 34), colX.desc, y, { width: 172 });
      doc.text(truncate(tx.categoryName, 14), colX.category, y, { width: 72 });
      doc.fillColor(tx.type === "INCOME" ? "#1aae39" : "#31302e");
      doc.text(tx.type === "INCOME" ? "Income" : "Expense", colX.type, y, { width: 60 });
      doc.fillColor("#222222");
      doc.text(
        `${tx.type === "INCOME" ? "+" : "-"}${formatCurrency(tx.amount)}`,
        colX.amount,
        y,
        { width: 110, align: "right" }
      );

      y += rowHeight;
    }

    doc.end();
  });
}
