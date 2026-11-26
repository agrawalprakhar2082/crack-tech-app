#!/usr/bin/env bash
# Draws Instagram's overlay zones (red) on frames to check nothing important sits under the app's UI.
# Zones measured from a phone screenshot (Nov 2026), in 1080x1920 video pixels: header y<130,
# right-hand buttons x>940 for y>880, username + caption y>1640, ~25 px cropped at each side on tall phones.
# Usage: bash safecheck.sh out.png in1.png [in2.png ...]
out=$1; shift; files=()
for f in "$@"; do g="${f%.png}-safe.png"
  convert "$f" -fill 'rgba(255,0,0,0.35)' -draw 'rectangle 0,0 1080,130' -draw 'rectangle 940,880 1080,1920' -draw 'rectangle 0,1640 1080,1920' -draw 'rectangle 0,0 25,1920' -draw 'rectangle 1055,0 1080,1920' "$g"; files+=("$g"); done
montage "${files[@]}" -tile ${#files[@]}x1 -geometry 360x640+4+4 -background '#000' "$out"; rm -f "${files[@]}"
