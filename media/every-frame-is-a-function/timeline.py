"""Place voiceover segments on the 90 s timeline; write the VO track and timeline.js for draw(t)."""

import json

import numpy as np
import soundfile as sf

DURATION = 90.0
SR = 24000

# Start time (s) of every voiceover segment. Anchors that matter to the score:
# the music cuts right after "right?", "Nope." sits in silence, the drop lands
# on bar 8 (15.0 s) with "pixel", the breakdown starts at bar 38 (71.25 s) as
# "one-line diff" ends, and the final drop is bar 44 (82.5 s) with "outro".
STARTS = {
    "hook1": 0.45, "hook2": 8.30, "q": 11.50, "nope": 14.05, "pixel": 15.05,
    "fn": 18.73, "pipe": 24.03, "twice": 30.83, "why": 34.10, "hold": 39.03,
    "bench": 44.95, "econ": 52.40, "recipe": 57.62, "diff": 63.63,
    "catch": 71.90, "judg": 75.50, "outro": 82.55,
}


def main():
    segs = json.load(open("vo/segments.json"))
    track = np.zeros(int(DURATION * SR), dtype=np.float32)
    placed, prev_end = [], 0.0
    for s in segs:
        t0 = STARTS[s["id"]]
        assert t0 >= prev_end + 0.05, f"{s['id']} overlaps previous segment ({t0} < {prev_end})"
        audio, sr = sf.read(s["file"], dtype="float32")
        assert sr == SR
        i0 = int(round(t0 * SR))
        track[i0 : i0 + len(audio)] += audio
        prev_end = t0 + s["dur"]
        chunks = [
            {"cap": c["cap"], "t0": round(t0 + c["start"], 3), "t1": round(t0 + c["end"], 3)}
            for c in s["chunks"]
        ]
        placed.append({"id": s["id"], "t0": t0, "t1": round(prev_end, 3), "chunks": chunks})
        print(f"{s['id']:7s} {t0:6.2f} -> {prev_end:6.2f}")
    assert prev_end < DURATION - 3.0
    sf.write("build/vo_track.wav", track, SR)
    cut = round(next(p for p in placed if p["id"] == "q")["t1"] + 0.07, 3)
    tl = {"duration": DURATION, "fps": 30, "cut": cut, "segments": placed}
    with open("build/timeline.js", "w") as f:
        f.write("window.TL = " + json.dumps(tl, indent=1) + ";\n")
    print(f"music cut at {cut}s")


if __name__ == "__main__":
    main()
