import type { Metadata } from "next";
import { getRequiredSession } from "@/lib/auth/session";
import { logoutUser } from "@/actions/auth";
import { User, Lock, LogOut, Database, Wallet } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { SettingsExportButton } from "@/components/settings/SettingsExportButton";
import { SettingsDangerZone } from "@/components/settings/SettingsDangerZone";
import { SettingsAiCard } from "@/components/settings/SettingsAiCard";
import { GmailSyncCard } from "@/components/gmail/GmailSyncCard";
import { getGmailConnectionStatusAction } from "@/actions/gmail";
import { prisma } from "@/lib/db/prisma";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your account, preferences, and integrations.",
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getRequiredSession();
  const user = session.user;

  const [txCount, gmailStatus] = await Promise.all([
    prisma.transaction.count({ where: { userId: user.id } }),
    getGmailConnectionStatusAction(),
  ]);

  return (
    <div className="space-y-4 lg:space-y-6 max-w-2xl">
      <PageHeader
        title="Settings"
        description="Manage your account, preferences, and integrations"
      />

      <Link href="/accounts" className="flex items-center gap-3 p-4 rounded-[var(--radius-md)] border border-[var(--color-hairline)] bg-[var(--color-surface-card)] hover:shadow-card transition-shadow">
        <Wallet className="w-5 h-5 text-[var(--color-primary)]" />
        <div>
          <p className="title-md text-[var(--color-ink)]">Manage Accounts</p>
          <p className="body-sm text-[var(--color-ink-muted)]">Bank accounts, credit cards, and cash</p>
        </div>
      </Link>

      {/* Profile card */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-hairline)] shadow-level-1">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--color-hairline)]">
          <User className="w-4 h-4 text-[var(--color-ink-faint)]" />
          <h2 className="title text-[var(--color-ink)]">Profile</h2>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div>
            <p className="eyebrow text-[var(--color-ink-muted)] uppercase mb-1">Name</p>
            <p className="body-sm text-[var(--color-ink)]">{user.name ?? "—"}</p>
          </div>
          <div>
            <p className="eyebrow text-[var(--color-ink-muted)] uppercase mb-1">Email</p>
            <p className="body-sm text-[var(--color-ink)]">{user.email}</p>
          </div>
        </div>
      </div>

      {/* FinPulse AI Configuration Card */}
      <SettingsAiCard />

      {/* Gmail Integration card */}
      <GmailSyncCard initialStatus={gmailStatus} />

      {/* Data card */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-hairline)] shadow-level-1">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--color-hairline)]">
          <Database className="w-4 h-4 text-[var(--color-ink-faint)]" />
          <h2 className="title text-[var(--color-ink)]">Your Data</h2>
        </div>
        <div className="px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="body-sm text-[var(--color-ink)]">Export all transactions as CSV</p>
            <p className="caption text-[var(--color-ink-muted)] mt-0.5">
              {txCount} transaction{txCount !== 1 ? "s" : ""} · includes date, amount, category, description
            </p>
          </div>
          <SettingsExportButton />
        </div>
      </div>

      {/* Security card */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-hairline)] shadow-level-1">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--color-hairline)]">
          <Lock className="w-4 h-4 text-[var(--color-ink-faint)]" />
          <h2 className="title text-[var(--color-ink)]">Security</h2>
        </div>
        <div className="px-5 py-4">
          <p className="body-sm text-[var(--color-ink-muted)]">
            Your password is hashed with bcrypt. To change your password, sign out and use account recovery.
          </p>
        </div>
      </div>

      {/* Sign out */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-hairline)] shadow-level-1">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--color-hairline)]">
          <LogOut className="w-4 h-4 text-[var(--color-ink-faint)]" />
          <h2 className="title text-[var(--color-ink)]">Sign out</h2>
        </div>
        <div className="px-5 py-4 flex items-center justify-between">
          <p className="body-sm text-[var(--color-ink-muted)]">
            You&apos;re signed in as <span className="text-[var(--color-ink)] font-medium">{user.email}</span>
          </p>
          <form action={logoutUser}>
            <button
              type="submit"
              className="px-4 py-2 rounded-[var(--radius-full)] border border-[var(--color-hairline)] body-sm font-medium text-[var(--color-ink-secondary)] hover:bg-[var(--color-canvas-soft)] transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>

      {/* Danger Zone */}
      <SettingsDangerZone txCount={txCount} />
    </div>
  );
}
