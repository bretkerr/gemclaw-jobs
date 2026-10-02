#!/usr/bin/env bash
# setup.sh — fetch the voice model, fonts and Python deps the film needs (nothing is committed).
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p models fonts build vo
python3 -m venv .venv
. .venv/bin/activate
pip install -q kokoro-onnx soundfile numpy
# Kokoro-82M ONNX export that also reports phoneme durations (used for caption timing)
[ -f models/kokoro-v1.1.onnx ] || curl -sSL -o models/kokoro-v1.1.onnx \
  https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.1/kokoro-v1.0.onnx
[ -f models/voices-v1.0.bin ] || curl -sSL -o models/voices-v1.0.bin \
  https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
# Fonts (OFL): Source Serif 4, IBM Plex Mono, Inter
tmp=$(mktemp -d)
(cd "$tmp" && npm init -y >/dev/null && npm install --silent @fontsource/source-serif-4 @fontsource/ibm-plex-mono @fontsource/inter)
cp "$tmp"/node_modules/@fontsource/source-serif-4/files/source-serif-4-latin-{700,900}-normal.woff2 fonts/
cp "$tmp"/node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-{400,500,600,700}-normal.woff2 fonts/
cp "$tmp"/node_modules/@fontsource/inter/files/inter-latin-{800,900}-normal.woff2 fonts/
echo "setup done"
