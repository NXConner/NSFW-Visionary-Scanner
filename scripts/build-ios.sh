#!/bin/bash

# MorphoScan iOS Build Script
# This script builds the iOS app using Capacitor

set -e

echo "🍎 MorphoScan iOS Build Script"
echo "=============================="

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ iOS builds require macOS with Xcode installed."
    exit 1
fi

# Check if Xcode is installed
if ! command -v xcodebuild &> /dev/null; then
    echo "❌ Xcode is not installed. Please install Xcode from the App Store."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js first."
    exit 1
fi

echo ""
echo "📦 Step 1: Installing dependencies..."
npm install

echo ""
echo "🔧 Step 2: Building web app..."
npm run build

echo ""
echo "📱 Step 3: Adding iOS platform (if not exists)..."
if [ ! -d "ios" ]; then
    npx cap add ios
else
    echo "   iOS platform already exists"
fi

echo ""
echo "🔄 Step 4: Syncing Capacitor..."
npx cap sync ios

echo ""
echo "📝 Step 5: Installing CocoaPods dependencies..."
cd ios/App
if command -v pod &> /dev/null; then
    pod install
else
    echo "⚠️  CocoaPods not installed. Run: sudo gem install cocoapods"
fi
cd ../..

echo ""
echo "🏗️  Step 6: Building iOS App..."

# Build for simulator (debug)
echo ""
echo "Building for Simulator (Debug)..."
xcodebuild -workspace ios/App/App.xcworkspace \
    -scheme App \
    -configuration Debug \
    -destination 'generic/platform=iOS Simulator' \
    -derivedDataPath ios/build \
    build 2>&1 | tail -20

echo ""
echo "✅ Build Complete!"
echo ""
echo "📍 To build for App Store:"
echo "   1. Open ios/App/App.xcworkspace in Xcode"
echo "   2. Select your team in Signing & Capabilities"
echo "   3. Product > Archive"
echo "   4. Distribute App > App Store Connect"
echo ""
echo "💡 Quick commands:"
echo "   Open in Xcode:  npx cap open ios"
echo "   Run on device:  npx cap run ios"
echo ""
echo "🎉 Done!"
