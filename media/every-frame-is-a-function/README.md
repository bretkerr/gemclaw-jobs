# Every Frame Is a Function: 90-second explainer

A 9:16 (1080×1920, 30 fps) explainer to accompany the Context Jamming essay
[Every Frame Is a Function](https://bretkerr.substack.com/p/every-frame-is-a-function).

The film is made the way the essay describes Opus 5.5 films: no video model, no
stock footage. One function, `drawFrame(t)`, paints every frame from the time
`t` alone. Headless Chromium calls it 2,700 times and ffmpeg encodes the PNGs.
The score is synthesized with Web Audio in an `OfflineAudioContext`. All
randomness is seeded, so two renders produce the same frames.

| File | Role |
|------|------|
| `vo.py` | Voiceover script (17 segments). Synthesizes each segment with Kokoro-82M (`af_heart`, 1.1×) and records per-chunk caption timings from the model's phoneme durations. |
| `timeline.py` | Places the segments on the 90 s timeline, anchored to the score's bar grid, and writes `build/vo_track.wav` and `build/timeline.js`. |
| `score.js` | The soundtrack: 128 BPM UK-garage two-step in F minor (swung hats, 2-step kicks, organ stabs, sub bass, formant-synth vocal chops, a tape stop on "right?", drops at 15.0 s and 82.5 s). Exposes the kick grid so the picture can pulse in time. |
| `draw.js` | The picture: 12 scenes, the captions, and the persistent chrome (live `t` counter, frame counter, film-strip progress bar). |
| `index.html` | Loads fonts, the timeline, the score and the picture. |
| `render.mjs` | `stills <t…>` for spot checks, `audio` to render the score, `video [workers]` to render all frames. |
| `mix.sh` | VO processing, sidechain ducking, two-pass loudnorm to −14 LUFS, mux. |
| `setup.sh` | Fetches the Kokoro model, fonts (OFL) and Python deps. |

## Reproduce

```bash
./setup.sh
. .venv/bin/activate
python vo.py 1.1          # vo/*.wav + vo/segments.json
python timeline.py        # build/vo_track.wav + build/timeline.js
node render.mjs audio     # build/music.wav (Web Audio score, ~4 min)
node render.mjs video 4   # build/video.mp4 (2,700 frames, ~25 min on 4 cores)
./mix.sh                  # build/every-frame-is-a-function.mp4
```

Needs Node 20+, Python 3.10+, ffmpeg with libx264, and Playwright's Chromium.

## Editing

- **Words:** edit `SCRIPT` in `vo.py`, then rerun `vo.py` and `timeline.py`. If a
  segment's length changes, adjust its entry in `STARTS` in `timeline.py`. The
  anchors that matter are the drop on `pixel` (15.0 s), the breakdown at 71.25 s
  and the final drop on `outro` (82.5 s).
- **Picture:** each scene is one function in `draw.js` (`sViral`, `sQuestion`, …),
  keyed to voiceover chunk times through `ck(segmentId, chunkIndex)`. Check a
  change with `node render.mjs stills 23.4 57.0` before a full render.
- **Music:** the arrangement is the data built in `buildEvents()` in `score.js`.

Figures on screen come from the essay: 12,000+ shares, the 11-word caption,
Terminal-Bench 4.0 scores (Opus 5 52.3, Fable 5.1 55.8, Opus 5.5 66.4), 3–4
weeks and $8,000–$10,000 against about fifteen minutes.
