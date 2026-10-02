import { ImageResponse } from "next/og";

export const alt =
  "Make Zenity's GTM its own first customer. A GTM AI Engineer work sample by Bret Kerr.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#0b0d14";
const PAPER = "#f3f1ea";
const MUTED = "rgba(243, 241, 234, 0.6)";
const ACCENT = "#8c7cff";

const VERDICTS = [
  { label: "ALLOW", style: { border: `2px solid ${PAPER}`, color: PAPER } },
  { label: "MODIFY", style: { border: `2px dashed ${PAPER}`, color: PAPER } },
  { label: "BLOCK", style: { background: PAPER, color: INK, border: `2px solid ${PAPER}` } },
  {
    label: "DECLINE",
    style: {
      borderLeft: `8px solid ${PAPER}`,
      borderTop: `2px solid ${MUTED}`,
      borderRight: `2px solid ${MUTED}`,
      borderBottom: `2px solid ${MUTED}`,
      color: PAPER,
    },
  },
];

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: INK,
        color: PAPER,
        padding: "64px 72px",
      }}
    >
      <div style={{ display: "flex", fontSize: 24, letterSpacing: 4, color: MUTED }}>
        WORK SAMPLE · GTM AI ENGINEER · ZENITY
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <div
          style={{
            display: "flex",
            fontSize: 82,
            fontWeight: 700,
            lineHeight: 1.02,
            letterSpacing: -2,
            maxWidth: 1000,
          }}
        >
          Make Zenity&rsquo;s GTM its own first customer.
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          {VERDICTS.map((v) => (
            <div
              key={v.label}
              style={{
                display: "flex",
                padding: "10px 18px",
                fontSize: 22,
                letterSpacing: 3,
                borderRadius: 6,
                ...v.style,
              }}
            >
              {v.label}
            </div>
          ))}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          fontSize: 28,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", fontWeight: 700 }}>Bret Kerr</div>
          <div style={{ display: "flex", color: MUTED, fontSize: 24 }}>
            10 years in cybersecurity GTM · agents propose, gates dispose
          </div>
        </div>
        <div
          style={{ display: "flex", width: 120, height: 8, background: ACCENT, borderRadius: 4 }}
        />
      </div>
    </div>,
    size,
  );
}
