#!/bin/bash
# Script to prepare SFW version for main branch
# This script replaces NSFW components with SFW placeholders

set -e

echo "========================================"
echo "Preparing SFW Main Branch"
echo "========================================"

# Backup current files
echo "Creating backups..."
cp src/pages/Index.tsx src/pages/Index.tsx.bak 2>/dev/null || true
cp src/App.tsx src/App.tsx.bak 2>/dev/null || true
cp src/components/SettingsPanel.tsx src/components/SettingsPanel.tsx.bak 2>/dev/null || true

# Replace with SFW versions
echo "Installing SFW versions..."
cp src/pages/Index.sfw.tsx src/pages/Index.tsx
cp src/App.sfw.tsx src/App.tsx
cp src/components/SettingsPanel.sfw.tsx src/components/SettingsPanel.tsx

# Remove NSFW-related files from main app (keep in nsfw-addon)
echo "Cleaning up NSFW-related files..."

# Remove addon context and components from main app
rm -rf src/contexts/AddonContext.tsx 2>/dev/null || true
rm -rf src/components/addon 2>/dev/null || true
rm -rf src/hooks/useAddonFeature.tsx 2>/dev/null || true

# Remove NSFW component files from main app
rm -rf src/components/ScannerSection.tsx 2>/dev/null || true
rm -rf src/components/PEProgressPhotos.tsx 2>/dev/null || true
rm -rf src/components/PERoutineBuilder.tsx 2>/dev/null || true
rm -rf src/components/PositionsGallery.tsx 2>/dev/null || true
rm -rf src/components/MensHealthGuide.tsx 2>/dev/null || true
rm -rf src/components/Model3DViewer.tsx 2>/dev/null || true
rm -rf src/components/EmergencyGuidance.tsx 2>/dev/null || true
rm -rf src/components/EducationCenter.tsx 2>/dev/null || true
rm -rf src/components/AIHealthChatbot.tsx 2>/dev/null || true
rm -rf src/components/PumpingSection.tsx 2>/dev/null || true
rm -rf src/components/AIRoutineRecommendations.tsx 2>/dev/null || true
rm -rf src/components/HealthDetectionPanel.tsx 2>/dev/null || true
rm -rf src/components/ScanReport.tsx 2>/dev/null || true
rm -rf src/hooks/useAIScanAnalysis.ts 2>/dev/null || true

# Remove nsfw-addon directory (keep for separate distribution)
# rm -rf nsfw-addon 2>/dev/null || true

# Remove NSFW-specific documentation
rm -rf docs/NSFW_ADDON_PACKAGING_STRATEGY.md 2>/dev/null || true
rm -rf docs/ADDON_IMPLEMENTATION_SUMMARY.md 2>/dev/null || true
rm -rf docs/BRANCH_DIFFERENCES.md 2>/dev/null || true

# Remove packaging scripts
rm -rf scripts/package-addon.sh 2>/dev/null || true
rm -rf scripts/prepare-sfw-branch.sh 2>/dev/null || true

echo "========================================"
echo "SFW preparation complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Run 'npm run build' to verify build"
echo "2. Test the application"
echo "3. Commit changes to main branch"
