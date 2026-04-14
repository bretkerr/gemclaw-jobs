import type { ApplicationStatus } from "@repo/core";

const statusColors: Record<ApplicationStatus, string> = {
  discovered: "var(--color-muted)",
  matched: "var(--color-circuit-blue)",
  tailoring: "var(--color-signal-amber)",
  reviewing: "#8b5cf6",
  ready: "#22d3ee",
  submitted: "#10b981",
  rejected: "#ef4444",
  interview: "#10b981",
  error: "#ef4444",
};

interface ApplicationStatusBadgeProps {
  status: ApplicationStatus;
}

export function ApplicationStatusBadge({ status }: ApplicationStatusBadgeProps) {
  return (
    <span
      className="text-xs font-bold px-2 py-1 rounded uppercase tracking-wider"
      style={{
        color: statusColors[status],
        background: `${statusColors[status]}15`,
      }}
    >
      {status}
    </span>
  );
}
