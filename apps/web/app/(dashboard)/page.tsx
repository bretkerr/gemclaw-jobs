export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard label="Jobs Discovered" value="--" color="var(--color-circuit-blue)" />
        <StatCard label="Applications Sent" value="--" color="var(--color-signal-amber)" />
        <StatCard label="Avg Cost/App" value="$0.00" color="var(--color-muted)" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-5">
          <h2 className="text-sm font-bold text-[var(--color-signal-amber)] uppercase tracking-wider mb-4">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <a
              href="/jobs"
              className="block p-3 border border-[var(--color-border)] rounded hover:border-[var(--color-signal-amber)] transition-colors"
            >
              <span className="font-semibold">Discover Jobs</span>
              <p className="text-sm text-[var(--color-muted)] mt-1">Search Greenhouse boards for open positions</p>
            </a>
            <a
              href="/applications"
              className="block p-3 border border-[var(--color-border)] rounded hover:border-[var(--color-circuit-blue)] transition-colors"
            >
              <span className="font-semibold">Track Applications</span>
              <p className="text-sm text-[var(--color-muted)] mt-1">View status of all submitted applications</p>
            </a>
          </div>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-5">
          <h2 className="text-sm font-bold text-[var(--color-circuit-blue)] uppercase tracking-wider mb-4">
            Pipeline Status
          </h2>
          <div className="space-y-2 text-sm">
            {[
              { name: "Gemma 4 (Ollama)", status: "Checking...", color: "var(--color-muted)" },
              { name: "Gemini 2.5 Flash", status: "Ready", color: "#10b981" },
              { name: "Claude Sonnet 4", status: "Ready", color: "#10b981" },
              { name: "Playwright Worker", status: "Not configured", color: "var(--color-muted)" },
            ].map((s) => (
              <div key={s.name} className="flex justify-between items-center py-1">
                <span className="text-[var(--color-muted)]">{s.name}</span>
                <span style={{ color: s.color }}>{s.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="mt-12 text-center text-xs text-[var(--color-muted)]">
        GemClaw JobSeek by ACRA Insight LLC &mdash; gemclaw.click
      </footer>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4">
      <div className="text-xs text-[var(--color-muted)] uppercase tracking-wider mb-1">{label}</div>
      <div className="text-2xl font-bold" style={{ color }}>
        {value}
      </div>
    </div>
  );
}
