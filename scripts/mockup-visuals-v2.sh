#!/usr/bin/env bash
# v2 mockups (../maquettes/maquette-v2-*.webp): extracts the illustrative visuals, upscales x4 with Real-ESRGAN,
# writes WebP to public/media/illus. AI-generated people, NOT photos of Meriem: the UI labels them "Illustration".
set -euo pipefail
FF="${FF:-/c/Program Files (x86)/Freemake/COM/1.1/FFMPEG_43/ffmpeg.exe}"
HERE="$(cd "$(dirname "$0")/.." && pwd)"
ESR="${ESR:-$HERE/../../sarah/tools/realesrgan/realesrgan-ncnn-vulkan.exe}"
A="$HERE/../maquettes/maquette-v2-a.webp"; B="$HERE/../maquettes/maquette-v2-b.webp"
OUT="$HERE/public/media/illus"; TMP="$(mktemp -d)"; mkdir -p "$OUT"
while IFS='|' read -r n src crop w; do
  [ -z "$n" ] && continue
  "$FF" -v error -y -i "$src" -vf "crop=$crop" "$TMP/$n.png"
  "$ESR" -i "$TMP/$n.png" -o "$TMP/$n-x4.png" -n realesrgan-x4plus -s 4 >/dev/null 2>&1
  "$FF" -v error -y -i "$TMP/$n-x4.png" -vf "scale=$w:-2:flags=lanczos" -c:v libwebp -quality 84 "$OUT/$n.webp"
  "$FF" -v error -y -i "$TMP/$n-x4.png" -vf "scale=480:-2:flags=lanczos" -c:v libwebp -quality 78 "$OUT/$n-sm.webp"
done <<LIST
dancer-hero|$A|430:490:640:62|1400
dancer-portrait|$B|210:180:348:335|840
coach-kids|$A|480:170:408:574|1600
class-dance|$B|460:150:0:512|1600
kids-cheer|$B|380:140:782:522|1400
stage-group|$B|214:82:49:720|856
studio-coach|$B|183:82:280:720|732
kids-line|$B|143:82:662:720|572
stage-dance|$B|158:82:822:720|632
floor-stretch|$B|166:82:997:720|664
LIST
rm -rf "$TMP"; ls "$OUT" | wc -l
