#!/usr/bin/env bash
# Voice + preview sheet (+ full render) for one folder made by make.py.
# Usage: bash _content/visual/render.sh <dir> [preview]
# preview: voice + a contact sheet (<dir>/sheet.jpg) of 14 moments across the video, to check the layout.
# Needs python3 with kokoro-onnx, numpy, soundfile (model in _content/video/model/), Node + Playwright, ffmpeg, ImageMagick.
set -euo pipefail
D=$(cd "$1" && pwd); HERE=$(cd "$(dirname "$0")" && pwd)
${PYTHON:-python3} "$HERE/../video/synth.py" "$D"
export NODE_PATH=$(npm root -g)
T=$(python3 -c "import json;d=json.load(open('$D/timeline.json'))['duration'];print(','.join(f'{d*i/14+0.4:.2f}' for i in range(14)))")
rm -f "$D"/preview-*.png
node "$HERE/render.js" "$D" 30 "$T" >/dev/null
montage "$D"/preview-*.png -tile 7x2 -geometry 300x533+4+4 -background '#000' "$D/sheet.jpg"; rm -f "$D"/preview-*.png
[ "${2:-}" = "preview" ] && { echo "preview: $D/sheet.jpg"; exit 0; }
NAME=$(python3 -c "import json;print(json.load(open('$D/script.json'))['name'])")
node "$HERE/render.js" "$D" 30 >/dev/null
python3 "$HERE/sfx.py" "$D"
ffmpeg -y -loglevel error -framerate 30 -i "$D/frames/f%05d.jpg" -i "$D/mix.wav" -c:v libx264 -crf 18 -pix_fmt yuv420p \
  -af loudnorm=I=-14 -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart "$D/$NAME.mp4"
rm -rf "$D/frames"
echo "video: $D/$NAME.mp4 ($(ffprobe -v error -show_entries format=duration -of csv=p=0 "$D/$NAME.mp4") s)"
