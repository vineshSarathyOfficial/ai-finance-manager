"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerUser } from "@/actions/auth";

export default function RegisterPage() {
  const [state, action, pending] = useActionState(registerUser, undefined);

  return (
    <div className="w-full max-w-[420px]">
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-hairline)] p-5 sm:p-8 shadow-level-1">
        <div className="mb-6">
          <h1 className="heading-2 text-[var(--color-ink)] mb-1.5">Create account</h1>
          <p className="caption text-[var(--color-ink-muted)]">
            Start tracking your finances today
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
              htmlFor="register-name"
              className="eyebrow text-[var(--color-ink-muted)] uppercase mb-1.5 block"
            >
              Full name
            </label>
            <input
              id="register-name"
              name="name"
              type="text"
              autoComplete="name"
              required
              placeholder="Your name"
              className="w-full px-3.5 py-2.5 rounded-[var(--radius-xs)] border border-[var(--color-hairline)] bg-[var(--color-surface)] text-[var(--color-ink)] body-sm placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-colors"
            />
            {state?.errors?.name && (
              <p className="caption text-[var(--color-error)] mt-1">{state.errors.name[0]}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="register-email"
              className="eyebrow text-[var(--color-ink-muted)] uppercase mb-1.5 block"
            >
              Email
            </label>
            <input
              id="register-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              className="w-full px-3.5 py-2.5 rounded-[var(--radius-xs)] border border-[var(--color-hairline)] bg-[var(--color-surface)] text-[var(--color-ink)] body-sm placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-colors"
            />
            {state?.errors?.email && (
              <p className="caption text-[var(--color-error)] mt-1">{state.errors.email[0]}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="register-password"
              className="eyebrow text-[var(--color-ink-muted)] uppercase mb-1.5 block"
            >
              Password
            </label>
            <input
              id="register-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Min. 8 characters"
              className="w-full px-3.5 py-2.5 rounded-[var(--radius-xs)] border border-[var(--color-hairline)] bg-[var(--color-surface)] text-[var(--color-ink)] body-sm placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-colors"
            />
            {state?.errors?.password && (
              <p className="caption text-[var(--color-error)] mt-1">{state.errors.password[0]}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={pending}
            id="register-submit"
            className="w-full py-2.5 px-4 rounded-[var(--radius-full)] bg-[var(--color-primary)] text-white font-medium text-[15px] transition-all hover:bg-[var(--color-primary-active)] active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {pending ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="caption text-[var(--color-ink-muted)] text-center mt-5">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-[var(--color-primary)] hover:text-[var(--color-primary-active)] font-medium"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
