import type { Metadata } from "next";
import { getRequiredUserId } from "@/lib/auth/session";
import { getCategories } from "@/lib/db/categories";
import { getStatementImports } from "@/actions/import";
import { getGmailConnectionStatusAction } from "@/actions/gmail";
import { ImportClient } from "@/components/import/ImportClient";
import { GmailSyncCard } from "@/components/gmail/GmailSyncCard";
import { UploadCloud } from "lucide-react";

export const metadata: Metadata = {
  title: "Import & Sync",
  description: "Upload bank statements or sync automatically from Gmail.",
};

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const userId = await getRequiredUserId();

  const [categories, pastImports, gmailStatus] = await Promise.all([
    getCategories(userId),
    getStatementImports(userId),
    getGmailConnectionStatusAction(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="heading-2 text-[var(--color-ink)] flex items-center gap-2.5">
          <UploadCloud className="w-6 h-6 text-[var(--color-primary)]" />
          Import &amp; Sync Transactions
        </h1>
        <p className="body-sm text-[var(--color-ink-muted)] mt-1">
          Sync transactions automatically from your Gmail or upload CSV / PDF bank statements.
        </p>
      </div>

      {/* 1. Gmail Automatic Sync */}
      <GmailSyncCard initialStatus={gmailStatus} />

      {/* 2. Manual Statement Import */}
      <div className="space-y-4">
        <div>
          <h2 className="title text-[var(--color-ink)]">Upload Statement File</h2>
          <p className="caption text-[var(--color-ink-muted)] mt-0.5">
            Upload PDF or CSV bank statements to parse, categorize, and preview transactions before adding.
          </p>
        </div>
        <ImportClient categories={categories} pastImports={pastImports} />
      </div>
    </div>
  );
}
