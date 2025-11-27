#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && cd .. && pwd )
cd "$ROOT_DIR"

if ! command -v npx >/dev/null 2>&1; then
  echo "npx is required to run the AI impact analysis" >&2
  exit 1
fi

exec npx tsx ./scripts/analyze-pr-impact.ts "$@"
