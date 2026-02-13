#!/bin/bash
# Visionary Scanner - Parity Auditor
# Compares Safe and NSFW repos to detect engine drift
#
# Usage: ./scripts/check-parity.sh [path-to-nsfw-repo]
# Example: ./scripts/check-parity.sh ../NSFW-Visionary-Scanner

set -e

SAFE_PATH="."
NSFW_PATH="${1:-../NSFW-Visionary-Scanner}"

echo "🔍 Visionary Scanner Parity Auditor"
echo "===================================="
echo "Safe Repo:  $SAFE_PATH"
echo "NSFW Repo:  $NSFW_PATH"
echo ""

# Check if NSFW repo exists
if [ ! -d "$NSFW_PATH" ]; then
    echo "❌ Error: NSFW repo not found at $NSFW_PATH"
    echo "   Clone it first or provide the correct path."
    exit 1
fi

# Files that SHOULD be different (the Bridge files)
EXCLUDED_FILES=(
    "src/config/content-manifest.ts"
    "src/lib/buildFlags.ts"
    ".env"
    ".env.local"
)

# Directories that are NSFW-only
EXCLUDED_DIRS=(
    "src/assets/unrestricted"
    "src/dlc/adult"
)

echo "📁 Checking Core Engine Parity..."
echo "-----------------------------------"

# Build exclusion pattern for diff
EXCLUDE_PATTERN=""
for file in "${EXCLUDED_FILES[@]}"; do
    EXCLUDE_PATTERN="$EXCLUDE_PATTERN --exclude=$file"
done
for dir in "${EXCLUDED_DIRS[@]}"; do
    EXCLUDE_PATTERN="$EXCLUDE_PATTERN --exclude=$dir"
done

# Compare src directories (excluding Bridge files)
DIFF_OUTPUT=$(diff -rq "$SAFE_PATH/src" "$NSFW_PATH/src" $EXCLUDE_PATTERN 2>/dev/null || true)

if [ -z "$DIFF_OUTPUT" ]; then
    echo "✅ Core engine files are in sync!"
else
    echo "⚠️  Differences detected:"
    echo "$DIFF_OUTPUT"
    echo ""
    echo "These files have drifted between repos."
fi

echo ""
echo "📋 Verifying Bridge Files..."
echo "----------------------------"

# Check that Bridge files exist in both repos
for file in "${EXCLUDED_FILES[@]}"; do
    if [ -f "$SAFE_PATH/$file" ] && [ -f "$NSFW_PATH/$file" ]; then
        echo "✅ Bridge file exists in both: $file"
    elif [ -f "$SAFE_PATH/$file" ]; then
        echo "⚠️  Missing in NSFW: $file"
    elif [ -f "$NSFW_PATH/$file" ]; then
        echo "⚠️  Missing in Safe: $file"
    fi
done

echo ""
echo "🏁 Audit Complete"
