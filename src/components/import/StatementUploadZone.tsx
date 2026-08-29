"use client";

import { useState, useRef } from "react";
import { UploadCloud, FileSpreadsheet, Loader2, Sparkles, Download, Lock, X } from "lucide-react";
import { toast } from "sonner";
import { parseStatementAction } from "@/actions/import";
import type { AnalyzedTransaction } from "@/actions/import";

interface StatementUploadZoneProps {
  onParsed: (data: {
    fileName: string;
    transactions: AnalyzedTransaction[];
    duplicateCount: number;
    detectedFormat?: string;
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

function isPdfFile(file: File) {
  return file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";
}

export function StatementUploadZone({ onParsed }: StatementUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfPassword, setPdfPassword] = useState("");
  const [pendingPdfFile, setPendingPdfFile] = useState<File | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordModalError, setPasswordModalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File, password?: string) => {
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (password) {
        formData.append("pdfPassword", password);
      }

      const response = await parseStatementAction(formData);

      if (response.success && response.transactions) {
        toast.success(response.message);
        setPendingPdfFile(null);
        setShowPasswordModal(false);
        setPasswordModalError(null);
        onParsed({
          fileName: response.fileName ?? file.name,
          transactions: response.transactions,
          duplicateCount: response.duplicateCount ?? 0,
          detectedFormat: response.detectedFormat,
        });
        return;
      }

      if (
        isPdfFile(file) &&
        (response.errorCode === "PASSWORD_REQUIRED" || response.errorCode === "PASSWORD_INCORRECT")
      ) {
        setPendingPdfFile(file);
        setShowPasswordModal(true);
        setPasswordModalError(response.message);
        if (response.errorCode === "PASSWORD_INCORRECT") {
          toast.error("Incorrect PDF password.");
        } else {
          toast.message("Password required", {
            description: "Enter your statement PDF password to unlock and parse it.",
          });
        }
        return;
      }

      toast.error(response.message ?? "Failed to parse the statement.");
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while uploading the file. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelected = (file: File) => {
    if (isPdfFile(file) && pdfPassword.trim()) {
      void processFile(file, pdfPassword.trim());
      return;
    }
    void processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelected(file);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingPdfFile) return;

    const password = pdfPassword.trim();
    if (!password) {
      setPasswordModalError("Please enter the PDF password.");
      return;
    }

    await processFile(pendingPdfFile, password);
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

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordModalError(null);
    setPendingPdfFile(null);
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
            if (file) handleFileSelected(file);
            e.target.value = "";
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
            {isProcessing ? "Analyzing statement…" : "Upload Bank or Credit Card Statement"}
          </h3>
          <p className="body-sm text-[var(--color-ink-muted)] mb-4">
            Drag & drop your CSV or PDF statement, or click to browse.
          </p>
          <p className="caption text-[var(--color-ink-faint)] mb-4">
            Supports savings/current account and credit card statements from major Indian banks.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 text-[12px] text-[var(--color-ink-faint)]">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius-full)] bg-[var(--color-canvas-soft)] border border-[var(--color-hairline)]">
              <FileSpreadsheet className="w-3.5 h-3.5" /> Bank CSV (HDFC, SBI, ICICI…)
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius-full)] bg-[var(--color-canvas-soft)] border border-[var(--color-hairline)]">
              <FileSpreadsheet className="w-3.5 h-3.5 text-[var(--color-primary)]" /> Credit Card CSV
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius-full)] bg-[var(--color-canvas-soft)] border border-[var(--color-hairline)]">
              <FileSpreadsheet className="w-3.5 h-3.5 text-red-400" /> PDF Statements
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius-full)] bg-[var(--color-canvas-soft)] border border-[var(--color-hairline)]">
              <Lock className="w-3.5 h-3.5 text-amber-500" /> Password-protected PDFs
            </span>
          </div>
        </div>
      </div>

      {/* Optional PDF password (proactive entry before upload) */}
      <div
        className="p-4 bg-[var(--color-canvas-soft)] border border-[var(--color-hairline)] rounded-[var(--radius-lg)]"
        onClick={(e) => e.stopPropagation()}
      >
        <label htmlFor="pdf-password-optional" className="flex items-center gap-2 eyebrow text-[var(--color-ink-muted)] uppercase mb-2">
          <Lock className="w-3.5 h-3.5 text-amber-500" />
          PDF password (optional)
        </label>
        <input
          id="pdf-password-optional"
          type="password"
          value={pdfPassword}
          onChange={(e) => setPdfPassword(e.target.value)}
          placeholder="Enter password if your PDF statement is protected"
          autoComplete="off"
          className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-hairline)] bg-[var(--color-surface)] body-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
        />
        <p className="caption text-[var(--color-ink-faint)] mt-1.5">
          Many bank PDF statements use your date of birth (DDMMYYYY) or a custom password. We never store this.
        </p>
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
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-[var(--radius-full)] bg-[var(--color-primary)] text-[var(--color-on-primary)] button-sm hover:bg-[var(--color-primary-active)] transition-colors disabled:opacity-50"
          >
            {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            Load Sample in 1-Click
          </button>
        </div>
      </div>

      <p className="caption text-[var(--color-ink-faint)] text-center">
        PDF support works for text-based bank and credit card statements, including password-protected files.
        Scanned image PDFs are not supported.
      </p>

      {/* Password prompt modal */}
      {showPasswordModal && pendingPdfFile && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pdf-password-title"
        >
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={closePasswordModal} />
          <div className="relative w-full sm:max-w-md bg-[var(--color-surface)] rounded-t-[var(--radius-xl)] sm:rounded-[var(--radius-xl)] border border-[var(--color-hairline)] shadow-xl p-6 m-0 sm:m-4">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 id="pdf-password-title" className="title text-[var(--color-ink)] flex items-center gap-2">
                  <Lock className="w-5 h-5 text-amber-500" />
                  PDF Password Required
                </h2>
                <p className="caption text-[var(--color-ink-muted)] mt-1 truncate">
                  {pendingPdfFile.name}
                </p>
              </div>
              <button
                type="button"
                onClick={closePasswordModal}
                className="p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--color-canvas-soft)] text-[var(--color-ink-muted)]"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label htmlFor="pdf-password-modal" className="eyebrow text-[var(--color-ink-muted)] uppercase mb-1.5 block">
                  Statement password
                </label>
                <input
                  id="pdf-password-modal"
                  type="password"
                  value={pdfPassword}
                  onChange={(e) => {
                    setPdfPassword(e.target.value);
                    setPasswordModalError(null);
                  }}
                  placeholder="e.g. DDMMYYYY or bank-provided password"
                  autoComplete="off"
                  autoFocus
                  className="w-full px-3 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-hairline)] bg-[var(--color-canvas-soft)] body-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                />
                {passwordModalError && (
                  <p className="caption text-[var(--color-error)] mt-1.5">{passwordModalError}</p>
                )}
              </div>

              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={closePasswordModal}
                  className="px-4 py-2 rounded-[var(--radius-full)] border border-[var(--color-hairline)] caption font-medium text-[var(--color-ink-secondary)] hover:bg-[var(--color-canvas-soft)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-full)] bg-[var(--color-primary)] text-[var(--color-on-primary)] button-sm hover:bg-[var(--color-primary-active)] disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                  Unlock &amp; Parse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
