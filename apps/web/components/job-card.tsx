interface JobCardProps {
  id: number;
  title: string;
  location: string;
  departments: string[];
  absoluteUrl: string;
  fitScore?: number;
  onApply?: (jobId: number) => void;
}

export function JobCard({ id, title, location, departments, absoluteUrl, fitScore, onApply }: JobCardProps) {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4 hover:border-[var(--color-signal-amber)] transition-colors">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-semibold text-[var(--color-text)]">{title}</h3>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            {location} &mdash; {departments.join(", ")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {fitScore !== undefined && (
            <span
              className="text-xs font-bold px-2 py-1 rounded"
              style={{
                color: fitScore >= 70 ? "#10b981" : fitScore >= 50 ? "var(--color-signal-amber)" : "#ef4444",
                background: fitScore >= 70 ? "#10b98115" : fitScore >= 50 ? "#F5A62315" : "#ef444415",
              }}
            >
              {fitScore}%
            </span>
          )}
          <a
            href={absoluteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[var(--color-circuit-blue)] hover:underline"
          >
            View
          </a>
          {onApply && (
            <button
              onClick={() => onApply(id)}
              className="text-xs text-[var(--color-signal-amber)] hover:underline font-semibold"
            >
              Apply
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
