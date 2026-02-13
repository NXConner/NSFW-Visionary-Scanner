#!/usr/bin/env bash
set -euo pipefail

# Sync core engine files from `NXConner/visionary-scanner-suite` into this repo.
# - Uses `git archive` from a fetched remote ref (no full clone required).
# - Uses rsync with backups (no hard deletes; overwritten/deleted files are archived).
# - Preserves NSFW/protected paths by restoring local versions after sync.
#
# Usage:
#   ./scripts/sync-visionary-scanner-repos.sh --dry-run
#   ./scripts/sync-visionary-scanner-repos.sh --apply
#
# Optional:
#   --remote suite
#   --branch main
#   --suite-url https://github.com/NXConner/visionary-scanner-suite.git
#   --include-github
#
# Notes:
# - Requires: git, rsync, tar
# - Refuses to run if the working tree is dirty.

usage() {
  cat <<'USAGE'
sync-visionary-scanner-repos.sh

Syncs "core engine" paths from NXConner/visionary-scanner-suite into the current repo.

Modes:
  --dry-run         Show what would change (default)
  --apply           Apply changes to working tree

Source controls:
  --remote <name>   Git remote name to use/add (default: suite)
  --branch <name>   Branch to fetch (default: main)
  --suite-url <url> Suite repo URL (default: https://github.com/NXConner/visionary-scanner-suite.git)
  --include-github  Also sync .github (workflows/templates) (default: off)

USAGE
}

require_cmd() {
  local name="$1"
  if ! command -v "$name" >/dev/null 2>&1; then
    echo "error: required command not found on PATH: $name" >&2
    exit 127
  fi
}

is_dir_in_git_ref() {
  local ref="$1"
  local path="$2"
  # Works for both files and directories; empty output => missing.
  local out
  out="$(git ls-tree "$ref" "$path" 2>/dev/null || true)"
  [[ -n "$out" ]]
}

sync_dir() {
  local src="$1"
  local dest="$2"
  local backup_dir="$3"
  shift 3

  mkdir -p "$dest"
  mkdir -p "$backup_dir"

  # shellcheck disable=SC2068
  rsync -a --delete --backup --backup-dir="$backup_dir" $@ "$src" "$dest"
}

sync_file() {
  local src="$1"
  local dest="$2"
  local backup_dir="$3"
  shift 3

  mkdir -p "$(dirname "$dest")"
  mkdir -p "$backup_dir"

  # shellcheck disable=SC2068
  rsync -a --backup --backup-dir="$backup_dir" $@ "$src" "$dest"
}

MODE="dry-run"
REMOTE="suite"
BRANCH="main"
SUITE_URL="https://github.com/NXConner/visionary-scanner-suite.git"
INCLUDE_GITHUB="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --apply)
      MODE="apply"
      shift
      ;;
    --dry-run)
      MODE="dry-run"
      shift
      ;;
    --remote)
      REMOTE="${2:-}"
      shift 2
      ;;
    --branch)
      BRANCH="${2:-}"
      shift 2
      ;;
    --suite-url)
      SUITE_URL="${2:-}"
      shift 2
      ;;
    --include-github)
      INCLUDE_GITHUB="true"
      shift
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      echo "error: unknown argument: $1" >&2
      usage
      exit 2
      ;;
  esac
done

require_cmd git
require_cmd rsync
require_cmd tar

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "error: not inside a git repo: $ROOT_DIR" >&2
  exit 2
fi

# Refuse to run when dirty to avoid accidental loss of local changes.
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "error: working tree is dirty; commit/stash changes before syncing." >&2
  git status -sb >&2
  exit 2
fi

if ! git remote get-url "$REMOTE" >/dev/null 2>&1; then
  git remote add "$REMOTE" "$SUITE_URL"
fi

git fetch "$REMOTE" "$BRANCH" --quiet
SOURCE_REF="$REMOTE/$BRANCH"

TS="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_BASE="$ROOT_DIR/deleted files/repo-sync/$TS"
PROTECTED_SNAPSHOT="$BACKUP_BASE/_protected"

mkdir -p "$BACKUP_BASE"
mkdir -p "$PROTECTED_SNAPSHOT"

# Paths that are allowed to differ in NSFW repo; if they exist locally, preserve them.
PROTECT_PATHS=(
  "src/config/content-manifest.ts"
  "src/lib/buildFlags.ts"
  "src/assets/unrestricted"
  "src/dlc/adult"
  ".env"
  ".env.local"
)

for p in "${PROTECT_PATHS[@]}"; do
  if [[ -e "$ROOT_DIR/$p" ]]; then
    mkdir -p "$PROTECTED_SNAPSHOT/$(dirname "$p")"
    # Copy file/dir into protected snapshot
    rsync -a "$ROOT_DIR/$p" "$PROTECTED_SNAPSHOT/$(dirname "$p")/"
  fi
done

# "Core engine" sync set.
SYNC_PATHS=(
  "src"
  "supabase"
  "scripts"
  "docs"
  "public"
  "e2e"
  "performance-tests"
  "exports"
  "android"
  "ios"
  ".husky"
  "README.md"
  "CHANGELOG.md"
  "package.json"
  "package-lock.json"
  "vite.config.ts"
  "eslint.config.js"
  ".eslintrc.json"
  ".eslintignore"
  ".prettierrc"
  ".prettierignore"
  ".env.example"
  ".dockerignore"
  "Dockerfile"
  "docker-compose.yml"
  ".gitignore"
  ".gitattributes"
)

if [[ "$INCLUDE_GITHUB" == "true" ]]; then
  SYNC_PATHS+=(".github")
fi

# Build a snapshot of the source ref using git archive.
TMP_DIR="$(mktemp -d)"
SNAPSHOT_DIR="$TMP_DIR/suite-snapshot"
mkdir -p "$SNAPSHOT_DIR"

AVAILABLE_PATHS=()
for p in "${SYNC_PATHS[@]}"; do
  if is_dir_in_git_ref "$SOURCE_REF" "$p"; then
    AVAILABLE_PATHS+=("$p")
  fi
done

if [[ ${#AVAILABLE_PATHS[@]} -eq 0 ]]; then
  echo "error: no sync paths were found in source ref: $SOURCE_REF" >&2
  rm -rf "$TMP_DIR"
  exit 2
fi

git archive --format=tar "$SOURCE_REF" "${AVAILABLE_PATHS[@]}" | tar -x -C "$SNAPSHOT_DIR"

RSYNC_OPTS=()
if [[ "$MODE" == "dry-run" ]]; then
  RSYNC_OPTS+=(--dry-run --itemize-changes)
fi

# Exclusions: never sync local-only secrets or transient dirs.
COMMON_EXCLUDES=(
  --exclude ".git/"
  --exclude "node_modules/"
  --exclude ".npm/"
  --exclude "dist/"
  --exclude "deleted files/"
  --exclude "DontNeed/"
  --exclude ".env"
  --exclude ".env.*"
)

# Platform secret excludes (kept local; do not overwrite/delete)
ANDROID_EXCLUDES=(
  --exclude "app/google-services.json"
  --exclude "keystore.properties"
  --exclude "gradle.properties"
  --exclude "app/release.keystore"
)

IOS_EXCLUDES=(
  --exclude "App/App/GoogleService-Info.plist"
)

echo ""
echo "== Repo Sync (Suite -> Current) =="
echo "Mode: $MODE"
echo "Source: $SOURCE_REF"
echo "Backup: $BACKUP_BASE"
echo ""

for p in "${AVAILABLE_PATHS[@]}"; do
  src_path="$SNAPSHOT_DIR/$p"
  dest_path="$ROOT_DIR/$p"
  backup_path="$BACKUP_BASE/_backup/$p"

  if [[ -d "$src_path" ]]; then
    extra_excludes=()
    if [[ "$p" == "android" ]]; then
      extra_excludes=("${ANDROID_EXCLUDES[@]}")
    elif [[ "$p" == "ios" ]]; then
      extra_excludes=("${IOS_EXCLUDES[@]}")
    fi

    echo "-- syncing dir: $p/"
    sync_dir "$src_path/" "$dest_path/" "$backup_path" "${RSYNC_OPTS[@]}" "${COMMON_EXCLUDES[@]}" "${extra_excludes[@]}"
  elif [[ -f "$src_path" ]]; then
    echo "-- syncing file: $p"
    sync_file "$src_path" "$dest_path" "$BACKUP_BASE/_backup/_root" "${RSYNC_OPTS[@]}" "${COMMON_EXCLUDES[@]}"
  fi
done

if [[ "$MODE" == "apply" ]]; then
  # Restore protected paths if they existed locally before sync.
  for p in "${PROTECT_PATHS[@]}"; do
    if [[ -e "$PROTECTED_SNAPSHOT/$p" ]]; then
      mkdir -p "$(dirname "$ROOT_DIR/$p")"
      rsync -a "$PROTECTED_SNAPSHOT/$p" "$ROOT_DIR/$p"
    fi
  done
fi

rm -rf "$TMP_DIR"

echo ""
echo "Done."
echo "Backup archive (overwritten/deleted files): $BACKUP_BASE/_backup/"
echo "Protected-path snapshot: $PROTECTED_SNAPSHOT/"
if [[ "$MODE" == "dry-run" ]]; then
  echo "Re-run with --apply to make changes."
fi

