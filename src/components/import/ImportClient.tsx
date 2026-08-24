"use client";

import { useState } from "react";
import { StatementUploadZone } from "./StatementUploadZone";
import { ImportReviewTable } from "./ImportReviewTable";
import { ImportHistoryList } from "./ImportHistoryList";
import type { AnalyzedTransaction } from "@/actions/import";
import type { Category, StatementImport } from "@/types/finance";

interface ImportClientProps {
  categories: Category[];
  pastImports: StatementImport[];
}

export function ImportClient({ categories, pastImports }: ImportClientProps) {
  const [parsedData, setParsedData] = useState<{
    fileName: string;
    transactions: AnalyzedTransaction[];
    duplicateCount: number;
  } | null>(null);

  return (
    <div className="space-y-8">
      {!parsedData ? (
        <>
          <StatementUploadZone onParsed={(data) => setParsedData(data)} />
          <ImportHistoryList imports={pastImports} />
        </>
      ) : (
        <ImportReviewTable
          fileName={parsedData.fileName}
          initialTransactions={parsedData.transactions}
          categories={categories}
          duplicateCount={parsedData.duplicateCount}
          onReset={() => setParsedData(null)}
        />
      )}
    </div>
  );
}
