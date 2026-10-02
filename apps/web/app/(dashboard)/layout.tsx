export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <nav className="border-b border-[var(--color-border)] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[var(--color-signal-amber)] font-bold text-lg">GemClaw</span>
          <span className="text-[var(--color-muted)] text-sm">JobSeek</span>
        </div>
        <div className="flex gap-4 text-sm">
          <a
            href="/"
            className="text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            Dashboard
          </a>
          <a
            href="/jobs"
            className="text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            Jobs
          </a>
          <a
            href="/applications"
            className="text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            Applications
          </a>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </>
  );
}
