import type { Metadata } from "next";
import { getRequiredUserId } from "@/lib/auth/session";
import { getCategories } from "@/lib/db/categories";
import { getStatementImports } from "@/actions/import";
import { getGmailConnectionStatusAction } from "@/actions/gmail";
import { ImportClient } from "@/components/import/ImportClient";
import { GmailSyncCard } from "@/components/gmail/GmailSyncCard";
import { PageHeader } from "@/components/ui/PageHeader";

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
    <div className="space-y-4 lg:space-y-8">
      <PageHeader
        title="Import & Sync"
        description="Sync from Gmail or upload CSV / PDF bank and credit card statements"
      />

      {/* 1. Gmail Automatic Sync */}
      <GmailSyncCard initialStatus={gmailStatus} />

      {/* 2. Manual Statement Import */}
      <div className="space-y-4">
        <div>
          <h2 className="title text-[var(--color-ink)]">Upload Statement File</h2>
          <p className="caption text-[var(--color-ink-muted)] mt-0.5">
            Upload PDF or CSV bank / credit card statements to parse, categorize, and preview transactions before adding.
          </p>
        </div>
        <ImportClient categories={categories} pastImports={pastImports} />
      </div>
    </div>
  );
}
