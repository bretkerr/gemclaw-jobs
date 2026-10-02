import localFont from "next/font/local";

export const display = localFont({
  src: [
    { path: "./fonts/familjen-grotesk-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "./fonts/familjen-grotesk-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--poc-display",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

export const body = localFont({
  src: "./fonts/instrument-sans-latin-wght-normal.woff2",
  weight: "400 700",
  variable: "--poc-body",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

export const mono = localFont({
  src: "./fonts/jetbrains-mono-latin-wght-normal.woff2",
  weight: "400 700",
  variable: "--poc-mono",
  display: "swap",
  preload: false,
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
});
