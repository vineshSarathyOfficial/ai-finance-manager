"use client";

import { useState, useTransition, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Mail, RefreshCw, CheckCircle2, ShieldCheck, Unlink, Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { syncGmailTransactionsAction, disconnectGmailAction, type GmailConnectionStatus, type SyncTimeRange } from "@/actions/gmail";
import { formatDate } from "@/lib/utils";

interface Props {
  initialStatus: GmailConnectionStatus;
  variant?: "full" | "compact";
}

const SYNC_RANGES: Array<{ value: SyncTimeRange; label: string }> = [
  { value: "CURRENT_MONTH", label: "Current Month" },
  { value: "7", label: "Last 7 Days" },
  { value: "15", label: "Last 15 Days" },
  { value: "30", label: "Last 30 Days" },
  { value: "60", label: "Last 60 Days" },
  { value: "90", label: "Last 3 Months (90d)" },
  { value: "180", label: "Last 6 Months (180d)" },
  { value: "365", label: "Last 1 Year" },
];

export function GmailSyncCard({ initialStatus, variant = "full" }: Props) {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<GmailConnectionStatus>(initialStatus);
  const [selectedRange, setSelectedRange] = useState<SyncTimeRange>("CURRENT_MONTH");
  const [isSyncing, startSyncTransition] = useTransition();
  const [isDisconnecting, startDisconnectTransition] = useTransition();

  useEffect(() => {
    if (searchParams.get("gmail") === "connected") {
      toast.success("Gmail connected successfully! You can now sync your transactions.");
    } else if (searchParams.get("error") === "gmail_connect_failed" || searchParams.get("error") === "gmail_auth_failed") {
      toast.error("Failed to connect Gmail. Please check your Google OAuth credentials.");
    }
  }, [searchParams]);

  function handleSync() {
    startSyncTransition(async () => {
      const result = await syncGmailTransactionsAction(selectedRange);
      if (result.success) {
        toast.success(result.message);
        setStatus((prev) => ({ ...prev, lastSyncAt: new Date() }));
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleDisconnect() {
    if (!confirm("Are you sure you want to disconnect your Gmail account?")) return;

    startDisconnectTransition(async () => {
      const result = await disconnectGmailAction();
      if (result.success) {
        toast.success("Gmail disconnected.");
        setStatus({ connected: false, email: null, lastSyncAt: null });
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-hairline)] p-5 sm:p-6 shadow-level-1 relative overflow-hidden">
      {/* Top title bar */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[var(--radius-lg)] bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0 text-red-600">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="title text-[var(--color-ink)]">Gmail Transaction Sync</h2>
              {status.connected && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" /> Connected
                </span>
              )}
            </div>
            <p className="caption text-[var(--color-ink-muted)] mt-0.5">
              Auto-fetch bank alerts from HDFC, ICICI, SBI, Axis, UPI &amp; Paytm
            </p>
          </div>
        </div>

        {status.connected && (
          <button
            onClick={handleDisconnect}
            disabled={isDisconnecting || isSyncing}
            className="hidden sm:inline-flex items-center gap-1.5 caption text-[var(--color-ink-faint)] hover:text-red-600 transition-colors p-1.5"
            title="Disconnect Gmail"
          >
            {isDisconnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Unlink className="w-3.5 h-3.5" />}
            <span>Disconnect</span>
          </button>
        )}
      </div>

      {!status.connected ? (
        <div className="space-y-4 pt-1">
          <p className="body-sm text-[var(--color-ink-secondary)]">
            Connect your Gmail to automatically scan for transaction notification emails. Your data is processed securely and duplicate-checked before saving.
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 caption text-[var(--color-ink-muted)]">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Read-only access to financial notification emails only</span>
            </div>

            <a
              id="connect-gmail-btn"
              href="/api/gmail/connect"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[var(--radius-full)] bg-[var(--color-ink)] text-white body-sm font-medium hover:opacity-90 transition-opacity shadow-sm flex-shrink-0"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Connect Gmail
            </a>
          </div>
        </div>
      ) : (
        <div className="space-y-4 pt-1">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-[var(--radius-lg)] bg-[var(--color-canvas-soft)] border border-[var(--color-hairline)]">
            <div>
              <p className="body-sm font-medium text-[var(--color-ink)]">{status.email ?? "Google Account"}</p>
              <p className="caption text-[var(--color-ink-muted)] mt-0.5">
                {status.lastSyncAt
                  ? `Last synced on ${formatDate(status.lastSyncAt)}`
                  : "Never synced yet — choose time range and click Sync Now"}
              </p>
            </div>

            {/* Time Range Selector + Sync Button */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] bg-white border border-[var(--color-hairline)] shadow-sm">
                <Calendar className="w-3.5 h-3.5 text-[var(--color-ink-faint)] flex-shrink-0" />
                <select
                  id="gmail-sync-range-select"
                  value={selectedRange}
                  onChange={(e) => setSelectedRange(e.target.value as SyncTimeRange)}
                  disabled={isSyncing}
                  className="bg-transparent body-sm text-[var(--color-ink)] font-medium outline-none cursor-pointer pr-1"
                >
                  {SYNC_RANGES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                id="sync-gmail-now-btn"
                onClick={handleSync}
                disabled={isSyncing}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[var(--radius-full)] bg-[var(--color-primary)] text-white body-sm font-medium hover:bg-[var(--color-primary-active)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm flex-shrink-0"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Scanning Emails...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Sync Now
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between sm:hidden pt-1">
            <button
              onClick={handleDisconnect}
              disabled={isDisconnecting || isSyncing}
              className="caption text-red-600 hover:underline inline-flex items-center gap-1"
            >
              <Unlink className="w-3 h-3" /> Disconnect Gmail
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
