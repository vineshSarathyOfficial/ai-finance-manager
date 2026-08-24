import type { Metadata } from "next";
import { getRequiredUserId } from "@/lib/auth/session";
import { getCategories } from "@/lib/db/categories";
import { getStatementImports } from "@/actions/import";
import { ImportClient } from "@/components/import/ImportClient";

export const metadata: Metadata = { title: "Import Bank Statement" };

export default async function ImportPage() {
  const userId = await getRequiredUserId();

  const [categories, pastImports] = await Promise.all([
    getCategories(userId),
    getStatementImports(userId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading-2 text-[var(--color-ink)]">Import Bank Statement</h1>
        <p className="body-sm text-[var(--color-ink-muted)] mt-1">
          Upload PDF or CSV bank statements to automatically extract, categorize, and ingest transactions.
        </p>
      </div>

      <ImportClient categories={categories} pastImports={pastImports} />
    </div>
  );
}
