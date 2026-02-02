@echo off
REM MorphoScan Android Build Script for Windows
REM This script builds the Android APK using Capacitor

echo.
echo ======================================
echo  MorphoScan Android Build Script
echo ======================================
echo.

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check Android SDK
if "%ANDROID_HOME%"=="" (
    if "%ANDROID_SDK_ROOT%"=="" (
        echo [WARNING] ANDROID_HOME or ANDROID_SDK_ROOT not set
        echo           Make sure Android Studio is installed with SDK
    )
)

echo.
echo [1/5] Installing dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [2/5] Building web app (NSFW direct)...
call npm run build:nsfw:direct
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to build web app
    pause
    exit /b 1
)

echo.
echo [3/5] Adding Android platform (if not exists)...
if not exist "android" (
    call npx cap add android
) else (
    echo        Android platform already exists
)

echo.
echo [4/5] Syncing Capacitor...
call npx cap sync android
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to sync Capacitor
    pause
    exit /b 1
)

echo.
echo [5/5] Building Android APK...
cd android

if exist "gradlew.bat" (
    echo.
    echo Building Debug APK...
    call gradlew.bat assembleDebug
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to build Debug APK
        cd ..
        pause
        exit /b 1
    )
    
    echo.
    echo Building Release APK...
    call gradlew.bat assembleRelease
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to build Release APK
        cd ..
        pause
        exit /b 1
    )
    
    echo.
    echo ======================================
    echo  BUILD COMPLETE!
    echo ======================================
    echo.
    echo APK Locations:
    echo   Debug:   android\app\build\outputs\apk\debug\app-debug.apk
    echo   Release: android\app\build\outputs\apk\release\app-release-unsigned.apk
    echo.
    echo To sign the release APK for Play Store, run:
    echo   gradlew.bat bundleRelease
) else (
    echo [ERROR] gradlew.bat not found. Please open the project in Android Studio first.
    cd ..
    pause
    exit /b 1
)

cd ..
echo.
echo Done! Your APK files are ready.
pause
