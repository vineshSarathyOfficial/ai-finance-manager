"use client";

import { useState, useRef } from "react";
import { UploadCloud, FileSpreadsheet, Loader2, Sparkles, Download } from "lucide-react";
import { toast } from "sonner";
import type { AnalyzedTransaction } from "@/actions/import";

interface StatementUploadZoneProps {
  onParsed: (data: {
    fileName: string;
    transactions: AnalyzedTransaction[];
    duplicateCount: number;
  }) => void;
}

const SAMPLE_CSV = `Date,Narration,Chq/Ref No,Value Dt,Withdrawal Amt.,Deposit Amt.,Closing Balance
01/08/2024,SWIGGY BANGALORE IN,UPI-42158912,01/08/2024,420.00,,45200.00
02/08/2024,AMAZON PAY INDIA RETAIL,POS-98124,02/08/2024,1899.00,,43301.00
03/08/2024,UBER INDIA BANGALORE,UPI-99120144,03/08/2024,340.00,,42961.00
05/08/2024,SALARY CREDITED ACME CORP,NEFT-0012941,05/08/2024,,95000.00,137961.00
06/08/2024,BLINKIT QUICK COMMERCE,UPI-77120491,06/08/2024,650.00,,137311.00
08/08/2024,NETFLIX ENTERTAINMENT,ECOM-44102,08/08/2024,649.00,,136662.00
10/08/2024,BESCOM ELECTRICITY BILL,BBPS-120491,10/08/2024,1420.00,,135242.00
12/08/2024,APOLLO PHARMACY BANGALORE,POS-881023,12/08/2024,530.00,,134712.00
15/08/2024,FREELANCE CLIENT CONSULTING,IMPS-774012,15/08/2024,,25000.00,159712.00
18/08/2024,STARBUCKS COFFEE KORAMANGALA,UPI-331092,18/08/2024,390.00,,159322.00`;

export function StatementUploadZone({ onParsed }: StatementUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Use the API route instead of server action — required for PDF binary parsing
      const res = await fetch("/api/import/parse", {
        method: "POST",
        body: formData,
      });

      const response = await res.json();

      if (response.success && response.transactions) {
        toast.success(response.message);
        onParsed({
          fileName: response.fileName ?? file.name,
          transactions: response.transactions,
          duplicateCount: response.duplicateCount ?? 0,
        });
      } else {
        toast.error(response.message ?? "Failed to parse the statement.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while uploading the file.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const downloadSampleCsv = () => {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sample_bank_statement.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Sample statement downloaded!");
  };

  const loadSampleDataDirectly = async () => {
    const file = new File([SAMPLE_CSV], "sample_bank_statement.csv", { type: "text/csv" });
    await processFile(file);
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-[var(--radius-xl)] p-8 sm:p-12 text-center transition-all cursor-pointer bg-[var(--color-surface)] ${
          isDragging
            ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 scale-[1.005]"
            : "border-[var(--color-hairline)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-canvas-soft)]"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.pdf,text/csv,application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) processFile(file);
            e.target.value = ""; // reset input so same file can be re-uploaded
          }}
        />

        <div className="flex flex-col items-center justify-center max-w-md mx-auto">
          <div className="w-14 h-14 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mb-4 text-[var(--color-primary)]">
            {isProcessing ? (
              <Loader2 className="w-7 h-7 animate-spin" />
            ) : (
              <UploadCloud className="w-7 h-7" />
            )}
          </div>

          <h3 className="title text-[var(--color-ink)] mb-1">
            {isProcessing ? "Analyzing statement…" : "Upload Bank Statement"}
          </h3>
          <p className="body-sm text-[var(--color-ink-muted)] mb-4">
            Drag & drop your CSV or PDF statement, or click to browse.
          </p>
          <p className="caption text-[var(--color-ink-faint)] mb-4">
            Transactions are auto-categorized using merchant rules + AI fallback.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 text-[12px] text-[var(--color-ink-faint)]">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius-full)] bg-[var(--color-canvas-soft)] border border-[var(--color-hairline)]">
              <FileSpreadsheet className="w-3.5 h-3.5" /> CSV (HDFC, SBI, ICICI, Axis…)
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius-full)] bg-[var(--color-canvas-soft)] border border-[var(--color-hairline)]">
              <FileSpreadsheet className="w-3.5 h-3.5 text-red-400" /> PDF Bank Statements
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius-full)] bg-[var(--color-canvas-soft)] border border-[var(--color-hairline)]">
              <Sparkles className="w-3.5 h-3.5 text-[var(--color-primary)]" /> Auto-categorization
            </span>
          </div>
        </div>
      </div>

      {/* Quick Demo Helpers */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[var(--color-canvas-soft)] border border-[var(--color-hairline)] rounded-[var(--radius-lg)]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--color-primary)]" />
          <span className="body-sm font-medium text-[var(--color-ink)]">Testing with demo statement?</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={downloadSampleCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-full)] border border-[var(--color-hairline)] bg-[var(--color-surface)] caption font-medium text-[var(--color-ink-secondary)] hover:bg-[var(--color-canvas)] transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Download Sample CSV
          </button>
          <button
            type="button"
            onClick={loadSampleDataDirectly}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-[var(--radius-full)] bg-[var(--color-primary)] text-white caption font-medium hover:bg-[var(--color-primary-active)] transition-colors disabled:opacity-50"
          >
            {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            Load Sample in 1-Click
          </button>
        </div>
      </div>

      {/* Help text for PDF */}
      <p className="caption text-[var(--color-ink-faint)] text-center">
        📄 PDF support works for text-based statements (HDFC, ICICI, SBI netbanking PDFs). Scanned image PDFs are not supported.
      </p>
    </div>
  );
}
