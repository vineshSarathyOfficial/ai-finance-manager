"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginUser } from "@/actions/auth";

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginUser, undefined);

  return (
    <div className="w-full max-w-[420px]">
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-hairline)] p-8 shadow-level-1">
        <div className="mb-6">
          <h1 className="heading-2 text-[var(--color-ink)] mb-1.5">Welcome back</h1>
          <p className="caption text-[var(--color-ink-muted)]">
            Sign in to your Finance Manager account
          </p>
        </div>

        {state?.message && (
          <div className="mb-4 p-3 rounded-[var(--radius-md)] bg-[var(--color-error-bg)] border border-red-200">
            <p className="caption text-[var(--color-error)]">{state.message}</p>
          </div>
        )}

        <form action={action} className="space-y-4">
          <div>
            <label
              htmlFor="login-email"
              className="eyebrow text-[var(--color-ink-muted)] uppercase mb-1.5 block"
            >
              Email
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              className="w-full px-3.5 py-2.5 rounded-[var(--radius-xs)] border border-[var(--color-hairline)] bg-[var(--color-surface)] text-[var(--color-ink)] body-sm placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="eyebrow text-[var(--color-ink-muted)] uppercase mb-1.5 block"
            >
              Password
            </label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-[var(--radius-xs)] border border-[var(--color-hairline)] bg-[var(--color-surface)] text-[var(--color-ink)] body-sm placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            id="login-submit"
            className="w-full py-2.5 px-4 rounded-[var(--radius-full)] bg-[var(--color-primary)] text-white font-medium text-[15px] transition-all hover:bg-[var(--color-primary-active)] active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="caption text-[var(--color-ink-muted)] text-center mt-5">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="text-[var(--color-primary)] hover:text-[var(--color-primary-active)] font-medium"
          >
            Create one
          </Link>
        </p>

        <div className="mt-5 p-3.5 rounded-[var(--radius-md)] bg-[var(--color-canvas-soft)] border border-[var(--color-hairline)]">
          <p className="eyebrow text-[var(--color-ink-muted)] uppercase mb-1">Demo account</p>
          <p className="caption text-[var(--color-ink-muted)]">
            Email: <span className="text-[var(--color-ink)] font-medium">demo@financemanager.app</span>
          </p>
          <p className="caption text-[var(--color-ink-muted)] mt-0.5">
            Password: <span className="text-[var(--color-ink)] font-medium">demo1234!</span>
          </p>
        </div>
      </div>
    </div>
  );
}
