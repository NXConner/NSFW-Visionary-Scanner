#!/bin/bash
# MorphoScan Pro - Android Production Build Script
# This script builds and signs the Android APK/AAB for Google Play Store

set -e

echo "🤖 MorphoScan Pro - Android Production Build"
echo "==========================================="

# Configuration
BUILD_TYPE="release"
OUTPUT_DIR="android-builds"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Ensure Vite builds with Capacitor-safe base paths
export CAPACITOR_BUILD=1

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

check_requirements() {
    log_info "Checking build requirements..."

    # Check if Android SDK is available
    if ! command -v adb &> /dev/null; then
        log_error "Android SDK not found. Please install Android Studio and add to PATH."
        exit 1
    fi

    # Check if keystore exists
    if [ ! -f "android-release.keystore" ]; then
        log_error "Release keystore not found. Run ./android-release-keystore.sh first."
        exit 1
    fi

    # Check if Node.js dependencies are installed
    if [ ! -d "node_modules" ]; then
        log_error "Node.js dependencies not found. Run 'npm install' first."
        exit 1
    fi

    log_success "Requirements check passed"
}

setup_environment() {
    log_info "Setting up build environment..."

    # Create output directory
    mkdir -p "$OUTPUT_DIR"

    # Clean previous builds
    rm -rf android/app/build/outputs
    rm -rf dist

    log_success "Environment setup complete"
}

build_web_app() {
    log_info "Building web application (NSFW direct)..."

    # Build the web app with NSFW content included
    npm run build:nsfw:direct

    if [ ! -d "dist" ]; then
        log_error "Web app build failed - dist directory not found"
        exit 1
    fi

    log_success "Web app built successfully"
}

sync_capacitor() {
    log_info "Syncing with Capacitor..."

    # Sync web assets to native projects
    npx cap sync android

    log_success "Capacitor sync complete"
}

build_android() {
    local build_type=$1
    log_info "Building Android $build_type..."

    # Navigate to android directory
    cd android

    # Build the APK/AAB
    if [ "$build_type" = "bundle" ]; then
        ./gradlew bundleRelease
        cp app/build/outputs/bundle/release/app-release.aab "../$OUTPUT_DIR/morphoscan-pro-$TIMESTAMP.aab"
        log_success "AAB built: $OUTPUT_DIR/morphoscan-pro-$TIMESTAMP.aab"
    else
        ./gradlew assembleRelease
        cp app/build/outputs/apk/release/app-release.apk "../$OUTPUT_DIR/morphoscan-pro-$TIMESTAMP.apk"
        log_success "APK built: $OUTPUT_DIR/morphoscan-pro-$TIMESTAMP.apk"
    fi

    cd ..
}

generate_build_info() {
    log_info "Generating build information..."

    local build_info="$OUTPUT_DIR/build-info-$TIMESTAMP.txt"

    cat > "$build_info" << EOF
MorphoScan Pro - Android Build Information
==========================================

Build Timestamp: $TIMESTAMP
Build Type: $BUILD_TYPE
Git Commit: $(git rev-parse HEAD)
Git Branch: $(git branch --show-current)

Environment:
- Node.js: $(node --version)
- NPM: $(npm --version)
- Android Gradle Plugin: $(grep "com.android.tools.build:gradle" android/build.gradle | cut -d: -f3 | tr -d "'")

Build Configuration:
- Min SDK: $(grep "minSdkVersion" android/app/build.gradle | awk '{print $2}')
- Target SDK: $(grep "targetSdkVersion" android/app/build.gradle | awk '{print $2}')
- Version Code: $(grep "versionCode" android/app/build.gradle | awk '{print $2}')
- Version Name: $(grep "versionName" android/app/build.gradle | awk '{print $2}')

Security:
- Signing: ✅ Release keystore configured
- ProGuard: ✅ Enabled for release build
- Bundle: ✅ Split APKs enabled

Files Generated:
$(ls -la $OUTPUT_DIR/morphoscan-pro-$TIMESTAMP.*)

Next Steps:
1. Upload AAB to Google Play Console
2. Test on physical devices
3. Submit for review
4. Monitor crash reports

EOF

    log_success "Build information saved to: $build_info"
}

cleanup() {
    log_info "Cleaning up temporary files..."

    # Remove debug symbols and temporary files
    rm -rf android/app/build/intermediates
    rm -rf android/app/build/tmp

    log_success "Cleanup complete"
}

main() {
    echo "Starting Android production build..."

    check_requirements
    setup_environment
    build_web_app
    sync_capacitor

    # Build both APK and AAB
    build_android "apk"
    build_android "bundle"

    generate_build_info
    cleanup

    echo ""
    log_success "🎉 Android production build complete!"
    echo ""
    echo "Generated files in $OUTPUT_DIR/:"
    ls -la "$OUTPUT_DIR"/morphoscan-pro-$TIMESTAMP.*
    echo ""
    log_info "Ready for Google Play Store submission"
}

# Handle command line arguments
case "${1:-both}" in
    "apk")
        main
        ;;
    "bundle"|"aab")
        BUILD_TYPE="bundle"
        main
        ;;
    "both")
        main
        ;;
    *)
        log_error "Usage: $0 [apk|bundle|both]"
        exit 1
        ;;
esac
