#!/bin/bash

# MorphoScan Android Build Script
# This script builds the Android APK using Capacitor

set -e

echo "🚀 MorphoScan Android Build Script"
echo "=================================="

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js first."
    exit 1
fi

# Check if Android SDK is available
if [ -z "$ANDROID_HOME" ] && [ -z "$ANDROID_SDK_ROOT" ]; then
    echo "⚠️  Warning: ANDROID_HOME or ANDROID_SDK_ROOT not set"
    echo "   Make sure Android Studio is installed with SDK"
fi

echo ""
echo "📦 Step 1: Installing dependencies..."
npm install

echo ""
echo "🔧 Setting Capacitor build mode..."
export CAPACITOR_BUILD=1

echo ""
echo "🔧 Step 2: Building web app (NSFW direct)..."
npm run build:nsfw:direct

echo ""
echo "📱 Step 3: Adding Android platform (if not exists)..."
if [ ! -d "android" ]; then
    npx cap add android
else
    echo "   Android platform already exists"
fi

echo ""
echo "🔄 Step 4: Syncing Capacitor..."
npx cap sync android

echo ""
echo "🏗️  Step 5: Building Android APK..."
cd android

# Check if gradlew exists and is executable
if [ -f "gradlew" ]; then
    chmod +x gradlew
    
    echo ""
    echo "Building Debug APK..."
    ./gradlew assembleDebug
    
    echo ""
    echo "Building Release APK..."
    ./gradlew assembleRelease
    
    echo ""
    echo "✅ Build Complete!"
    echo ""
    echo "📍 APK Locations:"
    echo "   Debug:   android/app/build/outputs/apk/debug/app-debug.apk"
    echo "   Release: android/app/build/outputs/apk/release/app-release-unsigned.apk"
    echo ""
    echo "💡 To sign the release APK for Play Store, run:"
    echo "   ./gradlew bundleRelease"
else
    echo "❌ gradlew not found. Please open the project in Android Studio first."
    exit 1
fi

cd ..
echo ""
echo "🎉 Done! Your APK files are ready."
