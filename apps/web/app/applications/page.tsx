export default function ApplicationsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Application Tracker</h1>

      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-8 text-center">
        <p className="text-[var(--color-muted)] text-sm mb-4">No applications tracked yet.</p>
        <p className="text-xs text-[var(--color-muted)]">
          Use the CLI to apply: <code className="text-[var(--color-signal-amber)]">jobseek apply --board anthropic --job 12345</code>
        </p>
      </div>
    </div>
  );
}
