/* draw.js — the film. drawFrame(t) paints the frame at time t and holds no
   state between calls, so any frame can be rendered alone, in any order. */
(() => {
  const TL = window.TL;
  const SCORE = window.SCORE;
  const W = 1080;
  const H = 1920;
  const FPS = TL.fps;
  const DUR = TL.duration;
  const C = {
    bg: "#F2EDE2",
    bg2: "#E7DFCF",
    paper: "#FBF8F1",
    ink: "#161514",
    ink2: "#3A3733",
    mute: "#8C857A",
    line: "#D3C9B6",
    orange: "#E8673C",
    blue: "#3A78C2",
    amber: "#F2A81D",
    gray: "#A39C90",
  };
  const SERIF = '"Source Serif 4", serif';
  const MONO = '"IBM Plex Mono", monospace';
  const SANS = '"Inter", sans-serif';
  let X; // the 2D context being drawn into

  /* ---------- math ---------- */
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, p) => a + (b - a) * p;
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  const eOut = (p) => 1 - (1 - p) ** 3;
  const eIn = (p) => p * p * p;
  const eInOut = (p) => (p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2);
  const eBack = (p) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * (p - 1) ** 3 + c1 * (p - 1) ** 2;
  };
  function mulberry32(a) {
    return () => {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------- timeline lookups ---------- */
  const SEG = Object.fromEntries(TL.segments.map((s) => [s.id, s]));
  const ck = (id, i) => SEG[id].chunks[i].t0;
  const ckEnd = (id, i) => SEG[id].chunks[i].t1;

  function sinceKick(t) {
    const k = SCORE.KICKS;
    let lo = 0;
    let hi = k.length - 1;
    if (hi < 0 || t < k[0]) return Infinity;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (k[mid] <= t) lo = mid;
      else hi = mid - 1;
    }
    return t - k[lo];
  }
  const pulse = (t, decay = 0.12) => {
    const d = sinceKick(t);
    return d < 1 ? Math.exp(-d / decay) : 0;
  };

  /* ---------- drawing primitives ---------- */
  function alpha(a, fn) {
    if (a <= 0.001) return;
    X.save();
    X.globalAlpha *= Math.min(1, a);
    fn();
    X.restore();
  }
  function font(w, size, fam) {
    return `${w} ${size}px ${fam}`;
  }
  function setText(o) {
    X.font = font(o.w || 400, o.size || 32, o.f || SANS);
    X.fillStyle = o.c || C.ink;
    X.textAlign = o.align || "left";
    X.textBaseline = o.base || "alphabetic";
    X.letterSpacing = `${o.ls || 0}px`;
  }
  function tx(s, x, y, o = {}) {
    X.save();
    setText(o);
    if (o.a !== undefined) X.globalAlpha *= clamp(o.a);
    X.fillText(s, x, y);
    X.restore();
  }
  function tw(s, o = {}) {
    X.save();
    setText(o);
    const w = X.measureText(s).width;
    X.restore();
    return w;
  }
  function rrect(x, y, w, h, r, fill, stroke, lw = 3) {
    X.beginPath();
    X.roundRect(x, y, w, h, r);
    if (fill) {
      X.fillStyle = fill;
      X.fill();
    }
    if (stroke) {
      X.strokeStyle = stroke;
      X.lineWidth = lw;
      X.stroke();
    }
  }
  function rect(x, y, w, h, fill) {
    X.fillStyle = fill;
    X.fillRect(x, y, w, h);
  }
  function line(x1, y1, x2, y2, color, lw = 3, p = 1) {
    if (p <= 0) return;
    X.beginPath();
    X.moveTo(x1, y1);
    X.lineTo(lerp(x1, x2, p), lerp(y1, y2, p));
    X.strokeStyle = color;
    X.lineWidth = lw;
    X.lineCap = "round";
    X.stroke();
  }
  function circle(x, y, r, fill, stroke, lw = 3) {
    if (r <= 0) return;
    X.beginPath();
    X.arc(x, y, r, 0, Math.PI * 2);
    if (fill) {
      X.fillStyle = fill;
      X.fill();
    }
    if (stroke) {
      X.strokeStyle = stroke;
      X.lineWidth = lw;
      X.stroke();
    }
  }
  function poly(pts, fill, stroke, lw = 3) {
    X.beginPath();
    pts.forEach(([x, y], i) => (i ? X.lineTo(x, y) : X.moveTo(x, y)));
    X.closePath();
    if (fill) {
      X.fillStyle = fill;
      X.fill();
    }
    if (stroke) {
      X.strokeStyle = stroke;
      X.lineWidth = lw;
      X.lineJoin = "round";
      X.stroke();
    }
  }
  // stroke a path progressively (0..1) by dashing it
  function drawOn(d, build, color = C.ink, lw = 4) {
    if (d <= 0) return;
    X.save();
    X.beginPath();
    build();
    X.strokeStyle = color;
    X.lineWidth = lw;
    X.lineJoin = "round";
    X.lineCap = "round";
    const L = 2600;
    X.setLineDash([L, L]);
    X.lineDashOffset = L * (1 - d);
    X.stroke();
    X.restore();
  }
  function strike(x1, x2, y, p, color = C.orange, lw = 12) {
    line(x1, y, x2, y, color, lw, eOut(p));
  }
  function check(x, y, s, color, lw = 6, p = 1) {
    drawOn(
      p,
      () => {
        X.moveTo(x, y + s * 0.5);
        X.lineTo(x + s * 0.38, y + s * 0.88);
        X.lineTo(x + s, y + s * 0.08);
      },
      color,
      lw,
    );
  }
  function arrowDown(x, y, len, color, lw = 4) {
    line(x, y, x, y + len, color, lw);
    poly(
      [
        [x - 12, y + len - 14],
        [x + 12, y + len - 14],
        [x, y + len + 4],
      ],
      color,
    );
  }

  /* ---------- the motif: a Bauhaus composition that grows with p ---------- */
  function comp(x, y, s, p, o = {}) {
    X.save();
    X.beginPath();
    X.rect(x, y, s, s);
    X.clip();
    rect(x, y, s, s, o.bg || C.paper);
    const U = (u) => x + u * s;
    const V = (v) => y + v * s;
    const lw = Math.max(1.4, s * 0.012);
    const m = eInOut(prog(p, 0, 0.4));
    // orange circle
    alpha(0.94, () => circle(U(lerp(0.5, 0.36, m)), V(lerp(0.5, 0.34, m)), s * lerp(0.15, 0.22, m), C.orange));
    // blue half disc
    const hb = eOut(prog(p, 0.3, 0.45));
    if (hb > 0) {
      X.beginPath();
      X.arc(U(0.74), V(0.52), s * 0.15 * hb, Math.PI, Math.PI * 2);
      X.closePath();
      X.fillStyle = C.blue;
      X.fill();
    }
    // grid
    const gx = U(0.5);
    const gy = V(0.57);
    const gs = s * 0.14;
    const fills = [
      [1, 0, C.amber],
      [2, 0, C.amber],
      [1, 1, C.amber],
      [2, 1, C.amber],
      [0, 2, C.blue],
      [2, 2, C.amber],
    ];
    fills.forEach(([cx, cy, col], i) => {
      const a = prog(p, 0.6 + i * 0.04, 0.66 + i * 0.04);
      alpha(a, () => rect(gx + cx * gs, gy + cy * gs, gs, gs, col));
    });
    const gl = prog(p, 0.45, 0.6);
    if (gl > 0) {
      for (let i = 0; i <= 3; i++) {
        alpha(gl, () => {
          line(gx, gy + i * gs, gx + 3 * gs, gy + i * gs, C.ink, lw);
          line(gx + i * gs, gy, gx + i * gs, gy + 3 * gs, C.ink, lw);
        });
      }
    }
    // triangle
    const tr = eBack(prog(p, 0.78, 0.92));
    if (tr > 0) {
      const bx = U(0.24);
      const by = V(0.94);
      poly(
        [
          [bx - s * 0.13 * tr, by],
          [bx + s * 0.13 * tr, by],
          [bx, by - s * 0.22 * tr],
        ],
        C.blue,
      );
    }
    // diagonal
    line(U(0.06), V(0.94), U(0.94), V(0.06), C.ink, lw * 1.3, eOut(prog(p, 0.12, 0.3)));
    X.restore();
    if (o.border !== false) {
      X.strokeStyle = C.ink;
      X.lineWidth = o.lw || Math.max(2, s * 0.02);
      X.strokeRect(x, y, s, s);
    }
  }

  // a film frame with sprocket holes around a composition
  function filmCell(x, y, s, p, o = {}) {
    const pad = s * 0.12;
    rect(x - pad * 0.4, y - pad, s + pad * 0.8, s + pad * 2, C.ink);
    const n = 5;
    for (let i = 0; i < n; i++) {
      const hx = x + (i + 0.5) * (s / n) - s * 0.04;
      rect(hx, y - pad * 0.72, s * 0.08, pad * 0.42, o.hole || C.bg);
      rect(hx, y + s + pad * 0.3, s * 0.08, pad * 0.42, o.hole || C.bg);
    }
    comp(x, y, s, p, { border: false });
  }

  /* ---------- persistent chrome ---------- */
  const SCENES = [];
  const LABELS = {};

  function chrome(t, scene) {
    tx("CONTEXT JAMMING", 64, 104, { f: MONO, w: 700, size: 27, ls: 4 });
    const val = `${t.toFixed(3)}s`;
    const wv = tw(val, { f: MONO, w: 500, size: 30 });
    tx(val, 1016, 104, { f: MONO, w: 500, size: 30, align: "right" });
    tx("t = ", 1016 - wv, 104, { f: MONO, w: 700, size: 30, align: "right", c: C.orange });
    rect(64, 126, 952, 3, C.ink);
    if (scene) {
      const pz = 1 + pulse(t) * 0.5;
      const sq = 16 * pz;
      rect(64 + 8 - sq / 2, 172 - sq / 2, sq, sq, C.orange);
      const idx = SCENES.indexOf(scene) + 1;
      const into = prog(t, scene.t0, scene.t0 + 0.3);
      const text = `${String(idx).padStart(2, "0")} / ${scene.label}`;
      const n = Math.ceil(text.length * eOut(into));
      tx(text.slice(0, n), 92, 182, { f: MONO, w: 600, size: 25, ls: 3, c: C.ink2 });
    }
    // film-strip progress bar
    const y0 = 1748;
    const x0 = 64;
    const x1 = 1016;
    const h = 58;
    rect(x0, y0, x1 - x0, h, C.ink);
    for (let x = x0 + 10; x < x1 - 14; x += 26) {
      rect(x, y0 + 6, 13, 8, C.bg);
      rect(x, y0 + h - 14, 13, 8, C.bg);
    }
    const cw = (x1 - x0 - 16) / SCENES.length;
    SCENES.forEach((s, i) => {
      const cx = x0 + 8 + i * cw;
      const f = prog(t, s.t0, s.t1);
      rect(cx + 3, y0 + 20, cw - 6, 18, "#2E2B27");
      if (f > 0) rect(cx + 3, y0 + 20, (cw - 6) * f, 18, i % 3 === 1 ? C.blue : i % 3 === 2 ? C.amber : C.orange);
    });
    const fr = Math.min(Math.floor(t * FPS + 1e-6), DUR * FPS - 1);
    tx(`FRAME ${String(fr).padStart(4, "0")} / ${DUR * FPS}`, 64, 1858, { f: MONO, w: 600, size: 22, ls: 2, c: C.ink2 });
    tx("EVERY FRAME IS A FUNCTION", 1016, 1858, { f: MONO, w: 600, size: 22, ls: 2, c: C.ink2, align: "right" });
  }

  /* ---------- captions ---------- */
  const CAPTION_SKIP = new Set(["nope"]);
  const EMPH =
    /\d|draw\(t\)|ffmpeg|^Web$|^Audio$|judgment|sameness|program|pixel|prompt|keyframes|^After$|^Effects|one-line|^real$|^time\.$|^twice,$|^frame\.$|^cheap,$/i;
  function captions(t) {
    const seg = TL.segments.find((s) => t >= s.t0 - 0.05 && t <= s.t1 + 0.45);
    if (!seg || CAPTION_SKIP.has(seg.id)) return;
    let ci = -1;
    seg.chunks.forEach((c, i) => {
      if (t >= c.t0 - 0.05) ci = i;
    });
    if (ci < 0) return;
    const c = seg.chunks[ci];
    const pin = eOut(prog(t, c.t0 - 0.05, c.t0 + 0.09));
    const fade = 1 - prog(t, seg.t1 + 0.3, seg.t1 + 0.45);
    const words = c.cap.split(" ");
    let size = 64;
    const o = () => ({ f: SANS, w: 800, size, ls: -0.5 });
    const space = () => tw(" ", o());
    let total = words.reduce((a, w) => a + tw(w, o()), 0) + space() * (words.length - 1);
    if (total > 960) {
      size = Math.floor((size * 960) / total);
      total = words.reduce((a, w) => a + tw(w, o()), 0) + space() * (words.length - 1);
    }
    alpha(pin * fade, () => {
      X.save();
      const cy = 1590;
      X.translate(540, cy + (1 - pin) * 14);
      const sc = 0.92 + 0.08 * pin;
      X.scale(sc, sc);
      let x = -total / 2;
      for (const w of words) {
        const ww = tw(w, o());
        tx(w, x, 0, { ...o(), c: EMPH.test(w) ? C.orange : C.ink });
        x += ww + space();
      }
      X.restore();
    });
  }

  /* ================= scenes ================= */

  /* ---- 1. the viral film ---- */
  const ERA0 = 0.5;
  const ERA_D = (7.86 - ERA0) / 8;
  const ERAS = [
    {
      y: "3000 BC",
      p: "GIZA",
      draw(d) {
        alpha(d * d, () => {
          poly(
            [
              [430, 320],
              [630, 620],
              [480, 620],
            ],
            C.blue,
          );
          poly(
            [
              [690, 450],
              [800, 620],
              [715, 620],
            ],
            "#9DBBE0",
          );
        });
        drawOn(d, () => {
          X.moveTo(230, 620);
          X.lineTo(430, 320);
          X.lineTo(630, 620);
          X.moveTo(580, 620);
          X.lineTo(690, 450);
          X.lineTo(800, 620);
          X.moveTo(430, 320);
          X.lineTo(480, 620);
        });
      },
    },
    {
      y: "432 BC",
      p: "ATHENS",
      draw(d) {
        alpha(d * d, () =>
          poly(
            [
              [235, 400],
              [450, 322],
              [665, 400],
            ],
            C.amber,
          ),
        );
        drawOn(d, () => {
          X.rect(230, 590, 440, 30);
          X.rect(250, 565, 400, 25);
          for (let i = 0; i < 6; i++) X.rect(272 + i * 70, 432, 26, 133);
          X.rect(240, 400, 420, 32);
          X.moveTo(235, 400);
          X.lineTo(450, 322);
          X.lineTo(665, 400);
        });
      },
    },
    {
      y: "AD 80",
      p: "ROME",
      draw(d) {
        alpha(d * d, () => rect(110, 360, 680, 40, C.blue));
        drawOn(d, () => {
          X.rect(110, 360, 680, 40);
          for (let i = 0; i < 5; i++) {
            const x0 = 110 + i * 136;
            X.moveTo(x0 + 22, 620);
            X.lineTo(x0 + 22, 480);
            X.arc(x0 + 68, 480, 46, Math.PI, 0);
            X.lineTo(x0 + 114, 620);
          }
          X.moveTo(110, 400);
          X.lineTo(110, 620);
          X.moveTo(790, 400);
          X.lineTo(790, 620);
        });
      },
    },
    {
      y: "1163",
      p: "PARIS",
      draw(d) {
        alpha(d * d, () => {
          circle(450, 470, 36, C.amber);
          poly(
            [
              [300, 330],
              [345, 215],
              [390, 330],
            ],
            C.blue,
          );
          poly(
            [
              [510, 330],
              [555, 215],
              [600, 330],
            ],
            C.blue,
          );
        });
        drawOn(d, () => {
          X.rect(300, 330, 90, 290);
          X.rect(510, 330, 90, 290);
          X.rect(390, 400, 120, 220);
          X.moveTo(390, 400);
          X.lineTo(450, 345);
          X.lineTo(510, 400);
          X.moveTo(450 + 36, 470);
          X.arc(450, 470, 36, 0, Math.PI * 2);
          for (let k = 0; k < 4; k++) {
            const a = (k * Math.PI) / 4;
            X.moveTo(450 + Math.cos(a) * 36, 470 + Math.sin(a) * 36);
            X.lineTo(450 - Math.cos(a) * 36, 470 - Math.sin(a) * 36);
          }
          X.moveTo(420, 620);
          X.lineTo(420, 560);
          X.arc(450, 560, 30, Math.PI, 0);
          X.lineTo(480, 620);
        });
      },
    },
    {
      y: "1492",
      p: "THE ATLANTIC",
      draw(d, q) {
        const bob = Math.sin(q * 9) * 5;
        X.save();
        X.translate(0, bob);
        alpha(d * d, () => {
          poly(
            [
              [415, 320],
              [525, 320],
              [520, 440],
              [420, 440],
            ],
            C.amber,
          );
          poly(
            [
              [560, 360],
              [660, 540],
              [560, 540],
            ],
            C.blue,
          );
          poly(
            [
              [280, 560],
              [620, 560],
              [580, 610],
              [320, 610],
            ],
            C.ink2,
          );
        });
        drawOn(d, () => {
          X.moveTo(380, 560);
          X.lineTo(380, 330);
          X.moveTo(470, 560);
          X.lineTo(470, 300);
          X.moveTo(560, 560);
          X.lineTo(560, 360);
          X.rect(330, 350, 100, 100);
          X.rect(415, 320, 110, 120);
          X.moveTo(560, 360);
          X.lineTo(660, 540);
          X.lineTo(560, 540);
        });
        X.restore();
        drawOn(
          d,
          () => {
            for (let x = 100; x <= 800; x += 10) {
              const y = 622 + Math.sin(x / 30 + q * 8) * 7;
              if (x === 100) X.moveTo(x, y);
              else X.lineTo(x, y);
            }
          },
          C.blue,
          4,
        );
      },
    },
    {
      y: "1830",
      p: "MANCHESTER",
      draw(d, q) {
        alpha(d * d, () => {
          for (let i = 0; i < 5; i++) rect(250 + i * 84, 520, 34, 40, C.amber);
        });
        drawOn(d, () => {
          X.moveTo(220, 620);
          X.lineTo(220, 470);
          for (let i = 0; i < 5; i++) {
            X.lineTo(220 + i * 90 + 90, 420);
            X.lineTo(220 + i * 90 + 90, 470);
          }
          X.lineTo(670, 620);
          X.rect(560, 300, 34, 170);
          X.rect(615, 330, 30, 140);
        });
        for (let k = 0; k < 4; k++) {
          const ph = (q * 1.6 + k * 0.25) % 1;
          alpha(d * (1 - ph) * 0.8, () => {
            circle(577 + ph * 40, 290 - ph * 180, 12 + ph * 26, null, C.ink2, 3);
            circle(630 + ph * 50, 320 - ph * 160, 10 + ph * 22, null, C.ink2, 3);
          });
        }
      },
    },
    {
      y: "1969",
      p: "THE MOON",
      draw(d, q) {
        const lift = eIn(clamp(q * 1.2)) * 150;
        alpha(d, () => {
          circle(730, 190, 52, C.paper, C.ink, 4);
          circle(712, 175, 9, C.line);
          circle(745, 205, 6, C.line);
        });
        drawOn(d, () => {
          X.moveTo(360, 620);
          X.lineTo(360, 300);
          X.moveTo(390, 620);
          X.lineTo(390, 300);
          for (let y = 320; y < 620; y += 40) {
            X.moveTo(360, y);
            X.lineTo(390, y + 40);
          }
        });
        X.save();
        X.translate(0, -lift);
        alpha(d * d, () => {
          poly(
            [
              [440, 470],
              [440, 560],
              [470, 600],
              [500, 560],
              [500, 470],
            ],
            C.orange,
          );
          poly(
            [
              [440, 300],
              [470, 240],
              [500, 300],
            ],
            C.blue,
          );
        });
        drawOn(d, () => {
          X.rect(440, 300, 60, 170);
          X.moveTo(440, 300);
          X.lineTo(470, 240);
          X.lineTo(500, 300);
          X.moveTo(440, 420);
          X.lineTo(415, 470);
          X.lineTo(440, 470);
          X.moveTo(500, 420);
          X.lineTo(525, 470);
          X.lineTo(500, 470);
        });
        X.restore();
      },
    },
    {
      y: "2026",
      p: "DRAWN BY CODE",
      draw(d, q) {
        const B = [
          [150, 90, 210, 0],
          [250, 70, 300, 1],
          [330, 110, 380, 0],
          [450, 80, 260, 1],
          [540, 100, 420, 1],
          [650, 70, 230, 0],
          [730, 80, 320, 1],
        ];
        B.forEach(([x, w, h, b], i) => {
          const g = eOut(clamp(d * 1.4 - i * 0.06));
          const hh = h * g;
          alpha(0.9, () => rect(x, 620 - hh, w, hh, b ? C.blue : C.paper));
          X.strokeStyle = C.ink;
          X.lineWidth = 4;
          X.strokeRect(x, 620 - hh, w, hh);
          for (let wy = 620 - hh + 20; wy < 600; wy += 34) {
            for (let wx = x + 14; wx < x + w - 14; wx += 24) rect(wx, wy, 10, 14, b ? C.paper : C.amber);
          }
        });
        const a = prog(q, 0.25, 0.5);
        alpha(a, () => {
          rrect(560, 120, 250, 64, 10, C.ink);
          tx("draw(t)", 685, 164, { f: MONO, w: 700, size: 34, c: C.amber, align: "center" });
          line(685, 184, 600, 210, C.ink, 3);
        });
      },
    },
  ];

  function historyFilm(t) {
    // local 900 x 780 space
    rect(0, 0, 900, 780, C.paper);
    const u = prog(t, ERA0, 7.86);
    const su = clamp(u);
    // sun
    alpha(prog(t, 0.2, 0.6), () =>
      circle(130 + 640 * su, 420 - 260 * Math.sin(Math.PI * (0.1 + su * 0.8)), 46, C.orange),
    );
    // ground
    line(60, 620, 840, 620, C.ink, 5, eOut(prog(t, 0.1, 0.6)));
    const i = clamp(Math.floor((t - ERA0) / ERA_D), 0, 7);
    if (t >= ERA0) {
      const q = (t - ERA0 - i * ERA_D) / ERA_D;
      const qq = i === 7 ? (t - ERA0 - 7 * ERA_D) / ERA_D : q;
      if (i > 0) alpha(1 - prog(q, 0, 0.12), () => ERAS[i - 1].draw(1, 1));
      ERAS[i].draw(eOut(clamp(q / 0.5)), qq);
      // era label
      const la = eOut(prog(q, 0, 0.25));
      tx(ERAS[i].y, 48, 82 - (1 - la) * 20, { f: MONO, w: 700, size: 44, a: la });
      tx(ERAS[i].p, 50, 120 - (1 - la) * 20, { f: MONO, w: 600, size: 22, ls: 3, c: C.mute, a: la });
    }
    // scrubber
    line(60, 700, 840, 700, C.line, 6);
    line(60, 700, 60 + 780 * su, 700, C.ink, 6);
    for (let k = 0; k < 8; k++) {
      const x = 60 + (k * 780) / 7;
      circle(x, 700, 9, k <= i && t >= ERA0 ? C.orange : C.paper, C.ink, 3);
    }
    tx("3000 BC", 60, 748, { f: MONO, w: 600, size: 20, c: C.mute });
    tx("2026", 840, 748, { f: MONO, w: 600, size: 20, c: C.mute, align: "right" });
  }

  function sViral(t) {
    const shrink = eInOut(prog(t, 8.0, 8.55));
    const s = lerp(1, 0.6, shrink);
    const px = lerp(90, 270, shrink);
    const py = lerp(410, 236, shrink);
    // headline area (only while the film is full size)
    alpha(1 - shrink, () => {
      const a1 = eOut(prog(t, ck("hook1", 1) - 0.1, ck("hook1", 1) + 0.25)) * (1 - prog(t, ck("hook1", 3) - 0.25, ck("hook1", 3) - 0.05));
      alpha(a1, () => {
        tx("Claude Opus 5.5", 90, 320 + (1 - a1) * 20, { f: SERIF, w: 900, size: 96, ls: -2 });
        tx("SHIPPED SEPT 22, 2026", 92, 376, { f: MONO, w: 600, size: 26, ls: 3, c: C.orange });
      });
      const a2 = eOut(prog(t, ck("hook1", 3) - 0.05, ck("hook1", 3) + 0.25));
      alpha(a2, () => {
        tx("A history of the West", 90, 316 + (1 - a2) * 20, { f: SERIF, w: 900, size: 84, ls: -2 });
        tx("ONE VIDEO · ONE PROMPT-STYLE CAPTION", 92, 376, { f: MONO, w: 600, size: 26, ls: 3, c: C.orange });
      });
    });
    // the film player
    const appear = eOut(prog(t, 0, 0.45));
    X.save();
    X.translate(px, py);
    X.scale(s, s);
    alpha(appear, () => {
      X.save();
      X.beginPath();
      X.roundRect(0, 0, 900, 780, 22);
      X.clip();
      historyFilm(t);
      X.restore();
      rrect(0, 0, 900, 780, 22, null, C.ink, 6);
    });
    X.restore();
    // the caption that started it
    const qa = eOut(prog(t, ck("hook1", 4) - 0.1, ck("hook1", 4) + 0.3)) * (1 - shrink);
    alpha(qa, () => {
      tx("THE 11-WORD CAPTION THAT STARTED IT", 92, 1262, { f: MONO, w: 700, size: 22, ls: 3, c: C.orange });
      tx("“Opus 5.5 turned the history of Western", 90, 1318, { f: SERIF, w: 700, size: 44, ls: -0.5 });
      tx("civilization into a video.”", 90, 1372, { f: SERIF, w: 700, size: 44, ls: -0.5 });
    });
    // stats
    const c0 = ck("hook2", 0);
    const sa = eOut(prog(t, c0 - 0.15, c0 + 0.2));
    alpha(sa, () => {
      const n = Math.round(12000 * eOut(prog(t, c0, c0 + 0.9)));
      const done = t > c0 + 0.9;
      tx(`${n.toLocaleString("en-US")}${done ? "+" : ""}`, 540, 1000 + (1 - sa) * 30, {
        f: SERIF,
        w: 900,
        size: 196,
        ls: -4,
        c: C.orange,
        align: "center",
      });
      tx("SHARES ON X IN WEEK ONE", 540, 1062, { f: MONO, w: 600, size: 30, ls: 4, align: "center" });
    });
    const c1 = ck("hook2", 1);
    const pa = eOut(prog(t, c1 - 0.15, c1 + 0.1));
    alpha(pa, () => {
      rrect(120, 1140, 840, 120, 18, C.paper, C.ink, 4);
      const full = "› made with a prompt";
      const n = Math.round(full.length * prog(t, c1, c1 + 0.55));
      const s2 = full.slice(0, n);
      tx(s2, 160, 1216, { f: MONO, w: 600, size: 44 });
      if (Math.floor(t * 2.6) % 2 === 0 || n < full.length) {
        const w = tw(s2, { f: MONO, w: 600, size: 44 });
        rect(166 + w, 1176, 24, 50, C.orange);
      }
    });
  }

  /* ---- 2. the obvious reading ---- */
  function sQuestion(t) {
    const a1 = eOut(prog(t, ck("q", 0) - 0.1, ck("q", 0) + 0.2));
    const a2 = eOut(prog(t, ck("q", 1) - 0.1, ck("q", 1) + 0.2));
    const a3 = eOut(prog(t, ck("q", 2) - 0.08, ck("q", 2) + 0.15));
    tx("So Anthropic", 90, 660 + (1 - a1) * 30, { f: SERIF, w: 900, size: 116, ls: -3, a: a1 });
    tx("shipped a", 90, 790 + (1 - a1) * 30, { f: SERIF, w: 900, size: 116, ls: -3, a: a1 });
    tx("video model?", 90, 920 + (1 - a2) * 30, { f: SERIF, w: 900, size: 116, ls: -3, a: a2, c: C.blue });
    const nope = ck("nope", 0);
    alpha(a3, () => {
      rrect(92, 1000, 64, 64, 10, C.paper, C.ink, 5);
      if (t < nope) check(104, 1012, 40, C.ink, 7, prog(t, ck("q", 2) + 0.2, ck("q", 2) + 0.45));
      tx("right?", 184, 1050, { f: MONO, w: 600, size: 46 });
    });
    if (t >= nope) {
      const sp = prog(t, nope, nope + 0.16);
      const vw = tw("video model?", { f: SERIF, w: 900, size: 116, ls: -3 });
      strike(82, 82 + (vw + 20), 884, sp, C.ink, 16);
      line(102, 1010, 146, 1054, C.orange, 9, sp);
      line(146, 1010, 102, 1054, C.orange, 9, sp);
      const st = eBack(prog(t, nope, nope + 0.2));
      const a = prog(t, nope, nope + 0.06);
      alpha(a, () => {
        X.save();
        X.translate(560, 1300);
        X.rotate(-0.12);
        const sc = lerp(1.9, 1, st);
        X.scale(sc, sc);
        rrect(-300, -125, 600, 230, 26, "rgba(232,103,60,0.10)", C.orange, 12);
        tx("NOPE.", 0, 58, { f: SERIF, w: 900, size: 170, ls: -2, c: C.orange, align: "center" });
        X.restore();
      });
    }
  }

  /* ---- 3. the correction ---- */
  const CODE_GRID = ["function draw(t){", "  const x = f(t);", "  const y = g(t);", "  const r = h(t);", "  paint(x, y, r);", "}"];
  function glyphColor(line, i) {
    const ch = line[i];
    const kw = ["function", "const"];
    for (const k of kw) {
      const at = line.indexOf(k);
      if (at >= 0 && i >= at && i < at + k.length) return C.blue;
    }
    if (ch === "t" && (line[i - 1] === "(" || line[i + 1] === ")")) return C.orange;
    if ("(){};,=".includes(ch)) return C.mute;
    return C.ink;
  }
  function sPixel(t) {
    const t0 = 15.0;
    const COLS = 18;
    const ROWS = 13;
    const cs = 46;
    const gx = (W - COLS * cs) / 2;
    const gy = 470;
    // header
    const ha = eOut(prog(t, t0, t0 + 0.25));
    tx("PIXELS PAINTED", 90, 330, { f: MONO, w: 700, size: 30, ls: 4, a: ha });
    tx("by Claude Opus 5.5", 90, 372, { f: MONO, w: 500, size: 26, c: C.mute, a: ha });
    const bump = 1 + 0.12 * Math.exp(-Math.max(0, t - ck("pixel", 1)) / 0.15) * (t >= ck("pixel", 1) ? 1 : 0);
    X.save();
    X.translate(990, 410);
    X.scale(bump, bump);
    tx("0", 0, 0, { f: SERIF, w: 900, size: 210, c: C.orange, align: "right", a: ha });
    X.restore();
    // grid ripple
    const codeT = ck("pixel", 2);
    const fadeGrid = 1 - 0.65 * prog(t, codeT, codeT + 0.6);
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const dist = Math.hypot(c - COLS / 2 + 0.5, r - ROWS / 2 + 0.5);
        const a = prog(t, t0 + dist * 0.025, t0 + dist * 0.025 + 0.2) * fadeGrid;
        if (a <= 0) continue;
        alpha(a, () => {
          X.strokeStyle = C.line;
          X.lineWidth = 2;
          X.strokeRect(gx + c * cs + 1, gy + r * cs + 1, cs - 2, cs - 2);
        });
      }
    }
    // the cursor that never paints
    const cur = prog(t, t0 + 0.4, codeT);
    if (cur > 0 && cur < 1) {
      const cx = gx + cs * (3 + 12 * eInOut(clamp(cur * 1.6)) + Math.sin(cur * 9) * 1.5);
      const cy = gy + cs * (3 + 6 * Math.sin(cur * 3.2) + 1);
      const cc = Math.floor((cx - gx) / cs);
      const rr = Math.floor((cy - gy) / cs);
      alpha(0.9, () => {
        X.strokeStyle = C.orange;
        X.lineWidth = 4;
        X.strokeRect(gx + cc * cs + 2, gy + rr * cs + 2, cs - 4, cs - 4);
      });
      poly(
        [
          [cx, cy],
          [cx, cy + 44],
          [cx + 12, cy + 33],
          [cx + 21, cy + 52],
          [cx + 29, cy + 48],
          [cx + 20, cy + 30],
          [cx + 36, cy + 30],
        ],
        C.ink,
        C.paper,
        2,
      );
    }
    // the cells become code
    let k = 0;
    CODE_GRID.forEach((ln, row) => {
      for (let i = 0; i < ln.length; i++, k++) {
        if (ln[i] === " ") continue;
        const ap = codeT + k * 0.011;
        const a = eOut(prog(t, ap, ap + 0.12));
        if (a <= 0) continue;
        const x = gx + i * cs;
        const y = gy + (row + 3) * cs;
        alpha(a, () => {
          rect(x + 2, y + 2, cs - 4, cs - 4, "rgba(251,248,241,0.95)");
          tx(ln[i], x + cs / 2, y + cs / 2 + 12 * (2 - a) - 12 + 2, {
            f: MONO,
            w: 700,
            size: 52,
            c: glyphColor(ln, i),
            align: "center",
            base: "middle",
          });
        });
      }
    });
    // programs written: 1
    const pa = eOut(prog(t, ck("pixel", 3) - 0.1, ck("pixel", 3) + 0.2));
    tx("PROGRAMS WRITTEN", 90, 1250, { f: MONO, w: 700, size: 30, ls: 4, a: pa });
    tx("1", 990, 1300 + (1 - pa) * 30, { f: SERIF, w: 900, size: 170, c: C.blue, align: "right", a: pa });
    line(90, 1150, 990, 1150, C.ink, 3, pa);
  }

  /* ---- 4. one function ---- */
  function seekT(t) {
    const a = ck("fn", 2);
    const b = ckEnd("fn", 4) + 0.05;
    if (t < a) return t;
    if (t < b) return lerp(a, 42, eInOut(prog(t, a, a + 0.45)));
    return lerp(42, 71.5, eInOut(prog(t, b, b + 0.35)));
  }
  function sFn(t) {
    const t0 = 18.6;
    const ca = eOut(prog(t, ck("fn", 0) - 0.15, ck("fn", 0) + 0.15));
    const st = seekT(t);
    alpha(ca, () => {
      X.save();
      X.translate(540, 450);
      const sc = lerp(0.94, 1, ca);
      X.scale(sc, sc);
      X.translate(-540, -450);
      rrect(90, 250, 900, 400, 22, C.ink);
      const lines = [
        [
          ["function ", C.blue],
          ["draw", C.paper],
          ["(", C.gray],
          ["t", C.orange],
          [") {", C.gray],
        ],
        [
          ["  const ", C.blue],
          ["x = ", C.paper],
          ["f", C.amber],
          ["(t);", C.gray],
        ],
        [
          ["  const ", C.blue],
          ["y = ", C.paper],
          ["g", C.amber],
          ["(t);", C.gray],
        ],
        [
          ["  return ", C.blue],
          ["scene", C.paper],
          ["(x, y);", C.gray],
        ],
        [["}", C.gray]],
      ];
      const total = lines.reduce((a, l) => a + l.reduce((b, s) => b + s[0].length, 0), 0);
      let budget = Math.round(total * prog(t, ck("fn", 0), ck("fn", 0) + 0.55));
      lines.forEach((l, i) => {
        let x = 140;
        for (const [s, c] of l) {
          const n = Math.max(0, Math.min(s.length, budget));
          budget -= s.length;
          if (n > 0) tx(s.slice(0, n), x, 342 + i * 62, { f: MONO, w: 600, size: 42, c });
          x += tw(s, { f: MONO, w: 600, size: 42 });
        }
      });
      // highlight draw(t)
      const hl = prog(t, ck("fn", 1), ck("fn", 1) + 0.2) * (1 - prog(t, ck("fn", 2) + 0.3, ck("fn", 2) + 0.6));
      const x0 = 140 + tw("function ", { f: MONO, w: 600, size: 42 });
      const w0 = tw("draw(t)", { f: MONO, w: 600, size: 42 });
      line(x0, 360, x0 + w0, 360, C.amber, 6, hl);
      // live t tag
      const tag = `t = ${st.toFixed(3)}`;
      tx(tag, 950, 302, { f: MONO, w: 700, size: 30, c: C.amber, align: "right" });
    });
    // preview
    const pv = eOut(prog(t, t0 + 0.2, t0 + 0.6));
    alpha(pv, () => {
      const flash = Math.exp(-Math.max(0, t - ck("fn", 3)) / 0.12) * (t >= ck("fn", 3) ? 1 : 0);
      rect(285, 705, 510, 510, C.ink);
      comp(295, 715, 490, st / DUR, { border: false });
      alpha(flash * 0.8, () => rect(295, 715, 490, 490, C.paper));
      const fl = eOut(prog(t, ck("fn", 4) - 0.05, ck("fn", 4) + 0.2));
      tx("PREVIEW", 295, 1250, { f: MONO, w: 600, size: 22, ls: 3, c: C.mute, a: 1 - fl });
      alpha(fl, () => {
        const label = `frame ${Math.round(st * FPS)} = draw(${st.toFixed(1)})`;
        const lw = tw(label, { f: MONO, w: 700, size: 28 });
        rrect(540 - lw / 2 - 26, 1226, lw + 52, 50, 25, C.ink);
        tx(label, 540, 1260, { f: MONO, w: 700, size: 28, c: C.amber, align: "center" });
      });
    });
    // scrubber
    alpha(pv, () => {
      const sx0 = 120;
      const sx1 = 960;
      const sy = 1340;
      line(sx0, sy, sx1, sy, C.line, 8);
      line(sx0, sy, lerp(sx0, sx1, st / DUR), sy, C.ink, 8);
      for (let k = 0; k <= 90; k += 10) {
        const x = lerp(sx0, sx1, k / DUR);
        line(x, sy + 16, x, sy + 28, C.mute, 2);
        if (k % 30 === 0) tx(`${k}s`, x, sy + 58, { f: MONO, w: 500, size: 22, c: C.mute, align: "center" });
      }
      const hx = lerp(sx0, sx1, st / DUR);
      circle(hx, sy, 18 + pulse(t) * 4, C.orange, C.ink, 4);
    });
  }

  /* ---- 5. the pipeline ---- */
  function seqRows(t) {
    const bar = Math.floor(t / SCORE.BAR);
    const b0 = bar * SCORE.BAR;
    const rows = { KICK: [], CLAP: [], HATS: [], BASS: [], STAB: [] };
    const map = { kick: "KICK", clap: "CLAP", hat: "HATS", bass: "BASS", stab: "STAB" };
    for (const e of SCORE.EVENTS) {
      if (e.t < b0 - 0.01 || e.t >= b0 + SCORE.BAR - 0.01) continue;
      const r = map[e.type];
      if (!r) continue;
      rows[r].push({ s: Math.round((e.t - b0) / (SCORE.BAR / 16)), t: e.t });
    }
    return { rows, step: (t - b0) / (SCORE.BAR / 16) };
  }
  function stageBox(x, y, w, h, title, act, t) {
    const on = prog(t, act - 0.05, act + 0.1);
    const glow = Math.exp(-Math.max(0, t - act) / 0.35) * (t >= act ? 1 : 0);
    alpha(0.35 + 0.65 * on, () => {
      rrect(x, y, w, h, 18, C.paper, glow > 0.05 ? C.orange : C.ink, 3 + glow * 4);
      tx(title, x + 40, y + 52, { f: MONO, w: 700, size: 28, ls: 4, c: glow > 0.3 ? C.orange : C.ink });
    });
    return 0.35 + 0.65 * on;
  }
  function sPipe(t) {
    const fIdx = Math.floor(t * FPS);
    // 1. browser
    const a1 = stageBox(90, 250, 900, 320, "HEADLESS BROWSER", ck("pipe", 0), t);
    alpha(a1, () => {
      rrect(130, 330, 260, 190, 12, C.paper, C.ink, 4);
      rect(130, 330, 260, 34, C.ink);
      for (let i = 0; i < 3; i++) circle(152 + i * 22, 347, 6, C.bg);
      comp(205, 376, 110, t / DUR, { lw: 2 });
      // frames streaming out at 30 per second
      const on = t >= ck("pipe", 1) - 0.1;
      if (on) {
        for (let k = 0; k < 9; k++) {
          const ph = (t * 3 + k / 9) % 1;
          const x = 410 + ph * 330;
          alpha(Math.sin(ph * Math.PI), () => comp(x, 400, 48, ((fIdx - k * 4) / FPS) / DUR, { lw: 2 }));
        }
      }
      const ca = eOut(prog(t, ck("pipe", 1) - 0.1, ck("pipe", 1) + 0.2));
      tx("×30", 950, 440, { f: SERIF, w: 900, size: 84, c: C.orange, align: "right", a: ca });
      tx("PER SECOND", 950, 480, { f: MONO, w: 600, size: 22, ls: 3, align: "right", a: ca });
      tx(`frame ${String(fIdx).padStart(4, "0")}`, 950, 528, { f: MONO, w: 600, size: 24, c: C.mute, align: "right", a: ca });
    });
    arrowDown(540, 580, 44, C.ink);
    // 2. ffmpeg
    const a2 = stageBox(90, 640, 900, 300, "FFMPEG", ck("pipe", 2), t);
    alpha(a2, () => {
      X.save();
      X.beginPath();
      X.rect(110, 700, 640, 220);
      X.clip();
      rect(110, 730, 640, 160, C.ink);
      const off = (t * 160) % 150;
      const base = Math.floor((t * 160) / 150);
      for (let k = -1; k < 6; k++) {
        const x = 130 + k * 150 - off;
        rect(x - 10, 740, 12, 12, C.bg);
        rect(x - 10, 868, 12, 12, C.bg);
        comp(x + 15, 762, 100, (((base + k) * 0.137) % 1 + 1) % 1, { border: false });
      }
      X.restore();
      // the file
      const fa = eOut(prog(t, ck("pipe", 2), ck("pipe", 2) + 0.3));
      alpha(fa, () => {
        poly(
          [
            [790, 730],
            [910, 730],
            [950, 770],
            [950, 890],
            [790, 890],
          ],
          C.paper,
          C.ink,
          4,
        );
        poly(
          [
            [910, 730],
            [910, 770],
            [950, 770],
          ],
          C.orange,
        );
        tx(".mp4", 870, 840, { f: MONO, w: 700, size: 34, align: "center", c: C.orange });
      });
    });
    arrowDown(540, 950, 44, C.ink);
    // 3. web audio: the actual score of this film, live
    const a3 = stageBox(90, 1010, 900, 400, "WEB AUDIO", ck("pipe", 3), t);
    alpha(a3, () => {
      tx("the score of this film, live", 950, 1062, { f: MONO, w: 500, size: 22, c: C.mute, align: "right" });
      const { rows, step } = seqRows(t);
      const names = Object.keys(rows);
      const x0 = 260;
      const cw = 42;
      names.forEach((name, r) => {
        const y = 1100 + r * 58;
        tx(name, 130, y + 34, { f: MONO, w: 700, size: 22, ls: 2, c: C.ink2 });
        for (let s = 0; s < 16; s++) {
          const hit = rows[name].find((e) => e.s === s);
          const x = x0 + s * cw;
          let fill = s % 4 === 0 ? C.bg2 : C.bg;
          if (hit) {
            const since = t - hit.t;
            const flash = since >= 0 ? Math.exp(-since / 0.15) : 0;
            fill = flash > 0.2 ? C.orange : [C.ink, C.blue, C.gray, C.amber, C.blue][r];
          }
          rrect(x, y, cw - 6, 46, 6, fill);
        }
      });
      const px = x0 + step * cw - 3;
      rect(px, 1092, 4, 5 * 58 + 4, C.orange);
    });
  }

  /* ---- 6. determinism ---- */
  function strip(y, t, label) {
    tx(label, 90, y - 22, { f: MONO, w: 700, size: 28, ls: 4 });
    rect(0, y, W, 230, C.ink);
    for (let x = -((t * 220) % 40); x < W; x += 40) {
      rect(x + 10, y + 10, 18, 12, C.bg);
      rect(x + 10, y + 208, 18, 12, C.bg);
    }
    const off = (t - 30.7) * 220;
    const out = [];
    for (let k = 0; k < 8; k++) {
      const idx = Math.floor(off / 200) + k;
      const x = 60 + idx * 200 - off;
      if (x < -200 || x > W) continue;
      const fr = 900 + idx * 19;
      comp(x, y + 30, 160, (((idx * 0.137 + 0.05) % 1) + 1) % 1, { border: false });
      tx(String(fr).padStart(4, "0"), x + 80, y + 204, { f: MONO, w: 600, size: 16, c: C.paper, align: "center", base: "bottom" });
      out.push({ x, fr });
    }
    return out;
  }
  function sTwice(t) {
    const a = eOut(prog(t, 30.7, 31.0));
    alpha(a, () => {
      const r1 = strip(470, t, "RUN 1");
      strip(900, t, "RUN 2");
      const eq = prog(t, ck("twice", 1) - 0.05, ck("twice", 1) + 0.25);
      r1.forEach((f, i) => {
        const ap = eOut(clamp(eq * 3 - i * 0.25));
        tx("=", f.x + 80, 806, { f: MONO, w: 700, size: 64, c: C.orange, align: "center", a: ap });
      });
      const ff = prog(t, ck("twice", 2) - 0.05, ck("twice", 2) + 0.2);
      if (ff > 0) {
        const pick = r1.find((f) => f.x > 380 && f.x < 640) || r1[2];
        if (pick) {
          alpha(ff, () => {
            X.strokeStyle = C.orange;
            X.lineWidth = 8;
            X.strokeRect(pick.x - 8, 470 + 22, 176, 176);
            X.strokeRect(pick.x - 8, 900 + 22, 176, 176);
          });
        }
      }
      const pa = eOut(prog(t, ck("twice", 2) + 0.2, ck("twice", 2) + 0.45));
      alpha(pa, () => {
        rrect(240, 1230, 600, 110, 55, C.ink);
        tx("pixel diff: 0", 540, 1302, { f: MONO, w: 700, size: 44, c: C.amber, align: "center" });
      });
    });
  }

  /* ---- 7. why now ---- */
  function pill(x, y, label, o = {}) {
    const size = o.size || 46;
    const w = tw(label, { f: MONO, w: 700, size }) + 64;
    rrect(x, y, w, size * 2.1, size * 1.05, o.fill || null, o.stroke || null, 4);
    tx(label, x + 32, y + size * 1.42, { f: MONO, w: 700, size, c: o.c || C.ink });
    return w;
  }
  function sWhy(t) {
    const out = eInOut(prog(t, 38.7, 39.0));
    alpha(1 - out, () => {
      X.save();
      X.translate(0, -80 * out);
      const a0 = eOut(prog(t, ck("why", 0) - 0.1, ck("why", 0) + 0.2));
      tx("Why now?", 90, 550 + (1 - a0) * 30, { f: SERIF, w: 900, size: 160, ls: -4, a: a0 });
      const a1 = eOut(prog(t, ck("why", 1) - 0.1, ck("why", 1) + 0.2));
      alpha(a1, () => pill(90, 670, "a motion graphic", { stroke: C.ink }));
      const a2 = eOut(prog(t, ck("why", 2) - 0.1, ck("why", 2) + 0.2));
      tx("=", 120, 870, { f: MONO, w: 700, size: 70, a: a2 });
      alpha(a2, () => pill(90, 910, "an agentic coding task", { fill: C.blue, c: C.paper }));
      const a3 = eOut(prog(t, ck("why", 3) - 0.1, ck("why", 3) + 0.2));
      tx("+", 120, 1110, { f: MONO, w: 700, size: 70, a: a3 });
      alpha(a3, () => pill(90, 1150, "with a visual test", { fill: C.orange, c: C.paper }));
      X.restore();
    });
    if (t < 38.75) return;
    const b = eOut(prog(t, 38.8, 39.15));
    alpha(b, () => {
      // preview frame with one element out of place until it is debugged
      const fix = eBack(prog(t, ck("hold", 2) + 0.45, ck("hold", 2) + 0.75));
      const off = (1 - fix) * 30;
      rect(290, 250, 500, 500, C.ink);
      X.save();
      X.beginPath();
      X.rect(298, 258, 484, 484);
      X.clip();
      comp(298, 258, 484, 0.62, { border: false });
      // the misplaced grid copy
      const gx = 298 + 484 * 0.5;
      const gy = 258 + 484 * 0.57;
      const gs = 484 * 0.14;
      rect(gx, gy, gs * 3, gs * 3, C.paper);
      X.translate(off, -off * 0.6);
      for (let i = 0; i <= 3; i++) {
        line(gx, gy + i * gs, gx + 3 * gs, gy + i * gs, C.ink, 5);
        line(gx + i * gs, gy, gx + i * gs, gy + 3 * gs, C.ink, 5);
      }
      rect(gx + gs + 3, gy + 3, gs * 2 - 6, gs - 6, C.amber);
      X.restore();
      const dbg = prog(t, ck("hold", 2) - 0.05, ck("hold", 2) + 0.15);
      alpha(dbg * (1 - fix), () => {
        X.save();
        X.setLineDash([12, 8]);
        X.strokeStyle = C.orange;
        X.lineWidth = 4;
        X.strokeRect(gx + off - 10, gy - off * 0.6 - 10, gs * 3 + 20, gs * 3 + 20);
        X.restore();
        tx("off by 30px", 780, 238, { f: MONO, w: 700, size: 26, c: C.orange, align: "right" });
      });
      alpha(prog(t, ck("hold", 2) + 0.7, ck("hold", 2) + 0.85), () =>
        tx("✓ aligned", 780, 238, { f: MONO, w: 700, size: 26, c: C.blue, align: "right" }),
      );
      // timeline of tracks
      const tl = eOut(prog(t, ck("hold", 0) - 0.1, ck("hold", 0) + 0.3));
      const ty = 820;
      const tracks = 9;
      const rh = 42;
      alpha(tl, () => {
        rrect(90, ty, 900, 70 + tracks * rh, 14, C.paper, C.ink, 3);
        for (let k = 0; k <= 16; k++) {
          const x = 130 + k * 52;
          line(x, ty + 16, x, ty + (k % 4 === 0 ? 40 : 30), C.mute, 2);
        }
        const rnd = mulberry32(7);
        const sync = eOut(prog(t, ck("hold", 1), ck("hold", 1) + 0.5));
        const beats = [];
        for (let k = 0; k <= 16; k += 2) beats.push(130 + k * 52);
        alpha(sync, () => {
          for (const bx of beats) {
            X.save();
            X.setLineDash([6, 6]);
            line(bx, ty + 48, bx, ty + 60 + tracks * rh, C.orange, 2);
            X.restore();
          }
        });
        const cols = [C.ink2, C.blue, C.orange, C.amber, C.gray];
        for (let r = 0; r < tracks; r++) {
          let x = 130 + rnd() * 30;
          const y = ty + 60 + r * rh;
          while (x < 940) {
            const w = 60 + rnd() * 160;
            const target = beats.reduce((a, bx) => (Math.abs(bx - x) < Math.abs(a - x) ? bx : a), beats[0]);
            const xx = lerp(x, target, sync);
            const appear = prog(t, ck("hold", 0) + r * 0.05, ck("hold", 0) + r * 0.05 + 0.2);
            alpha(appear, () => rrect(xx, y + 6, Math.min(w, 966 - xx), rh - 12, 6, cols[(r + Math.floor(x)) % 5]));
            x += w + 20 + rnd() * 40;
          }
        }
        const ph = 130 + (((t - 39.0) / 5.6) % 1) * 832;
        line(ph, ty + 12, ph, ty + 60 + tracks * rh, C.orange, 4);
        poly(
          [
            [ph - 10, ty + 8],
            [ph + 10, ty + 8],
            [ph, ty + 22],
          ],
          C.orange,
        );
      });
      const c1 = eOut(prog(t, ck("hold", 3) - 0.05, ck("hold", 3) + 0.15));
      const c2 = eBack(prog(t, ck("hold", 3) + 0.45, ck("hold", 3) + 0.7));
      alpha(c1, () => pill(90, 1330, "✓ compiles", { stroke: C.mute, c: C.mute, size: 36 }));
      const w1 = tw("✓ compiles", { f: MONO, w: 700, size: 36 }) + 64;
      const w2 = tw("✓ looks right", { f: MONO, w: 700, size: 36 }) + 64;
      alpha(clamp(c2 * 2), () => {
        X.save();
        X.translate(90 + w1 + 24 + w2 / 2, 1368);
        X.scale(lerp(0.6, 1, c2), lerp(0.6, 1, c2));
        pill(-w2 / 2, -38, "✓ looks right", { fill: C.orange, c: C.paper, size: 36 });
        X.restore();
      });
    });
  }

  /* ---- 8. Terminal-Bench 4.0 ---- */
  function sBench(t) {
    const a = eOut(prog(t, 44.8, 45.1));
    const x0 = 90;
    const scale = 860 / 80;
    alpha(a, () => {
      tx("TERMINAL-BENCH 4.0", 90, 330, { f: MONO, w: 700, size: 36, ls: 4 });
      tx("long-horizon command-line work · % of tasks", 90, 374, { f: MONO, w: 500, size: 24, c: C.mute });
      for (let v = 0; v <= 80; v += 20) {
        const x = x0 + v * scale;
        line(x, 450, x, 1060, C.line, 2);
        tx(String(v), x, 1098, { f: MONO, w: 500, size: 22, c: C.mute, align: "center" });
      }
    });
    const bars = [
      { name: "Opus 5", v: 52.3, c: C.gray, at: ck("bench", 0) },
      { name: "Fable 5.1", v: 55.8, c: C.blue, at: ck("bench", 0) + 0.2 },
      { name: "Opus 5.5", v: 66.4, c: C.orange, at: ck("bench", 1) - 0.1 },
    ];
    bars.forEach((b, i) => {
      const y = 470 + i * 200;
      const g = eOut(prog(t, b.at, b.at + 0.8));
      alpha(prog(t, b.at - 0.1, b.at + 0.1), () => {
        tx(b.name, x0, y + 8, { f: MONO, w: 700, size: 32, c: i === 2 ? C.orange : C.ink });
        rect(x0, y + 24, b.v * scale * g, 110, b.c);
        tx((b.v * g).toFixed(1), x0 + b.v * scale * g + 18, y + 106, { f: SERIF, w: 900, size: 64, c: i === 2 ? C.orange : C.ink });
      });
    });
    const d = prog(t, ck("bench", 3) - 0.05, ck("bench", 3) + 0.35);
    if (d > 0) {
      const xa = x0 + 52.3 * scale;
      const xb = x0 + 66.4 * scale;
      X.save();
      X.setLineDash([8, 8]);
      line(xa, 600, xa, 1150, C.ink, 3, eOut(d));
      line(xb, 1000, xb, 1150, C.ink, 3, eOut(d));
      X.restore();
      line(xa, 1150, xb, 1150, C.amber, 8, eOut(prog(d, 0.4, 1)));
      const la = eOut(prog(d, 0.5, 1));
      tx("+14.1", (xa + xb) / 2, 1270, { f: SERIF, w: 900, size: 104, c: C.amber, align: "center", a: la });
      tx("POINTS IN ONE RELEASE", (xa + xb) / 2, 1318, { f: MONO, w: 700, size: 22, ls: 3, align: "center", a: prog(t, ck("bench", 4), ck("bench", 4) + 0.2) });
    }
    tx("Scores as reported at launch, Sept 22, 2026.", 90, 1420, { f: MONO, w: 500, size: 20, c: C.mute, a: a });
  }

  /* ---- 9. economics and the recipe ---- */
  function sEcon(t) {
    const out = eInOut(prog(t, 57.3, 57.6));
    alpha(1 - out, () => {
      X.save();
      X.translate(0, -60 * out);
      const a1 = eOut(prog(t, ck("econ", 0) - 0.15, ck("econ", 0) + 0.2));
      alpha(a1, () => {
        rrect(90, 250, 900, 470, 22, C.paper, C.ink, 4);
        tx("A SHORT EXPLAINER, BEFORE", 130, 312, { f: MONO, w: 700, size: 26, ls: 3, c: C.mute });
        tx("3–4 weeks", 130, 450, { f: SERIF, w: 900, size: 132, ls: -3 });
        const m = eOut(prog(t, ck("econ", 1), ck("econ", 1) + 0.7));
        tx(`$${Math.round(8000 * m).toLocaleString("en-US")}–$${Math.round(10000 * m).toLocaleString("en-US")}`, 130, 530, {
          f: MONO,
          w: 700,
          size: 44,
        });
        tx("of motion-team time", 130, 576, { f: MONO, w: 500, size: 26, c: C.mute });
        for (let i = 0; i < 20; i++) {
          const fill = prog(t, ck("econ", 1) + i * 0.035, ck("econ", 1) + i * 0.035 + 0.05);
          const x = 130 + i * 41;
          rrect(x, 620, 33, 52, 5, fill > 0.5 ? C.ink : C.bg2);
        }
      });
      const a2 = eOut(prog(t, ck("econ", 2) - 0.15, ck("econ", 2) + 0.2));
      alpha(a2, () => {
        X.save();
        X.translate(0, (1 - a2) * 40);
        rrect(90, 770, 900, 470, 22, C.ink);
        tx("WITH OPUS 5.5", 130, 832, { f: MONO, w: 700, size: 26, ls: 3, c: C.amber });
        tx("~15 min", 130, 1000, { f: SERIF, w: 900, size: 124, ls: -3, c: C.paper });
        tx("prompt → film", 130, 1080, { f: MONO, w: 600, size: 32, c: C.gray });
        const sw = eOut(prog(t, ck("econ", 3) - 0.1, ck("econ", 3) + 0.8));
        circle(860, 985, 100, null, C.paper, 6);
        X.beginPath();
        X.moveTo(860, 985);
        X.arc(860, 985, 88, -Math.PI / 2, -Math.PI / 2 + Math.PI * 0.5 * sw);
        X.closePath();
        X.fillStyle = C.orange;
        X.fill();
        rect(846, 867, 28, 16, C.paper);
        tx(`${Math.round(15 * sw)}:00`, 860, 1140, { f: MONO, w: 700, size: 30, c: C.paper, align: "center" });
        X.restore();
      });
      X.restore();
    });
    if (t < 57.3) return;
    // the recipe
    const r0 = ck("recipe", 0);
    const r1 = ck("recipe", 1);
    const k1 = eOut(prog(t, r0 - 0.1, r0 + 0.15));
    alpha(k1, () => {
      tx("KEYFRAMES", 90, 318, { f: MONO, w: 700, size: 34, ls: 3 });
      line(420, 306, 990, 306, C.line, 3);
      for (let i = 0; i < 7; i++) {
        const x = 450 + i * 88;
        poly(
          [
            [x, 286],
            [x + 18, 306],
            [x, 326],
            [x - 18, 306],
          ],
          C.ink,
        );
      }
      strike(80, 1000, 306, prog(t, r0 + 0.5, r0 + 0.75), C.orange, 8);
    });
    const k2 = eOut(prog(t, r1 - 0.1, r1 + 0.15));
    alpha(k2, () => {
      tx("AFTER EFFECTS", 90, 438, { f: MONO, w: 700, size: 34, ls: 3 });
      for (let i = 0; i < 4; i++) rrect(450 + i * 30, 398 + i * 12, 300, 16, 4, [C.blue, C.amber, C.gray, C.orange][i]);
      strike(80, 1000, 428, prog(t, r1 + 0.55, r1 + 0.8), C.orange, 8);
    });
    // name the states
    const s0 = ck("recipe", 2);
    const P = [0.04, 0.55, 1];
    const NAMES = ["“dot”", "“grid”", "“composition”"];
    P.forEach((p, i) => {
      const a = eBack(prog(t, s0 + i * 0.18, s0 + i * 0.18 + 0.3));
      if (a <= 0) return;
      const x = 110 + i * 310;
      X.save();
      X.translate(x + 120, 700);
      X.scale(clamp(a, 0, 1.2), clamp(a, 0, 1.2));
      comp(-120, -120, 240, p, { lw: 5 });
      X.restore();
      tx(`STATE ${i + 1}`, x, 860, { f: MONO, w: 700, size: 24, ls: 3, a: clamp(a) });
      tx(NAMES[i], x, 898, { f: MONO, w: 500, size: 26, c: C.mute, a: clamp(a) });
    });
    // everything in between
    const b0 = ck("recipe", 3);
    const n = 9;
    for (let k = 0; k < n; k++) {
      const a = eOut(prog(t, b0 + k * 0.1, b0 + k * 0.1 + 0.2));
      if (a <= 0) continue;
      const x = 70 + k * 106;
      alpha(a, () => {
        rect(x - 4, 990, 104, 160, C.ink);
        comp(x + 4, 1020, 88, k / (n - 1), { border: false });
        tx(String(k + 1).padStart(2, "0"), x + 48, 1138, { f: MONO, w: 600, size: 16, c: C.paper, align: "center" });
      });
    }
    const la = eOut(prog(t, ck("recipe", 4) - 0.05, ck("recipe", 4) + 0.2));
    alpha(la, () => {
      tx("YOU: NAME THE STATES · JUDGE THE RESULT", 90, 1250, { f: MONO, w: 700, size: 26, ls: 2, c: C.ink });
      tx("MODEL: EVERY FRAME IN BETWEEN", 90, 1296, { f: MONO, w: 700, size: 26, ls: 2, c: C.orange });
    });
  }

  /* ---- 10. code vs. diffusion ---- */
  const GLITCH = { S: "5", T: "7", O: "0", E: "3", W: "VV", H: "#", R: "P", Y: "V", I: "l" };
  function sDiff(t) {
    const a = eOut(prog(t, 63.5, 63.85));
    const rnd = mulberry32(Math.floor(t * 6));
    alpha(a, () => {
      ["DIFFUSION", "CODE"].forEach((name, side) => {
        const x = side ? 555 : 70;
        rrect(x, 250, 455, 590, 18, C.paper, C.ink, 3);
        tx(name, x + 30, 298, { f: MONO, w: 700, size: 28, ls: 4, c: side ? C.orange : C.mute });
        // type
        const words = ["HISTORY OF", "THE WEST"];
        words.forEach((wd, li) => {
          let cx = x + 30;
          const cy = 380 + li * 58;
          for (const ch of wd) {
            let g = ch;
            let dx = 0;
            let dy = 0;
            let rot = 0;
            if (!side) {
              if (GLITCH[ch] && rnd() < 0.35) g = GLITCH[ch];
              dx = Math.sin(t * 7 + cx * 0.05) * 3;
              dy = Math.cos(t * 5 + cx * 0.08) * 4;
              rot = Math.sin(t * 3 + cx) * 0.06;
            }
            X.save();
            X.translate(cx + dx, cy + dy);
            X.rotate(rot);
            if (!side) X.filter = "blur(1.2px)";
            tx(g, 0, 0, { f: SERIF, w: 900, size: 50 });
            X.restore();
            cx += tw(ch, { f: SERIF, w: 900, size: 50 });
          }
        });
        // chart
        const vals = [12, 28, 45, 66];
        vals.forEach((v, i) => {
          const bx = x + 50 + i * 95;
          let h = v * 4.2;
          let lab = String(v);
          if (!side) {
            h *= 1 + Math.sin(t * 4 + i * 2) * 0.12;
            lab = ["1Z", "2B", "4S", "6b"][i];
          }
          X.save();
          if (!side) X.filter = "blur(1px)";
          rect(bx, 800 - h, 60, h, [C.gray, C.blue, C.amber, C.orange][i]);
          tx(lab, bx + 30, 800 - h - 14, { f: MONO, w: 700, size: 26, align: "center" });
          X.restore();
        });
      });
      // highlights
      const h1 = prog(t, ck("diff", 1) - 0.05, ck("diff", 1) + 0.15);
      const h2 = prog(t, ck("diff", 2) - 0.05, ck("diff", 2) + 0.15);
      X.save();
      X.setLineDash([12, 8]);
      alpha(h1 * (1 - h2 * 0.6), () => {
        X.strokeStyle = C.orange;
        X.lineWidth = 4;
        X.strokeRect(575, 330, 415, 130);
      });
      alpha(h2, () => {
        X.strokeStyle = C.orange;
        X.lineWidth = 4;
        X.strokeRect(575, 500, 415, 320);
      });
      X.restore();
      alpha(h1, () => tx("✓ real type", 990, 238, { f: MONO, w: 700, size: 24, c: C.orange, align: "right" }));
      alpha(h2, () => tx("✓ real numbers", 760, 238, { f: MONO, w: 700, size: 24, c: C.orange, align: "right" }));
    });
    // the 6px fix
    const d0 = ck("diff", 3);
    const da = eOut(prog(t, d0 - 0.15, d0 + 0.2));
    alpha(da, () => {
      rrect(70, 880, 455, 420, 18, C.paper, C.ink, 3);
      tx("PREVIEW ×8", 100, 926, { f: MONO, w: 700, size: 22, ls: 3, c: C.mute });
      const mv = eInOut(prog(t, d0 + 0.6, d0 + 1.1));
      const lx = 330 - 48 * mv;
      X.save();
      X.setLineDash([8, 6]);
      circle(330, 1080, 70, null, C.gray, 3);
      X.restore();
      circle(lx, 1080, 70, C.orange);
      poly(
        [
          [lx - 40, 1160],
          [lx + 40, 1160],
          [lx, 1100],
        ],
        C.blue,
      );
      tx("CJ", lx, 1092, { f: SANS, w: 900, size: 44, c: C.paper, align: "center" });
      alpha(mv, () => {
        line(lx - 70, 1200, 260, 1200, C.ink, 3);
        line(lx - 70, 1188, lx - 70, 1212, C.ink, 3);
        line(260, 1188, 260, 1212, C.ink, 3);
        tx("6px", (lx - 70 + 260) / 2, 1252, { f: MONO, w: 700, size: 34, align: "center", c: C.orange });
      });
      rrect(555, 880, 455, 420, 18, C.ink);
      tx("scene.js", 585, 928, { f: MONO, w: 600, size: 24, c: C.gray });
      const dl = prog(t, d0 + 0.3, d0 + 0.5);
      alpha(dl, () => {
        rect(575, 980, 415, 64, "rgba(232,103,60,0.28)");
        tx("- logo.x = 540;", 590, 1022, { f: MONO, w: 600, size: 32, c: C.paper });
        rect(575, 1056, 415, 64, "rgba(58,120,194,0.40)");
        tx("+ logo.x = 534;", 590, 1098, { f: MONO, w: 600, size: 32, c: C.paper });
        tx("  render(0…90)", 590, 1174, { f: MONO, w: 500, size: 30, c: C.gray });
      });
    });
    const pa = eOut(prog(t, ck("diff", 4) - 0.05, ck("diff", 4) + 0.2));
    alpha(pa, () => {
      rrect(170, 1336, 740, 92, 46, C.amber);
      tx("1 line changed · nothing else moves", 540, 1396, { f: MONO, w: 700, size: 30, align: "center" });
    });
  }

  /* ---- 11. the catch ---- */
  function showreelTile(x, y, w, h, t) {
    const g = X.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, "#7B5CFF");
    g.addColorStop(1, "#FF5CA8");
    rrect(x, y, w, h, 10, g);
    const ph = (t * 0.7) % 1;
    alpha(clamp(ph * 3) * (1 - clamp((ph - 0.8) * 5)), () =>
      tx("YOUR BRAND", x + w / 2, y + h / 2 + 6, { f: SANS, w: 800, size: Math.round(w * 0.12), c: "#FFFFFF", align: "center" }),
    );
    alpha(clamp((ph - 0.5) * 4), () => circle(x + w / 2, y + h * 0.8, w * 0.05, "#FFFFFF"));
  }
  function sCatch(t) {
    const out = eInOut(prog(t, 75.1, 75.4));
    alpha(1 - out, () => {
      const a0 = eOut(prog(t, ck("catch", 0) - 0.1, ck("catch", 0) + 0.2));
      tx("The catch?", 90, 400 + (1 - a0) * 30, { f: SERIF, w: 900, size: 136, ls: -3, a: a0 });
      const a1 = eOut(prog(t, ck("catch", 1) - 0.1, ck("catch", 1) + 0.2));
      tx("centered text · gradient · fade-in · logo", 90, 470, { f: MONO, w: 500, size: 25, c: C.mute, a: a1 });
      const cols = 5;
      const rows = 5;
      const tw0 = 172;
      const th = 172;
      const gap = 18;
      const gx = (W - (cols * tw0 + (cols - 1) * gap)) / 2;
      const gy = 520;
      const s2 = ck("catch", 2);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const center = r === 2 && c === 2;
          const d = Math.hypot(r - 2, c - 2);
          const at = center ? ck("catch", 1) : s2 + d * 0.09;
          const a = eBack(prog(t, at, at + 0.25));
          if (a <= 0) continue;
          const x = gx + c * (tw0 + gap);
          const y = gy + r * (th + gap);
          X.save();
          X.translate(x + tw0 / 2, y + th / 2);
          X.scale(a, a);
          showreelTile(-tw0 / 2, -th / 2, tw0, th, t);
          X.restore();
        }
      }
    });
    if (t < 75.1) return;
    const b = eOut(prog(t, 75.3, 75.6));
    alpha(b, () => {
      // the widening gap
      const cx0 = 130;
      const cx1 = 970;
      const cy0 = 860;
      const cy1 = 300;
      line(cx0, cy0, cx1, cy0, C.ink, 4);
      line(cx0, cy0, cx0, cy1, C.ink, 4);
      tx("agent capability →", cx1, cy0 + 40, { f: MONO, w: 500, size: 22, c: C.mute, align: "right" });
      const g = prog(t, ck("judg", 0) - 0.1, ck("judg", 0) + 1.6);
      const out = (u) => cy0 - 40 - (Math.exp(u * 3.2) - 1) / (Math.exp(3.2) - 1) * 500;
      const hum = (u) => cy0 - 40 - u * 50;
      const N = 80;
      const gp = prog(t, ck("judg", 1), ck("judg", 1) + 0.5);
      alpha(gp * 0.5, () => {
        X.beginPath();
        for (let i = 0; i <= N; i++) {
          const u = (i / N) * g;
          const x = lerp(cx0, cx1, u);
          i ? X.lineTo(x, out(u)) : X.moveTo(x, out(u));
        }
        for (let i = N; i >= 0; i--) {
          const u = (i / N) * g;
          X.lineTo(lerp(cx0, cx1, u), hum(u));
        }
        X.closePath();
        X.fillStyle = C.amber;
        X.fill();
      });
      for (const [fn, col, lw] of [
        [out, C.orange, 8],
        [hum, C.ink, 6],
      ]) {
        X.beginPath();
        for (let i = 0; i <= N; i++) {
          const u = (i / N) * g;
          const x = lerp(cx0, cx1, u);
          i ? X.lineTo(x, fn(u)) : X.moveTo(x, fn(u));
        }
        X.strokeStyle = col;
        X.lineWidth = lw;
        X.lineCap = "round";
        X.stroke();
      }
      tx("MACHINE OUTPUT", lerp(cx0, cx1, g) - 10, Math.max(330, out(g) + 10), {
        f: MONO,
        w: 700,
        size: 24,
        c: C.orange,
        align: "right",
        a: prog(g, 0.6, 0.8),
      });
      tx("HUMAN REVIEW", lerp(cx0, cx1, g) - 10, hum(g) + 44, { f: MONO, w: 700, size: 24, align: "right", a: prog(g, 0.6, 0.8) });
      tx("THE GAP", 850, 672, { f: MONO, w: 700, size: 34, ls: 4, c: "#B07400", align: "center", a: gp });
      // the scarce input
      const s0 = ck("judg", 2);
      tx("THE SCARCE INPUT ISN’T", 90, 1000, { f: MONO, w: 700, size: 30, ls: 3, a: prog(t, s0 - 0.1, s0 + 0.15) });
      const p1 = ck("judg", 3);
      const pa = eOut(prog(t, p1 - 0.1, p1 + 0.15));
      tx("production.", 90, 1130 + (1 - pa) * 20, { f: SERIF, w: 900, size: 116, ls: -3, a: pa, c: C.ink2 });
      const pw = tw("production.", { f: SERIF, w: 900, size: 116, ls: -3 });
      strike(80, 100 + pw, 1094, prog(t, p1 + 0.35, p1 + 0.55));
      const j = ck("judg", 4);
      const ja = eBack(prog(t, j - 0.05, j + 0.25));
      alpha(clamp(ja * 2), () => {
        X.save();
        X.translate(90, 1300);
        const sc = lerp(0.7, 1, clamp(ja, 0, 1.2));
        X.scale(sc, sc);
        tx("It’s judgment.", 0, 0, { f: SERIF, w: 900, size: 132, ls: -3, c: C.orange });
        X.restore();
      });
      tx("TASTE · ATTENTION · SIGN-OFF", 92, 1370, { f: MONO, w: 600, size: 24, ls: 3, c: C.mute, a: prog(t, j + 0.5, j + 0.8) });
    });
  }

  /* ---- 12. this film ---- */
  const THUMB_T = [3.2, 6.6, 9.9, 13.2, 14.6, 17.9, 21.4, 27.5, 32.9, 37.6, 42.2, 49.8, 56.0, 62.4, 70.2, 80.6];
  const thumbs = new Map();
  let thumbCanvas = null;
  function thumb(tt) {
    if (thumbs.has(tt)) return thumbs.get(tt);
    if (!thumbCanvas) {
      thumbCanvas = document.createElement("canvas");
      thumbCanvas.width = W;
      thumbCanvas.height = H;
    }
    const prev = X;
    X = thumbCanvas.getContext("2d");
    frame(tt, { grain: false });
    X = prev;
    const c = document.createElement("canvas");
    c.width = 432;
    c.height = 768;
    const cx = c.getContext("2d");
    cx.imageSmoothingQuality = "high";
    cx.drawImage(thumbCanvas, 0, 0, 432, 768);
    thumbs.set(tt, c);
    return c;
  }
  function endCard(t) {
    const e0 = 86.55;
    const a = eOut(prog(t, e0, e0 + 0.4));
    alpha(a, () => {
      rect(0, 140, W, 1590, C.bg);
      comp(370, 280, 340, prog(t, e0, e0 + 1.6), { lw: 6 });
      tx("CONTEXT JAMMING · ACRA INSIGHT", 540, 760, { f: MONO, w: 700, size: 26, ls: 4, align: "center", c: C.ink2 });
      const ta = eOut(prog(t, e0 + 0.15, e0 + 0.55));
      tx("Every Frame", 540, 900 + (1 - ta) * 30, { f: SERIF, w: 900, size: 132, ls: -4, align: "center", a: ta });
      tx("Is a Function.", 540, 1030 + (1 - ta) * 30, { f: SERIF, w: 900, size: 132, ls: -4, align: "center", a: ta, c: C.orange });
      const ra = eOut(prog(t, e0 + 0.5, e0 + 0.9));
      alpha(ra, () => {
        rrect(150, 1110, 780, 96, 48, C.ink);
        tx("Read it → bretkerr.substack.com", 540, 1171, { f: MONO, w: 700, size: 32, c: C.paper, align: "center" });
      });
      const ca = prog(t, e0 + 0.9, e0 + 1.3);
      tx("This film: one draw(t) · 2,700 frames · a Web Audio score · ffmpeg", 540, 1330, {
        f: MONO,
        w: 500,
        size: 21,
        c: C.mute,
        align: "center",
        a: ca,
      });
      tx("Voice: Kokoro-82M, an open-weight TTS model · no video model involved", 540, 1366, {
        f: MONO,
        w: 500,
        size: 21,
        c: C.mute,
        align: "center",
        a: ca,
      });
    });
  }
  function sOutro(t) {
    const cols = 4;
    const tw0 = 216;
    const th = 384;
    const gap = 20;
    const gx = (W - (cols * tw0 + (cols - 1) * gap)) / 2;
    const gy = 236;
    const recipe = ck("outro", 1);
    const dim = prog(t, recipe - 0.1, recipe + 0.2);
    THUMB_T.slice(0, 12).forEach((tt, i) => {
      const r = Math.floor(i / cols);
      const c = i % cols;
      const at = 82.5 + i * 0.06;
      const a = eOut(prog(t, at, at + 0.25));
      if (a <= 0) return;
      const x = gx + c * (tw0 + gap);
      const y = gy + r * (th + gap) + (1 - a) * 40;
      alpha(a, () => {
        X.drawImage(thumb(tt), x, y, tw0, th);
        X.strokeStyle = C.ink;
        X.lineWidth = 3;
        X.strokeRect(x, y, tw0, th);
        const lab = prog(t, ck("outro", 2) + i * 0.04, ck("outro", 2) + i * 0.04 + 0.15) > 0.5 ? `draw(${tt.toFixed(1)})` : `t = ${tt.toFixed(1)}`;
        const lw = tw(lab, { f: MONO, w: 700, size: 20 }) + 20;
        rect(x, y + th - 38, lw, 38, C.ink);
        tx(lab, x + 10, y + th - 12, { f: MONO, w: 700, size: 20, c: C.amber });
      });
    });
    alpha(dim * 0.55, () => rect(0, 220, W, 1260, C.bg));
    alpha(dim, () => {
      const sc = lerp(0.85, 1, eBack(dim));
      X.save();
      X.translate(540, 820);
      X.scale(sc, sc);
      rrect(-420, -110, 840, 220, 24, C.ink);
      const parts = [
        ["frame = ", C.paper],
        ["draw", C.amber],
        ["(", C.gray],
        ["t", C.orange],
        [")", C.gray],
      ];
      const total = parts.reduce((a, [s]) => a + tw(s, { f: MONO, w: 700, size: 76 }), 0);
      let x = -total / 2;
      for (const [s, c] of parts) {
        tx(s, x, 26, { f: MONO, w: 700, size: 76, c });
        x += tw(s, { f: MONO, w: 700, size: 76 });
      }
      X.restore();
    });
    const fa = eOut(prog(t, ck("outro", 3) - 0.05, ck("outro", 3) + 0.2));
    alpha(fa, () => {
      rrect(190, 980, 700, 90, 45, C.orange);
      tx("2,700 frames · 1 function", 540, 1038, { f: MONO, w: 700, size: 34, c: C.paper, align: "center" });
    });
    endCard(t);
  }

  /* ---------- scene table ---------- */
  SCENES.push(
    { id: "viral", label: "WEEK ONE ON X", t0: 0, t1: 11.4, draw: sViral },
    { id: "question", label: "THE OBVIOUS READING", t0: 11.4, t1: 15.0, draw: sQuestion, hardOut: true },
    { id: "pixel", label: "THE CORRECTION", t0: 15.0, t1: 18.6, draw: sPixel },
    { id: "fn", label: "ONE FUNCTION", t0: 18.6, t1: 23.9, draw: sFn },
    { id: "pipe", label: "THE PIPELINE", t0: 23.9, t1: 30.7, draw: sPipe },
    { id: "twice", label: "RUN IT TWICE", t0: 30.7, t1: 34.0, draw: sTwice },
    { id: "why", label: "WHY NOW", t0: 34.0, t1: 44.8, draw: sWhy },
    { id: "bench", label: "THE NUMBERS", t0: 44.8, t1: 52.25, draw: sBench },
    { id: "econ", label: "THE ECONOMICS", t0: 52.25, t1: 63.5, draw: sEcon },
    { id: "diff", label: "CODE VS. DIFFUSION", t0: 63.5, t1: 71.25, draw: sDiff },
    { id: "catch", label: "THE CATCH", t0: 71.25, t1: 82.5, draw: sCatch, hardOut: true },
    { id: "outro", label: "THIS FILM", t0: 82.5, t1: 90.0, draw: sOutro },
  );
  for (const s of SCENES) LABELS[s.id] = s.label;
  const FLASHES = [
    [SCORE.DROP1, C.orange, 0.9],
    [SCORE.BREAK, C.ink, 0.35],
    [SCORE.DROP2, C.orange, 0.9],
  ];

  /* ---------- paper grain, generated once from a seed ---------- */
  let grain = null;
  function makeGrain() {
    const c = document.createElement("canvas");
    c.width = 540;
    c.height = 960;
    const g = c.getContext("2d");
    const img = g.createImageData(540, 960);
    const rnd = mulberry32(99);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 128 + (rnd() - 0.5) * 90;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return c;
  }

  /* ---------- draw(t) ---------- */
  function frame(t, opts = {}) {
    X.save();
    X.setTransform(1, 0, 0, 1, 0, 0);
    rect(0, 0, W, H, C.bg);
    const cur = SCENES.find((s) => t >= s.t0 && t < s.t1) || SCENES[SCENES.length - 1];
    const idx = SCENES.indexOf(cur);
    const prev = SCENES[idx - 1];
    // stage, with a subtle bump on every kick
    X.save();
    const bump = 1 + pulse(t, 0.1) * 0.004;
    X.translate(540, 840);
    X.scale(bump, bump);
    X.translate(-540, -840);
    if (prev && !prev.hardOut && t < cur.t0 + 0.3) {
      const p = eInOut(prog(t, cur.t0, cur.t0 + 0.3));
      alpha(1 - p, () => {
        X.save();
        X.translate(0, -70 * p);
        prev.draw(Math.min(t, prev.t1 + 0.3));
        X.restore();
      });
    }
    cur.draw(t);
    X.restore();
    // glitch at the tape stop
    if (t >= SCORE.CUT && t < SCORE.CUT + 0.16) {
      const rnd = mulberry32(Math.floor(t * FPS));
      for (let i = 0; i < 7; i++) {
        const y = 300 + rnd() * 1100;
        const h = 20 + rnd() * 70;
        const dx = (rnd() - 0.5) * 80;
        X.drawImage(X.canvas, 0, y, W, h, dx, y, W, h);
      }
    }
    captions(t);
    chrome(t, cur);
    for (const [ft, col, peak] of FLASHES) {
      if (t >= ft && t < ft + 0.3) alpha(peak * (1 - prog(t, ft, ft + 0.3)), () => rect(0, 0, W, H, col));
    }
    if (opts.grain !== false) {
      if (!grain) grain = makeGrain();
      X.globalCompositeOperation = "multiply";
      X.globalAlpha = 0.07;
      X.drawImage(grain, 0, 0, W, H);
    }
    X.restore();
  }

  window.drawFrame = (t, ctx) => {
    X = ctx || document.getElementById("c").getContext("2d");
    frame(t);
  };
  window.FILM = { W, H, FPS, DUR, SCENES };
})();
