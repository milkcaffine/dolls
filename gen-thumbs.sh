#!/usr/bin/env bash
# Regenerate images/thumbs from images/*.jpg
# Usage: ./gen-thumbs.sh          # all images
#        ./gen-thumbs.sh foo.jpg  # one file (basename under images/)

set -euo pipefail
cd "$(dirname "$0")"

SRC_DIR="images"
OUT_DIR="images/thumbs"
MAX=480
QUALITY=70

mkdir -p "$OUT_DIR"

make_thumb() {
  local name="$1"
  local src="$SRC_DIR/$name"
  local out="$OUT_DIR/$name"

  if [[ ! -f "$src" ]]; then
    echo "skip (missing): $src" >&2
    return 1
  fi

  sips -Z "$MAX" -s format jpeg -s formatOptions "$QUALITY" "$src" --out "$out" >/dev/null
  echo "ok  $name"
}

if [[ $# -gt 0 ]]; then
  for arg in "$@"; do
    make_thumb "$(basename "$arg")"
  done
else
  shopt -s nullglob
  for src in "$SRC_DIR"/*.jpg "$SRC_DIR"/*.jpeg "$SRC_DIR"/*.JPG "$SRC_DIR"/*.JPEG; do
    make_thumb "$(basename "$src")"
  done
fi

echo "done → $OUT_DIR"
