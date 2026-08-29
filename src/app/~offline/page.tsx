export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[var(--color-canvas)] px-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-[var(--color-primary)]">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          className="size-8 text-white"
          aria-hidden
        >
          <path
            d="M4 12.5H7.5L10 7.5L13.5 17.5L16 10.5L18 12.5H20"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h1 className="headline-sm text-[var(--color-ink)]">You&apos;re offline</h1>
      <p className="body max-w-sm text-[var(--color-ink-muted)]">
        FinPulse needs a connection to load your latest transactions. Check your
        network and try again.
      </p>
    </main>
  );
}
