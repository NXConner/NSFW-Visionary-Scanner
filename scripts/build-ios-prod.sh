#!/bin/bash
# MorphoScan Pro - iOS Production Build Script
# This script builds and prepares the iOS app for App Store submission

set -e

echo "🍎 MorphoScan Pro - iOS Production Build"
echo "======================================="

# Configuration
BUILD_TYPE="release"
OUTPUT_DIR="ios-builds"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

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

    # Check if we're on macOS
    if [[ "$OSTYPE" != "darwin"* ]]; then
        log_error "iOS builds must be run on macOS with Xcode installed."
        exit 1
    fi

    # Check if Xcode is available
    if ! command -v xcodebuild &> /dev/null; then
        log_error "Xcode not found. Please install Xcode from the Mac App Store."
        exit 1
    fi

    # Check if Node.js dependencies are installed
    if [ ! -d "node_modules" ]; then
        log_error "Node.js dependencies not found. Run 'npm install' first."
        exit 1
    fi

    # Check if CocoaPods is available
    if ! command -v pod &> /dev/null; then
        log_warning "CocoaPods not found. Installing..."
        sudo gem install cocoapods
    fi

    log_success "Requirements check passed"
}

setup_environment() {
    log_info "Setting up build environment..."

    # Create output directory
    mkdir -p "$OUTPUT_DIR"

    # Clean previous builds
    rm -rf ios/App/build
    rm -rf dist

    log_success "Environment setup complete"
}

build_web_app() {
    log_info "Building web application..."

    # Build the web app
    npm run build

    if [ ! -d "dist" ]; then
        log_error "Web app build failed - dist directory not found"
        exit 1
    fi

    log_success "Web app built successfully"
}

sync_capacitor() {
    log_info "Syncing with Capacitor..."

    # Sync web assets to native projects
    npx cap sync ios

    log_success "Capacitor sync complete"
}

install_pods() {
    log_info "Installing CocoaPods dependencies..."

    cd ios/App
    pod install

    cd ../..
    log_success "CocoaPods installation complete"
}

build_ios() {
    log_info "Building iOS application..."

    # Navigate to iOS project directory
    cd ios/App

    # Clean and build
    xcodebuild clean -workspace App.xcworkspace -scheme App

    # Archive for App Store submission
    xcodebuild archive \
        -workspace App.xcworkspace \
        -scheme App \
        -archivePath "../$OUTPUT_DIR/MorphoScanPro.xcarchive" \
        -configuration Release \
        -destination generic/platform=iOS

    # Export IPA
    xcodebuild -exportArchive \
        -archivePath "../$OUTPUT_DIR/MorphoScanPro.xcarchive" \
        -exportOptionsPlist "../../ios-export-options.plist" \
        -exportPath "../$OUTPUT_DIR"

    cd ../..

    if [ -f "$OUTPUT_DIR/MorphoScanPro.ipa" ]; then
        log_success "IPA built: $OUTPUT_DIR/MorphoScanPro.ipa"
    else
        log_error "IPA build failed"
        exit 1
    fi
}

generate_export_options() {
    log_info "Generating export options..."

    # Validate Apple Team ID is set
    local team_id="${APPLE_TEAM_ID:-${DEVELOPMENT_TEAM}}"
    if [ -z "$team_id" ]; then
        log_error "APPLE_TEAM_ID or DEVELOPMENT_TEAM must be set for iOS export options"
        log_error "Team ID must be a valid Apple Team ID (e.g., 'ABCD123456')"
        exit 1
    fi

    # Validate Team ID format (should be alphanumeric, typically 10 characters)
    if [[ ! "$team_id" =~ ^[A-Z0-9]{10}$ ]]; then
        log_warning "Team ID format may be incorrect. Expected format: 10 alphanumeric characters (e.g., 'ABCD123456')"
        log_warning "Using provided Team ID: $team_id"
    fi

    cat > ios-export-options.plist << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>teamID</key>
    <string>${team_id}</string>
    <key>uploadBitcode</key>
    <false/>
    <key>compileBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <true/>
    <key>signingStyle</key>
    <string>automatic</string>
</dict>
</plist>
EOF

    log_success "Export options generated with Team ID: $team_id"
}

generate_build_info() {
    log_info "Generating build information..."

    local build_info="$OUTPUT_DIR/build-info-$TIMESTAMP.txt"

    cat > "$build_info" << EOF
MorphoScan Pro - iOS Build Information
=====================================

Build Timestamp: $TIMESTAMP
Build Type: $BUILD_TYPE
Git Commit: $(git rev-parse HEAD)
Git Branch: $(git branch --show-current)

Environment:
- Node.js: $(node --version)
- NPM: $(npm --version)
- Xcode: $(xcodebuild -version | head -1 | cut -d' ' -f2)
- CocoaPods: $(pod --version)

Build Configuration:
- Bundle ID: com.morphoscan.pro
- Version: $(grep "CFBundleShortVersionString" ios/App/App/Info.plist | sed 's/.*<string>\(.*\)<\/string>.*/\1/')
- Build: $(grep "CFBundleVersion" ios/App/App/Info.plist | sed 's/.*<string>\(.*\)<\/string>.*/\1/')

Security:
- Code Signing: ✅ Automatic signing configured
- Bitcode: ❌ Disabled for Capacitor compatibility
- Symbols: ✅ Upload enabled for crash reporting

Files Generated:
$(ls -la $OUTPUT_DIR/MorphoScanPro.*)

Validation Checklist:
□ Archive created successfully
□ IPA exported for App Store
□ Code signing certificates valid
□ Provisioning profiles active
□ TestFlight build available
□ Screenshots captured
□ App Store metadata ready

Next Steps:
1. Upload IPA to App Store Connect
2. Configure app metadata and screenshots
3. Test on TestFlight
4. Submit for App Review
5. Monitor review process

EOF

    log_success "Build information saved to: $build_info"
}

cleanup() {
    log_info "Cleaning up temporary files..."

    # Remove derived data and temporary files
    rm -rf ~/Library/Developer/Xcode/DerivedData/App-*
    rm -rf ios/App/build

    log_success "Cleanup complete"
}

main() {
    echo "Starting iOS production build..."

    check_requirements
    setup_environment
    build_web_app
    sync_capacitor
    install_pods
    generate_export_options
    build_ios
    generate_build_info
    cleanup

    echo ""
    log_success "🎉 iOS production build complete!"
    echo ""
    echo "Generated files in $OUTPUT_DIR/:"
    ls -la "$OUTPUT_DIR"/MorphoScanPro.*
    echo ""
    log_info "Ready for App Store Connect submission"
}

# Handle command line arguments
case "${1:-build}" in
    "build")
        main
        ;;
    "clean")
        cleanup
        log_success "Clean complete"
        ;;
    *)
        log_error "Usage: $0 [build|clean]"
        exit 1
        ;;
esac
