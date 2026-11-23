#!/usr/bin/env bash
# Extracts the illustrative (AI-generated) visuals from Meriem's mockup, upscales them x4 with Real-ESRGAN
# (tool kept in ../../sarah/tools) and writes WebP to public/media/illus. NOT photos of Meriem: the UI labels them.
set -euo pipefail
FF="${FF:-/c/Program Files (x86)/Freemake/COM/1.1/FFMPEG_43/ffmpeg.exe}"
HERE="$(cd "$(dirname "$0")/.." && pwd)"
ESR="${ESR:-$HERE/../../sarah/tools/realesrgan/realesrgan-ncnn-vulkan.exe}"
M="$HERE/../maquette portifilio.png"
OUT="$HERE/public/media/illus"; TMP="$(mktemp -d)"; mkdir -p "$OUT"
while IFS='|' read -r n crop w; do
  [ -z "$n" ] && continue
  "$FF" -v error -y -i "$M" -vf "crop=$crop" "$TMP/$n.png"
  "$ESR" -i "$TMP/$n.png" -o "$TMP/$n-x4.png" -n realesrgan-x4plus -s 4 >/dev/null 2>&1
  "$FF" -v error -y -i "$TMP/$n-x4.png" -vf "scale=$w:-2:flags=lanczos" -c:v libwebp -quality 84 "$OUT/$n.webp"
  "$FF" -v error -y -i "$TMP/$n-x4.png" -vf "scale=480:-2:flags=lanczos" -c:v libwebp -quality 78 "$OUT/$n-sm.webp"
done <<LIST
hero-coach|560:330:600:88|1600
baby-gym|168:112:784:504|672
stage-led|168:112:966:504|672
kids-basketball|144:106:42:741|576
baby-gym-mat|144:106:201:741|576
kids-group|144:106:360:741|576
stage-heels|144:106:519:741|576
kids-gym-group|144:106:678:741|576
LIST
rm -rf "$TMP"; ls -la "$OUT" | awk '{print $5, $9}'
