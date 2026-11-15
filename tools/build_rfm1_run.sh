#!/bin/sh
# SPDX-License-Identifier: GPL-3.0-only
# rfm1_run alone, from an FM1VST checkout (its tools/, third_party/wasm3, core-api), with the flags its CMake uses
# (FM1VST cmake/FM1Rfm1.cmake fm1_rfm1_finish) but no CMake configure: that one wants Emscripten and every core.
#   tools/build_rfm1_run.sh <fm1vst dir> <out binary>
set -eu
SRC=$1
OUT=$2
W=$SRC/third_party/wasm3/source
OBJ=$(dirname "$OUT")/obj
mkdir -p "$OBJ"
CC=${CC:-cc}
for f in bind code compile core emit env exec function info module optimize parse; do
  "$CC" -std=gnu11 -O3 -fomit-frame-pointer -fno-stack-check -fno-stack-protector -w -I"$W" -c "$W/m3_$f.c" -o "$OBJ/m3_$f.o"
done
"$CC" -std=gnu11 -O2 -Wall -Wextra -I"$SRC/core-api" -I"$W" "$SRC/tools/rfm1_run/rfm1_run.c" "$OBJ"/m3_*.o -lm -o "$OUT"
echo "built $OUT"
