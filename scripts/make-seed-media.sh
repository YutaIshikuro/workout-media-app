#!/usr/bin/env sh

set -eu

output_path=".maestro/fixtures/seed-h264.mp4"
ffmpeg_path="$(npm_config_cache="${TMPDIR:-/tmp}/form-catalog-npm-cache" npx --yes --package=ffmpeg-static -- node -e 'process.stdout.write(require("ffmpeg-static"))')"

mkdir -p "$(dirname "$output_path")"

"$ffmpeg_path" \
  -y \
  -f lavfi -i "testsrc2=size=320x180:rate=15" \
  -f lavfi -i "sine=frequency=440:sample_rate=48000" \
  -t 1 \
  -c:v libx264 \
  -crf 32 \
  -pix_fmt yuv420p \
  -c:a aac \
  -b:a 32k \
  -movflags +faststart \
  "$output_path"
