#!/usr/bin/env bash
# mix.sh — VO over the sidechain-ducked score, two-pass loudnorm to -14 LUFS, mux with the picture.
set -euo pipefail
cd "$(dirname "$0")/build"
ffmpeg -hide_banner -loglevel error -y -i vo_track.wav -af \
  "aresample=48000,highpass=f=75,equalizer=f=250:t=q:w=1:g=-1.5,equalizer=f=3500:t=q:w=1:g=2.5,acompressor=threshold=-24dB:ratio=3:attack=5:release=120:makeup=6,alimiter=limit=0.7:level=false" \
  vo_proc.wav
ffmpeg -hide_banner -loglevel error -y -i vo_proc.wav -i music.wav -filter_complex \
  "[0:a]pan=stereo|c0=c0|c1=c0,asplit=2[vo][key];[1:a]bass=g=-3:f=70,treble=g=3:f=7000,volume=-8.5dB[mus];[mus][key]sidechaincompress=threshold=0.1:ratio=2.5:attack=30:release=350:makeup=1[duck];[vo][duck]amix=inputs=2:normalize=0:duration=longest[out]" \
  -map "[out]" -c:a pcm_s24le mix.wav
m=$(ffmpeg -hide_banner -nostats -i mix.wav -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p')
get() { echo "$m" | grep "\"$1\"" | sed -E 's/.*: "([^"]+)".*/\1/'; }
ffmpeg -hide_banner -loglevel error -y -i mix.wav -af \
  "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(get input_i):measured_TP=$(get input_tp):measured_LRA=$(get input_lra):measured_thresh=$(get input_thresh):offset=$(get target_offset):linear=true,aresample=48000" \
  -c:a pcm_s16le final_audio.wav
# PNG frames were converted with the BT.601 matrix; deliver BT.709-tagged H.264 High (X/IG/TikTok-safe).
# Two-pass at 1.9 Mbps keeps the file near 23 MB with no visible loss on flat graphics.
VF="scale=in_color_matrix=bt601:out_color_matrix=bt709:in_range=tv:out_range=tv,format=yuv420p"
X264=(-c:v libx264 -preset slow -b:v 1900k -maxrate 3500k -bufsize 7000k -profile:v high -level 4.1 -g 60
  -colorspace bt709 -color_primaries bt709 -color_trc bt709)
ffmpeg -hide_banner -loglevel error -y -i video.mp4 -vf "$VF" "${X264[@]}" -pass 1 -passlogfile x2p -an -f mp4 /dev/null
ffmpeg -hide_banner -loglevel error -y -i video.mp4 -i final_audio.wav -map 0:v -map 1:a -vf "$VF" "${X264[@]}" \
  -pass 2 -passlogfile x2p -tag:v avc1 -c:a aac -b:a 192k -ar 48000 -movflags +faststart -shortest \
  every-frame-is-a-function.mp4
echo "wrote build/every-frame-is-a-function.mp4"
