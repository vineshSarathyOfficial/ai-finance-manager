import type { Metadata } from "next";
import { getRequiredSession } from "@/lib/auth/session";
import { logoutUser } from "@/actions/auth";
import { User, Lock, LogOut, Download, Trash2, Database } from "lucide-react";
import { SettingsExportButton } from "@/components/settings/SettingsExportButton";
import { SettingsDangerZone } from "@/components/settings/SettingsDangerZone";
import { prisma } from "@/lib/db/prisma";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your account, preferences, and data.",
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getRequiredSession();
  const user = session.user;

  const txCount = await prisma.transaction.count({ where: { userId: user.id } });

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="heading-2 text-[var(--color-ink)]">Settings</h1>
        <p className="body-sm text-[var(--color-ink-muted)] mt-1">
          Manage your account and preferences
        </p>
      </div>

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

      {/* Security card */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-hairline)] shadow-level-1">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--color-hairline)]">
          <Lock className="w-4 h-4 text-[var(--color-ink-faint)]" />
          <h2 className="title text-[var(--color-ink)]">Security</h2>
        </div>
        <div className="px-5 py-4">
          <p className="body-sm text-[var(--color-ink-muted)]">
            Your password is hashed with bcrypt. To change your password, sign out and use account recovery (coming soon).
          </p>
        </div>
      </div>

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
