#!/usr/bin/env bash
# Voice, preview sheet, full render and encode for one Short/Reel folder made by make_short.py.
# Usage: bash _content/video/render.sh <dir> [preview]
#   preview: only voice + a contact sheet of the last frame of each scene (<dir>/sheet.jpg) to check layout.
# Needs: python3 with kokoro-onnx, numpy, soundfile; Node with Playwright (preinstalled in the cloud
# environment: NODE_PATH=$(npm root -g)); ffmpeg; ImageMagick (montage) for the sheet.
set -euo pipefail
D=$(cd "$1" && pwd); HERE=$(cd "$(dirname "$0")" && pwd)
PY=${PYTHON:-python3}
$PY "$HERE/synth.py" "$D"
T=$(python3 -c "import json;t=json.load(open('$D/timeline.json'));print(','.join(f\"{s['lines'][-1]['end']-0.15:.2f}\" for s in t['scenes']))")
rm -f "$D"/preview-*.png
NODE_PATH=$(npm root -g) node "$HERE/render.js" "$D" 30 "$T" >/dev/null
PREVIEWS=$(python3 -c "import glob,os,re;fs=glob.glob('$D/preview-*.png');print(' '.join(sorted(fs,key=lambda f:float(re.search(r'preview-([0-9.]+)\.png',os.path.basename(f)).group(1)))))")
montage $PREVIEWS -tile 5x1 -geometry 360x640+4+4 -background '#000' "$D/sheet.jpg"
# Cover: the end of the hook scene.
mv "${PREVIEWS%% *}" "$D/cover.png"
rm -f "$D"/preview-*.png
[ "${2:-}" = "preview" ] && { echo "preview: $D/sheet.jpg"; exit 0; }
NAME=$(python3 -c "import json;print(json.load(open('$D/script.json'))['name'])")
NODE_PATH=$(npm root -g) node "$HERE/render.js" "$D" 30 >/dev/null
ffmpeg -y -loglevel error -framerate 30 -i "$D/frames/f%05d.jpg" -i "$D/narration.wav" -c:v libx264 -crf 18 -pix_fmt yuv420p \
  -af loudnorm=I=-14 -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart "$D/$NAME.mp4"
rm -rf "$D/frames"
echo "video: $D/$NAME.mp4 ($(ffprobe -v error -show_entries format=duration -of csv=p=0 "$D/$NAME.mp4") s), cover: $D/cover.png"
