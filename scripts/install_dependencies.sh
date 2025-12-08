#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

printf "\n🔧 Installing project dependencies...\n\n"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required. Install it via nvm or from https://nodejs.org" >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required but was not found in PATH." >&2
  exit 1
fi

npm install

printf "\n✅ Dependencies installed. Recommended next steps:\n"
printf "  1. cp .env.example .env && update secrets.\n"
printf "  2. npm run lint       # Static analysis\n"
printf "  3. npm run format:write # Enforce formatting\n"
