"use client";

import { useState } from "react";

interface Job {
  id: number;
  title: string;
  location: string;
  departments: string[];
  absoluteUrl: string;
}

export default function JobsPage() {
  const [boardToken, setBoardToken] = useState("");
  const [keyword, setKeyword] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const discover = async () => {
    if (!boardToken.trim()) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ board: boardToken });
      if (keyword) params.set("keyword", keyword);
      const res = await fetch(`/api/jobs?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch jobs");
      setJobs(data.jobs);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Job Discovery</h1>

      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-5 mb-6">
        <div className="flex gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Board token (e.g. anthropic)"
            value={boardToken}
            onChange={(e) => setBoardToken(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && discover()}
            className="flex-1 min-w-[200px] px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-signal-amber)]"
          />
          <input
            type="text"
            placeholder="Keyword filter (optional)"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && discover()}
            className="flex-1 min-w-[150px] px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-signal-amber)]"
          />
          <button
            onClick={discover}
            disabled={loading || !boardToken.trim()}
            className="px-4 py-2 bg-[var(--color-signal-amber)] text-black font-bold text-sm rounded disabled:opacity-30"
          >
            {loading ? "Searching..." : "Discover"}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 mb-4 bg-red-900/20 border border-red-500/30 rounded text-red-400 text-sm">{error}</div>
      )}

      {jobs.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-[var(--color-muted)]">{jobs.length} jobs found</p>
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4 hover:border-[var(--color-signal-amber)] transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{job.title}</h3>
                  <p className="text-sm text-[var(--color-muted)] mt-1">
                    {job.location} &mdash; {job.departments.join(", ")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={job.absoluteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[var(--color-circuit-blue)] hover:underline"
                  >
                    View
                  </a>
                  <button className="text-xs text-[var(--color-signal-amber)] hover:underline">Apply</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
