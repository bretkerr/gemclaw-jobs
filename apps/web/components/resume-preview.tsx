"use client";

import { useState } from "react";

interface ResumePreviewProps {
  profileJson?: string;
}

export function ResumePreview({ profileJson }: ResumePreviewProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generatePreview = async () => {
    if (!profileJson) return;
    setLoading(true);
    try {
      const res = await fetch("/api/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: profileJson,
      });
      if (!res.ok) throw new Error("PDF generation failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch {
      // Silently fail for preview
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-5">
      <h2 className="text-sm font-bold uppercase tracking-wider mb-4 text-[var(--color-signal-amber)]">
        Resume Preview
      </h2>
      {!profileJson ? (
        <p className="text-sm text-[var(--color-muted)]">Import a profile to preview your resume.</p>
      ) : !pdfUrl ? (
        <button
          onClick={generatePreview}
          disabled={loading}
          className="px-4 py-2 bg-[var(--color-circuit-blue)] text-white text-sm rounded font-bold disabled:opacity-30"
        >
          {loading ? "Generating..." : "Generate Preview"}
        </button>
      ) : (
        <iframe src={pdfUrl} className="w-full h-[600px] border border-[var(--color-border)] rounded" />
      )}
    </div>
  );
}
