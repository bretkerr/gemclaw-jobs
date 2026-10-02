"""Voiceover: synthesize each script segment with Kokoro and record caption-chunk timings.

Each segment is a list of caption chunks separated by "|". A chunk is either
"spoken text" or "spoken text::caption text" when the caption should differ
from what the voice says (numbers, code, symbols).
"""

import json
import sys

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

VOICE = "af_heart"
SPEED = float(sys.argv[1]) if len(sys.argv) > 1 else 1.0

SCRIPT = [
    ("hook1", "Days after|Claude Opus five point five::Claude Opus 5.5|launched,|a video of the entire|history of Western civilization|took over X."),
    ("hook2", "Over twelve thousand shares.::12,000+ shares.|Made with a prompt."),
    ("q", "So Anthropic shipped|a video model,|right?"),
    ("nope", "Nope."),
    ("pixel", "Opus didn't paint|a single pixel.|It wrote|a program."),
    ("fn", "One function:|draw of t.::draw(t).|Give it a moment in time,|it paints|that exact frame."),
    ("pipe", "A headless browser|calls it thirty times a second.::calls it 30× a second.|F F mpeg encodes.::ffmpeg encodes.|Web Audio|writes the score."),
    ("twice", "Run it twice,|same film.|Frame for frame."),
    ("why", "Why now?|A motion graphic|is an agentic coding task|with a visual test."),
    ("hold", "Hold a timeline.|Sync dozens of elements.|Debug how it looks,|not just whether it compiles."),
    ("bench", "Opus five point five scores::Opus 5.5 scores|sixty-six point four percent::66.4%|on Terminal Bench.::on Terminal-Bench 4.0.|Up fourteen points::Up 14 points|in one release."),
    ("econ", "An explainer that cost|weeks and ten thousand dollars::weeks and $10,000|now takes|about fifteen minutes.::about 15 minutes."),
    ("recipe", "No keyframes.|No After Effects.|You name the states.|The model does|everything in between."),
    ("diff", "Unlike diffusion video,|the type is real type,|the chart is real numbers,|and moving a logo six pixels::and moving a logo 6px|is a one line diff.::is a one-line diff."),
    ("catch", "The catch?|Motion got cheap,|and so did sameness."),
    ("judg", "Agents now make more|than people can review.|The scarce input|isn't production.|It's judgment."),
    ("outro", "This video?|Same recipe.|Every frame,|a function of time."),
]


def parse(spec):
    chunks = []
    for part in spec.split("|"):
        say, _, cap = part.partition("::")
        chunks.append({"say": say.strip(), "cap": (cap or say).strip()})
    return chunks


def word_spans(timings):
    """Group phoneme timings into words, splitting on the spaces between them."""
    words, cur = [], []
    for tm in timings:
        if tm.phoneme == " ":
            if cur:
                words.append(cur)
            cur = []
        else:
            cur.append(tm)
    if cur:
        words.append(cur)
    return [(w[0].start, w[-1].end, "".join(t.phoneme for t in w)) for w in words]


def main():
    kokoro = Kokoro("models/kokoro-v1.1.onnx", "models/voices-v1.0.bin")
    assert kokoro.has_timings
    out = []
    for seg_id, spec in SCRIPT:
        chunks = parse(spec)
        text = " ".join(c["say"] for c in chunks)
        audio, sr, timings = kokoro.create_timed(text, voice=VOICE, speed=SPEED)
        words = word_spans(timings)
        # Each chunk owns as many phonemized words as its spoken text has words.
        counts = [len(kokoro.tokenizer.phonemize(c["say"], "en-us").split()) for c in chunks]
        if sum(counts) != len(words):
            print(f"[warn] {seg_id}: {sum(counts)} chunk words vs {len(words)} spoken words", file=sys.stderr)
            dur = len(audio) / sr
            lens = np.array([len(c["say"]) for c in chunks], dtype=float)
            edges = np.concatenate([[0], np.cumsum(lens) / lens.sum() * dur])
            for c, a, b in zip(chunks, edges[:-1], edges[1:]):
                c["start"], c["end"] = float(a), float(b)
        else:
            i = 0
            for c, n in zip(chunks, counts):
                c["start"], c["end"] = words[i][0], words[i + n - 1][1]
                i += n
        path = f"vo/{seg_id}.wav"
        sf.write(path, audio, sr)
        dur = len(audio) / sr
        out.append({"id": seg_id, "file": path, "dur": dur, "chunks": chunks})
        print(f"{seg_id:7s} {dur:5.2f}s  {text}")
    total = sum(s["dur"] for s in out)
    print(f"total speech {total:.2f}s at speed {SPEED}")
    with open("vo/segments.json", "w") as f:
        json.dump(out, f, indent=1)


if __name__ == "__main__":
    main()
