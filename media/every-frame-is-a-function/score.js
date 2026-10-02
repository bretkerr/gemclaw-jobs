/* score.js — the soundtrack, synthesized with Web Audio in an OfflineAudioContext.
   128 BPM UK-garage two-step in F minor: swung hats, 2-step kicks, organ stabs,
   a sub bass, formant-synth vocal chops, a tape stop and two drops.
   Every event comes from one bar grid, so draw(t) reads the same kick times
   the audio plays. Seeded randomness only: two renders are bit-identical. */
(() => {
  const TL = window.TL;
  const BPM = 128;
  const BEAT = 60 / BPM;
  const BAR = BEAT * 4;
  const STEP = BEAT / 4;
  const SWING = 0.026;
  const SR = 48000;
  const DUR = TL.duration;

  const CUT = TL.cut; // tape stop right after "...right?"
  const DROP1 = 8 * BAR; // 15.0 s
  const B_START = 22 * BAR; // 41.25 s
  const BREAK = 38 * BAR; // 71.25 s
  const GAP2 = 43 * BAR + 2 * BEAT; // 82.03 s, one beat of silence
  const DROP2 = 44 * BAR; // 82.5 s
  const END = 47 * BAR; // 88.125 s

  const at = (bar, step = 0) => bar * BAR + step * STEP + (step % 2 === 1 ? SWING : 0);
  const hz = (m) => 440 * 2 ** ((m - 69) / 12);
  const silent = (t) => (t >= CUT - 1e-6 && t < DROP1 - 0.01) || (t >= GAP2 && t < DROP2 - 0.01);

  function mulberry32(a) {
    return () => {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function section(bar) {
    if (bar < 6) return "intro";
    if (bar < 8) return "build";
    if (bar < 22) return "dropA";
    if (bar < 38) return "dropB";
    if (bar < 42) return "break";
    if (bar < 44) return "build2";
    if (bar < 47) return "final";
    return "end";
  }

  // F minor: i – VI – VII – v, rootless voicings with smooth voice leading.
  const CHORDS = [
    { root: 41, notes: [56, 60, 63, 67] }, // Fm9
    { root: 37, notes: [56, 60, 63, 65] }, // Dbmaj9
    { root: 39, notes: [55, 58, 60, 65] }, // Eb6/9
    { root: 36, notes: [55, 58, 63, 65] }, // Cm7(11)
  ];
  const BASS = [
    [0, 3, 0],
    [3, 1, 12],
    [6, 2, 0],
    [10, 3, 0],
    [14, 1, 12],
  ];
  const STABS = [3, 6, 11, 14];
  const CHOP_RHYTHM = [
    [0, 2, "a"],
    [3, 1, "o"],
    [6, 2, "a"],
    [10, 1, "e"],
    [12, 3, "a"],
  ];
  const CHOP_NOTES = [
    [72, 75, 77, 75, 72],
    [68, 72, 75, 72, 68],
    [70, 72, 75, 77, 75],
    [67, 70, 72, 75, 79],
  ];
  const WHOOSH_AT = ["fn", "pipe", "twice", "why", "bench", "econ", "recipe", "diff", "judg"];

  /* ---------- arrangement: pure data, shared with the visuals ---------- */
  function buildEvents() {
    const rnd = mulberry32(1337);
    const hum = (v, amt = 0.12) => v * (1 - amt / 2 + rnd() * amt);
    const ev = [];
    const push = (e) => {
      if (!silent(e.t)) ev.push(e);
    };
    for (let bar = 0; bar < 48; bar++) {
      const sec = section(bar);
      const t0 = bar * BAR;
      const ch = CHORDS[bar % 4];
      const groove = sec === "dropA" || sec === "dropB" || sec === "final";

      // pad
      if (sec === "intro" || sec === "build") {
        const c0 = 420 + (bar / 8) * 2400;
        push({ type: "pad", t: t0, dur: BAR, notes: ch.notes, vel: 0.11, c0, c1: c0 + 300 });
      } else if (groove) {
        push({ type: "pad", t: t0, dur: BAR, notes: ch.notes, vel: 0.05, c0: 1400, c1: 1400 });
      } else if (sec === "break" || sec === "build2") {
        const c0 = sec === "break" ? 1600 : 1900 + (bar - 42) * 1600;
        push({ type: "pad", t: t0, dur: BAR, notes: ch.notes, vel: 0.12, c0, c1: c0 + 1200 });
      } else if (sec === "end") {
        push({ type: "pad", t: t0, dur: DUR - t0 - 0.4, notes: CHORDS[0].notes, vel: 0.12, c0: 2600, c1: 900 });
      }

      // kicks
      if (sec === "build") {
        for (const s of [0, 4, 8, 12]) push({ type: "kick", t: at(bar, s), vel: 0.75, muffled: 1 - (bar - 6) * 0.4 });
      } else if (sec === "build2") {
        for (const s of [0, 4, 8, 12]) push({ type: "kick", t: at(bar, s), vel: 0.7, muffled: 1 - (bar - 42) * 0.45 });
      } else if (groove) {
        const steps = bar % 4 === 3 ? [0, 7, 10] : [0, 10];
        for (const s of steps) push({ type: "kick", t: at(bar, s), vel: s === 0 ? 0.95 : 0.85, muffled: 0 });
      } else if (sec === "end") {
        push({ type: "kick", t: t0, vel: 0.95, muffled: 0 });
      }

      // claps, ghost snares, fills and rolls
      if (groove) {
        for (const s of [4, 12]) push({ type: "clap", t: at(bar, s), vel: hum(0.5, 0.06) });
        if (sec !== "dropA" && bar % 2 === 1) push({ type: "clap", t: at(bar, 15), vel: 0.12 });
        if (bar === 17 || bar === 21 || bar === 29 || bar === 37 || bar === 46) {
          for (const s of [13, 14, 15]) push({ type: "clap", t: at(bar, s), vel: 0.22 + (s - 13) * 0.08 });
        }
      }
      if (sec === "build" || sec === "build2") {
        const first = bar === 6 || bar === 42;
        const steps = first ? [0, 2, 4, 6, 8, 10, 12, 14] : [...Array(16).keys()];
        for (const s of steps) {
          const p = (bar % 2) * 0.5 + s / 32;
          push({ type: "clap", t: at(bar, s), vel: 0.1 + p * 0.3 });
        }
      }

      // hats
      if (sec === "intro" && bar >= 2) {
        for (let s = 0; s < 16; s += 2) push({ type: "hat", t: at(bar, s), vel: hum(s % 4 === 2 ? 0.09 : 0.05) });
      } else if (groove || sec === "build" || sec === "build2") {
        const acc = [0.16, 0.06, 0.11, 0.07];
        for (let s = 0; s < 16; s++) push({ type: "hat", t: at(bar, s), vel: hum(acc[s % 4]) });
        if (sec === "dropB" || sec === "final") {
          for (const s of [2, 6, 10, 14]) push({ type: "ohat", t: at(bar, s), vel: hum(0.07) });
        }
        if (groove) for (let s = 1; s < 16; s += 2) push({ type: "shaker", t: at(bar, s), vel: hum(0.05) });
      } else if (sec === "break") {
        for (let s = 2; s < 16; s += 4) push({ type: "hat", t: at(bar, s), vel: hum(0.04) });
      }

      // bass
      if (groove) {
        for (const [s, len, tr] of BASS) {
          push({ type: "bass", t: at(bar, s), dur: len * STEP * 0.92, midi: ch.root + tr, vel: s === 0 ? 0.5 : 0.36 });
        }
      } else if (bar >= 4 && (sec === "intro" || sec === "build")) {
        push({ type: "bass", t: t0, dur: BAR * 0.95, midi: ch.root, vel: 0.3, sub: true });
      }

      // organ stabs
      if (groove) {
        for (const s of STABS) push({ type: "stab", t: at(bar, s), notes: ch.notes, vel: hum(0.075, 0.1) });
      } else if (sec === "end") {
        push({ type: "stab", t: t0, notes: CHORDS[0].notes, vel: 0.11, len: 0.9 });
      }

      // vocal chops
      const notes = CHOP_NOTES[bar % 4];
      if (sec === "dropB" || sec === "final") {
        CHOP_RHYTHM.forEach(([s, len, v], i) => {
          push({ type: "chop", t: at(bar, s), dur: len * STEP * 0.9, midi: notes[i], vowel: v, vel: 0.2, wet: 0.25 });
        });
      } else if ((sec === "intro" && bar >= 4) || sec === "break") {
        CHOP_RHYTHM.slice(0, 2).forEach(([s, len, v], i) => {
          push({ type: "chop", t: at(bar, s), dur: len * STEP * 1.6, midi: notes[i], vowel: v, vel: 0.12, wet: 0.7 });
        });
      } else if (sec === "end") {
        push({ type: "chop", t: t0, dur: BEAT * 1.5, midi: 72, vowel: "a", vel: 0.2, wet: 0.8 });
      }

      // electric piano in the breakdown
      if (sec === "break" || sec === "build2") {
        for (const s of [0, 10]) push({ type: "rhodes", t: at(bar, s), notes: ch.notes, vel: s ? 0.05 : 0.07 });
      }
    }

    // transitions and effects
    ev.push({ type: "riser", t: 6 * BAR, t1: CUT, vel: 0.12 });
    ev.push({ type: "riser", t: 21 * BAR, t1: B_START, vel: 0.06 });
    ev.push({ type: "riser", t: 42 * BAR, t1: GAP2, vel: 0.12 });
    ev.push({ type: "reverse", t: GAP2 - 1.2, t1: GAP2, vel: 0.1 });
    for (const t of [DROP1, BREAK, DROP2, END]) ev.push({ type: "impact", t, vel: t === BREAK ? 0.5 : 0.8 });
    ev.push({ type: "crash", t: B_START, vel: 0.25 });
    for (const seg of TL.segments) {
      if (WHOOSH_AT.includes(seg.id)) ev.push({ type: "whoosh", t: seg.t0 - 0.12, vel: 0.08 });
    }
    ev.sort((a, b) => a.t - b.t);
    return ev;
  }

  const EVENTS = buildEvents();
  const KICKS = EVENTS.filter((e) => e.type === "kick" && !e.muffled).map((e) => e.t);
  const CLAPS = EVENTS.filter((e) => e.type === "clap" && e.vel > 0.3).map((e) => e.t);

  /* ---------- rendering ---------- */
  async function render() {
    const ctx = new OfflineAudioContext(2, Math.round(SR * DUR), SR);
    const rnd = mulberry32(42);

    const gainNode = (v = 1) => {
      const g = ctx.createGain();
      g.gain.value = v;
      return g;
    };
    const biquad = (type, freq, q = 0.707, g = 0) => {
      const f = ctx.createBiquadFilter();
      f.type = type;
      f.frequency.value = freq;
      f.Q.value = q;
      f.gain.value = g;
      return f;
    };
    const panner = (p) => {
      const n = ctx.createStereoPanner();
      n.pan.value = p;
      return n;
    };
    const osc = (type, f) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = f;
      return o;
    };
    const shaper = (drive) => {
      const ws = ctx.createWaveShaper();
      const n = 2048;
      const curve = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const x = (i / (n - 1)) * 2 - 1;
        curve[i] = Math.tanh(x * drive) / Math.tanh(drive);
      }
      ws.curve = curve;
      ws.oversample = "2x";
      return ws;
    };

    // noise sources
    const noiseBuf = ctx.createBuffer(1, SR * 2, SR);
    {
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = rnd() * 2 - 1;
    }
    const noise = (t, dur, loop = false) => {
      const s = ctx.createBufferSource();
      s.buffer = noiseBuf;
      if (loop) {
        s.loop = true;
        s.start(t, rnd() * 1.5);
        s.stop(t + dur);
      } else {
        s.start(t, rnd() * (2 - dur - 0.02), dur + 0.01);
      }
      return s;
    };

    // buses
    const cutGain = gainNode(1);
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.knee.value = 6;
    comp.ratio.value = 3;
    comp.attack.value = 0.006;
    comp.release.value = 0.16;
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -3;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.001;
    limiter.release.value = 0.08;
    cutGain.connect(comp).connect(limiter).connect(ctx.destination);

    const drums = gainNode(1);
    drums.connect(cutGain);
    const duck = gainNode(1);
    duck.connect(cutGain);
    const music = gainNode(1);
    music.connect(duck);
    const fx = gainNode(1);
    fx.connect(cutGain);

    // reverb with a generated impulse response
    const ir = ctx.createBuffer(2, Math.round(SR * 3.2), SR);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      let lp = 0;
      for (let i = 0; i < d.length; i++) {
        const tt = i / SR;
        const k = 0.5 + 0.45 * Math.min(1, tt / 2.5);
        lp = lp * k + (rnd() * 2 - 1) * (1 - k);
        d[i] = (tt < 0.018 ? 0 : lp * 2.2) * Math.exp(-tt / 0.75);
      }
    }
    const verb = ctx.createConvolver();
    verb.buffer = ir;
    const verbIn = gainNode(1);
    const verbOut = gainNode(0.55);
    verbIn.connect(biquad("highpass", 250)).connect(verb).connect(verbOut).connect(duck);

    // ping-pong dotted-eighth delay
    const dIn = gainNode(1);
    const dL = ctx.createDelay(2);
    const dR = ctx.createDelay(2);
    dL.delayTime.value = BEAT * 0.75;
    dR.delayTime.value = BEAT * 0.75;
    const fb = gainNode(0.36);
    const dLp = biquad("lowpass", 3000);
    dIn.connect(dL);
    dL.connect(dR);
    dR.connect(dLp).connect(fb).connect(dL);
    const merger = ctx.createChannelMerger(2);
    dL.connect(merger, 0, 0);
    dR.connect(merger, 0, 1);
    merger.connect(gainNode(0.5)).connect(duck);

    const send = (node, amt, bus) => {
      if (amt > 0) node.connect(gainNode(amt)).connect(bus);
    };

    // tape stop for tonal voices that ring across the cut
    const tapeStop = (param, t, end) => {
      if (t < CUT && end > CUT) {
        param.setValueAtTime(0, CUT);
        param.linearRampToValueAtTime(-2400, CUT + 0.42);
      }
    };

    // master automation: the cut, the pre-drop gap
    cutGain.gain.setValueAtTime(1, CUT);
    cutGain.gain.linearRampToValueAtTime(0, CUT + 0.42);
    cutGain.gain.setValueAtTime(1, DROP1 - 0.004);
    cutGain.gain.setValueAtTime(1, GAP2 - 0.025);
    cutGain.gain.linearRampToValueAtTime(0, GAP2);
    cutGain.gain.setValueAtTime(1, DROP2 - 0.004);
    cutGain.gain.setValueAtTime(1, DUR - 1.6);
    cutGain.gain.linearRampToValueAtTime(0, DUR - 0.05);

    // sidechain pump on everything tonal
    for (const k of KICKS) {
      duck.gain.setValueAtTime(0.42, k);
      duck.gain.linearRampToValueAtTime(1, k + 0.24);
    }

    // vinyl crackle bed
    {
      const buf = ctx.createBuffer(2, SR * 3, SR);
      for (let c = 0; c < 2; c++) {
        const d = buf.getChannelData(c);
        for (let i = 0; i < d.length; i++) {
          d[i] = (rnd() * 2 - 1) * 0.02;
          if (rnd() < 0.00035) {
            const a = (0.3 + rnd() * 0.7) * (rnd() < 0.5 ? -1 : 1);
            for (let j = 0; j < 12 && i + j < d.length; j++) d[i + j] += a * Math.exp(-j / 2.5);
          }
        }
      }
      const s = ctx.createBufferSource();
      s.buffer = buf;
      s.loop = true;
      const g = gainNode(0);
      s.connect(biquad("highpass", 900)).connect(biquad("lowpass", 6500)).connect(g).connect(cutGain);
      const lvl = [
        [0, 0.22],
        [DROP1, 0.08],
        [BREAK, 0.2],
        [DROP2, 0.08],
        [END, 0.18],
      ];
      for (const [t, v] of lvl) g.gain.setValueAtTime(v, t);
      s.start(0);
    }

    /* ---- instruments ---- */
    function kick(e) {
      const { t, vel, muffled } = e;
      const o = osc("sine", 165);
      o.frequency.setValueAtTime(165, t);
      o.frequency.exponentialRampToValueAtTime(54, t + 0.085);
      o.frequency.exponentialRampToValueAtTime(43, t + 0.4);
      const g = gainNode(0);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vel, t + 0.004);
      g.gain.setTargetAtTime(0, t + 0.07, 0.12);
      let out = o.connect(shaper(1.8)).connect(g);
      if (muffled > 0) out = out.connect(biquad("lowpass", 140 + (1 - muffled) * 2500, 0.8));
      out.connect(drums);
      o.start(t);
      o.stop(t + 0.75);
      if (!muffled) {
        const n = noise(t, 0.014);
        const ng = gainNode(0);
        ng.gain.setValueAtTime(vel * 0.22, t);
        ng.gain.exponentialRampToValueAtTime(0.001, t + 0.014);
        n.connect(biquad("highpass", 2800)).connect(ng).connect(drums);
      }
    }

    function clap(e) {
      const { t, vel } = e;
      const n = noise(t, 0.32);
      const g = gainNode(0);
      for (const dt of [0, 0.01, 0.021]) {
        g.gain.setValueAtTime(vel, t + dt);
        g.gain.exponentialRampToValueAtTime(vel * 0.18, t + dt + 0.0085);
      }
      g.gain.setValueAtTime(vel * 0.85, t + 0.031);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
      const out = n.connect(biquad("bandpass", 1300, 1.1)).connect(biquad("highpass", 480)).connect(g);
      out.connect(panner((rnd() - 0.5) * 0.2)).connect(drums);
      send(g, 0.22, verbIn);
      const b = osc("triangle", 190);
      const bg = gainNode(0);
      bg.gain.setValueAtTime(vel * 0.4, t);
      bg.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
      b.connect(bg).connect(drums);
      b.start(t);
      b.stop(t + 0.1);
    }

    function hat(e, open) {
      const { t, vel } = e;
      const len = open ? 0.22 : 0.042;
      const n = noise(t, len + 0.02);
      const g = gainNode(0);
      g.gain.setValueAtTime(vel, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + len);
      n.connect(biquad("highpass", open ? 6800 : 8200, 0.9))
        .connect(biquad("peaking", 11000, 1, 4))
        .connect(g)
        .connect(panner(open ? 0.25 : -0.15 + rnd() * 0.1))
        .connect(drums);
      if (open) send(g, 0.15, verbIn);
    }

    function shakerHit(e) {
      const { t, vel } = e;
      const n = noise(t, 0.09);
      const g = gainNode(0);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vel, t + 0.014);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.075);
      n.connect(biquad("bandpass", 5600, 1.4)).connect(g).connect(panner(0.35)).connect(drums);
    }

    function crash(t, vel) {
      const g = gainNode(0);
      g.gain.setValueAtTime(vel, t);
      g.gain.setTargetAtTime(0, t + 0.02, 0.55);
      const hp = biquad("highpass", 5200);
      noise(t, 2.6, true).connect(hp);
      for (const f of [205.3, 304.4, 369.6, 522.7, 540, 800]) {
        const o = osc("square", f * 2.1);
        o.connect(gainNode(0.08)).connect(hp);
        o.start(t);
        o.stop(t + 2.6);
      }
      hp.connect(g).connect(drums);
      send(g, 0.4, verbIn);
    }

    function pad(e) {
      const { t, dur, notes, vel, c0, c1 } = e;
      const end = t + dur + 0.7;
      const f = biquad("lowpass", c0, 0.6);
      f.frequency.setValueAtTime(c0, t);
      f.frequency.linearRampToValueAtTime(c1, t + dur);
      const g = gainNode(0);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vel, t + 0.3);
      g.gain.setValueAtTime(vel, t + dur - 0.02);
      g.gain.linearRampToValueAtTime(0, end);
      f.connect(g).connect(music);
      send(g, 0.6, verbIn);
      notes.forEach((m, i) => {
        for (const d of [-9, 9]) {
          const o = osc("sawtooth", hz(m));
          o.detune.value = d;
          tapeStop(o.detune, t, end);
          o.connect(panner((i / 3 - 0.5) * 0.7 * Math.sign(d))).connect(f);
          o.start(t);
          o.stop(end);
        }
      });
    }

    function stab(e) {
      const { t, notes, vel } = e;
      const len = e.len || 0.15;
      const f = biquad("lowpass", 4200, 1.3);
      f.frequency.setValueAtTime(4200, t);
      f.frequency.exponentialRampToValueAtTime(650, t + 0.13 + len * 0.3);
      const g = gainNode(0);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vel, t + 0.004);
      g.gain.setTargetAtTime(0, t + len * 0.45, len * 0.35);
      f.connect(g).connect(music);
      send(g, 0.16, dIn);
      send(g, 0.22, verbIn);
      for (const m of notes) {
        for (const [type, d] of [
          ["square", 0],
          ["sawtooth", 7],
        ]) {
          const o = osc(type, hz(m));
          o.detune.value = d;
          o.connect(f);
          o.start(t);
          o.stop(t + len * 3 + 0.1);
        }
      }
    }

    function bass(e) {
      const { t, dur, midi, vel } = e;
      const end = t + dur + 0.05;
      const g = gainNode(0);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vel, t + 0.006);
      g.gain.setValueAtTime(vel, t + dur);
      g.gain.linearRampToValueAtTime(0, end);
      const sh = shaper(2.2);
      sh.connect(g).connect(music);
      const sub = osc("sine", hz(midi - 12 * (midi > 44 ? 2 : 1)));
      sub.connect(gainNode(0.85)).connect(sh);
      tapeStop(sub.detune, t, end);
      sub.start(t);
      sub.stop(end);
      if (!e.sub) {
        const body = osc("sawtooth", hz(midi));
        const lp = biquad("lowpass", 900, 1.2);
        lp.frequency.setValueAtTime(950, t);
        lp.frequency.exponentialRampToValueAtTime(240, t + 0.16);
        body.connect(lp).connect(gainNode(0.32)).connect(sh);
        body.start(t);
        body.stop(end);
      }
    }

    function rhodes(e) {
      const { t, notes, vel } = e;
      const dur = 2.2;
      const g = gainNode(1);
      g.connect(music);
      send(g, 0.4, verbIn);
      send(g, 0.12, dIn);
      notes.forEach((m, i) => {
        const f = hz(m);
        const car = osc("sine", f);
        const mod = osc("sine", f);
        const mg = gainNode(0);
        mg.gain.setValueAtTime(f * 1.3, t);
        mg.gain.exponentialRampToValueAtTime(f * 0.08, t + 0.6);
        mod.connect(mg).connect(car.frequency);
        const ng = gainNode(0);
        ng.gain.setValueAtTime(0, t + i * 0.012);
        ng.gain.linearRampToValueAtTime(vel, t + i * 0.012 + 0.004);
        ng.gain.exponentialRampToValueAtTime(0.0008, t + dur);
        car.connect(ng).connect(panner((i / 3 - 0.5) * 0.5)).connect(g);
        for (const o of [car, mod]) {
          o.start(t);
          o.stop(t + dur + 0.05);
        }
      });
    }

    const VOWELS = {
      a: [
        [850, 1],
        [1220, 0.55],
        [2810, 0.22],
      ],
      o: [
        [500, 1],
        [900, 0.6],
        [2800, 0.15],
      ],
      e: [
        [600, 1],
        [2000, 0.45],
        [2800, 0.22],
      ],
    };
    function chop(e) {
      const { t, dur, midi, vowel, vel, wet } = e;
      const f = hz(midi);
      const end = t + dur + 0.03;
      const src = osc("sawtooth", f);
      src.detune.setValueAtTime(-110, t);
      src.detune.linearRampToValueAtTime(0, t + 0.055);
      const lfo = osc("sine", 5.6);
      const lg = gainNode(0);
      lg.gain.setValueAtTime(0, t);
      lg.gain.linearRampToValueAtTime(14, t + Math.max(0.06, dur));
      lfo.connect(lg).connect(src.detune);
      const sum = gainNode(5.5);
      for (const [ff, amp] of VOWELS[vowel]) {
        src.connect(biquad("bandpass", ff * 1.08, 8)).connect(gainNode(amp)).connect(sum);
      }
      const g = gainNode(0);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vel, t + 0.012);
      g.gain.setValueAtTime(vel, end - 0.035);
      g.gain.linearRampToValueAtTime(0, end);
      sum.connect(biquad("highpass", 240)).connect(g).connect(panner((rnd() - 0.5) * 0.4)).connect(music);
      send(g, 0.35 * wet + 0.1, dIn);
      send(g, wet, verbIn);
      for (const o of [src, lfo]) {
        o.start(t);
        o.stop(end + 0.01);
      }
    }

    function riser(e) {
      const { t, t1, vel } = e;
      const dur = t1 - t;
      const n = noise(t, dur, true);
      const bp = biquad("bandpass", 300, 1.6);
      bp.frequency.setValueAtTime(300, t);
      bp.frequency.exponentialRampToValueAtTime(9000, t1);
      const g = gainNode(0);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vel, t1);
      g.gain.setValueAtTime(0, t1 + 0.005);
      n.connect(bp).connect(g).connect(fx);
      send(g, 0.35, verbIn);
      const o = osc("sawtooth", 110);
      o.frequency.setValueAtTime(110, t);
      o.frequency.exponentialRampToValueAtTime(880, t1);
      const og = gainNode(0);
      og.gain.setValueAtTime(0.0001, t);
      og.gain.exponentialRampToValueAtTime(vel * 0.25, t1);
      og.gain.setValueAtTime(0, t1 + 0.005);
      o.connect(biquad("lowpass", 1800)).connect(og).connect(fx);
      o.start(t);
      o.stop(t1 + 0.01);
    }

    function reverse(e) {
      const { t, t1, vel } = e;
      const g = gainNode(0);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vel, t1);
      g.gain.setValueAtTime(0, t1 + 0.002);
      noise(t, t1 - t, true).connect(biquad("highpass", 4500)).connect(g).connect(fx);
    }

    function impact(e) {
      const { t, vel } = e;
      const o = osc("sine", 95);
      o.frequency.setValueAtTime(95, t);
      o.frequency.exponentialRampToValueAtTime(31, t + 0.9);
      const g = gainNode(0);
      g.gain.setValueAtTime(vel * 0.9, t);
      g.gain.setTargetAtTime(0, t + 0.05, 0.4);
      o.connect(shaper(1.4)).connect(g).connect(fx);
      o.start(t);
      o.stop(t + 2.2);
      const ng = gainNode(0);
      ng.gain.setValueAtTime(vel * 0.45, t);
      ng.gain.setTargetAtTime(0, t + 0.01, 0.18);
      noise(t, 1.2).connect(biquad("lowpass", 1100)).connect(ng).connect(fx);
      send(ng, 0.6, verbIn);
      crash(t, vel * 0.32);
    }

    function whoosh(e) {
      const { t, vel } = e;
      const n = noise(t, 0.5);
      const bp = biquad("bandpass", 600, 2.2);
      bp.frequency.setValueAtTime(600, t);
      bp.frequency.exponentialRampToValueAtTime(5200, t + 0.32);
      const g = gainNode(0);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vel, t + 0.2);
      g.gain.linearRampToValueAtTime(0, t + 0.42);
      const p = ctx.createStereoPanner();
      p.pan.setValueAtTime(-0.6, t);
      p.pan.linearRampToValueAtTime(0.6, t + 0.42);
      n.connect(bp).connect(g).connect(p).connect(fx);
      send(g, 0.3, verbIn);
    }

    const PLAY = {
      kick,
      clap,
      hat: (e) => hat(e, false),
      ohat: (e) => hat(e, true),
      shaker: shakerHit,
      pad,
      stab,
      bass,
      rhodes,
      chop,
      riser,
      reverse,
      impact,
      whoosh,
      crash: (e) => crash(e.t, e.vel),
    };
    for (const e of EVENTS) PLAY[e.type](e);

    const buf = await ctx.startRendering();
    const L = buf.getChannelData(0);
    const R = buf.getChannelData(1);
    let peak = 0;
    for (let i = 0; i < L.length; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
    const norm = peak > 0 ? 0.89 / peak : 1;
    return { L, R, norm, peak };
  }

  function wavBase64({ L, R, norm }) {
    const n = L.length;
    const bytes = new Uint8Array(44 + n * 4);
    const v = new DataView(bytes.buffer);
    const str = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
    str(0, "RIFF");
    v.setUint32(4, 36 + n * 4, true);
    str(8, "WAVE");
    str(12, "fmt ");
    v.setUint32(16, 16, true);
    v.setUint16(20, 1, true);
    v.setUint16(22, 2, true);
    v.setUint32(24, SR, true);
    v.setUint32(28, SR * 4, true);
    v.setUint16(32, 4, true);
    v.setUint16(34, 16, true);
    str(36, "data");
    v.setUint32(40, n * 4, true);
    for (let i = 0; i < n; i++) {
      v.setInt16(44 + i * 4, Math.max(-1, Math.min(1, L[i] * norm)) * 32767, true);
      v.setInt16(46 + i * 4, Math.max(-1, Math.min(1, R[i] * norm)) * 32767, true);
    }
    let s = "";
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s);
  }

  window.SCORE = {
    BPM,
    BEAT,
    BAR,
    CUT,
    DROP1,
    B_START,
    BREAK,
    GAP2,
    DROP2,
    END,
    EVENTS,
    KICKS,
    CLAPS,
    section: (t) => section(Math.floor(t / BAR)),
    render,
    wavBase64,
  };
})();
