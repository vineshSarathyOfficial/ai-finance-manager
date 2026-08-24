import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCategories } from "@/lib/db/categories";
import { parseBankStatementCsv } from "@/lib/import/csv-parser";
import { categorizeTransaction } from "@/lib/categorization/engine";
import { detectDuplicates } from "@/lib/import/duplicate-detector";
import type { AnalyzedTransaction } from "@/actions/import";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  // Auth check
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, message: "No file provided." }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    const isCsv = fileName.endsWith(".csv");
    const isPdf = fileName.endsWith(".pdf");

    if (!isCsv && !isPdf) {
      return NextResponse.json({ success: false, message: "Unsupported file format. Upload a .csv or .pdf." }, { status: 400 });
    }

    let parseResult;

    if (isCsv) {
      const text = await file.text();
      parseResult = parseBankStatementCsv(text);
    } else {
      // PDF: read as Buffer and pass to pdf-parse (safe in Node.js API route)
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Use require here — safe in API route Node.js context
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfModule = require("pdf-parse");
      let text = "";

      if (pdfModule.PDFParse) {
        // v2+ class API
        const parser = new pdfModule.PDFParse({ data: buffer });
        const result = await parser.getText();
        text = typeof result === "string" ? result : result.text ?? "";
        await parser.destroy();
      } else if (typeof pdfModule === "function") {
        // v1 function API
        const data = await pdfModule(buffer);
        text = data.text ?? "";
      } else if (typeof pdfModule.default === "function") {
        const data = await pdfModule.default(buffer);
        text = data.text ?? "";
      }

      if (!text.trim()) {
        return NextResponse.json({
          success: false,
          message: "No text found in PDF. The file may be a scanned image (not a text-based statement).",
        });
      }

      const { parseBankStatementPdfText } = await import("@/lib/import/pdf-parser");
      parseResult = parseBankStatementPdfText(text);
    }

    if (!parseResult.success || parseResult.transactions.length === 0) {
      return NextResponse.json({
        success: false,
        message: parseResult.error ?? "No valid transactions could be found in this file.",
      });
    }

    const categories = await getCategories(userId);
    const duplicates = await detectDuplicates(userId, parseResult.transactions);

    let duplicateCount = 0;
    const transactions: AnalyzedTransaction[] = parseResult.transactions.map((tx, idx) => {
      const categorization = categorizeTransaction(tx.description, tx.type, categories);
      const dup = duplicates[idx] ?? { isDuplicate: false, duplicateConfidence: 0 };
      if (dup.isDuplicate) duplicateCount++;

      return {
        id: `row-${idx}-${Date.now()}`,
        date: tx.date.toISOString(),
        description: tx.description,
        amount: tx.amount,
        type: tx.type,
        paymentMethod: tx.paymentMethod,
        referenceNo: tx.referenceNo,
        selected: !dup.isDuplicate,
        categorization,
        duplicateInfo: dup,
      };
    });

    return NextResponse.json({
      success: true,
      message: `Parsed ${transactions.length} transactions from ${file.name}.`,
      fileName: file.name,
      totalParsed: transactions.length,
      duplicateCount,
      transactions,
    });
  } catch (error) {
    console.error("[import/parse] Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to parse the statement file." },
      { status: 500 }
    );
  }
}
