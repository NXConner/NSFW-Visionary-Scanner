#!/bin/bash
# Android Release Keystore Generation Script
# Run this script to generate production signing keys for Google Play Store

set -e

echo "🔐 MorphoScan Pro - Android Release Keystore Generator"
echo "======================================================"

# Configuration
KEYSTORE_FILE="android-release.keystore"
KEY_ALIAS="morphoscan_pro"
VALIDITY_DAYS=36500  # 100 years
KEY_SIZE=4096

# Check if keystore already exists
if [ -f "$KEYSTORE_FILE" ]; then
    echo "⚠️  Keystore file '$KEYSTORE_FILE' already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Operation cancelled."
        exit 1
    fi
fi

echo "📝 Please provide the following information for your keystore:"
echo ""

# Collect keystore information
read -p "First and Last Name (e.g., John Doe): " NAME
read -p "Organizational Unit (e.g., Development): " ORG_UNIT
read -p "Organization Name (e.g., Your Company): " ORG_NAME
read -p "City or Locality: " CITY
read -p "State or Province: " STATE
read -p "Country Code (e.g., US): " COUNTRY
read -s -p "Keystore Password (will be hidden): " STORE_PASSWORD
echo
read -s -p "Key Password (will be hidden, press Enter to use keystore password): " KEY_PASSWORD
echo

# Use keystore password for key if not provided
if [ -z "$KEY_PASSWORD" ]; then
    KEY_PASSWORD="$STORE_PASSWORD"
fi

# Generate keystore
echo ""
echo "🔄 Generating keystore..."
keytool -genkeypair \
    -v \
    -keystore "$KEYSTORE_FILE" \
    -alias "$KEY_ALIAS" \
    -keyalg RSA \
    -keysize $KEY_SIZE \
    -validity $VALIDITY_DAYS \
    -dname "CN=$NAME, OU=$ORG_UNIT, O=$ORG_NAME, L=$CITY, ST=$STATE, C=$COUNTRY" \
    -storepass "$STORE_PASSWORD" \
    -keypass "$KEY_PASSWORD"

echo ""
echo "✅ Keystore generated successfully!"
echo ""
echo "📋 IMPORTANT: Save this information securely (do not commit to version control):"
echo "======================================================"
echo "Keystore File: $KEYSTORE_FILE"
echo "Key Alias: $KEY_ALIAS"
echo "Store Password: [REDACTED - Keep this secure]"
echo "Key Password: [REDACTED - Keep this secure]"
echo "======================================================"
echo ""
echo "🔒 Security Recommendations:"
echo "• Store passwords in a secure password manager"
echo "• Keep the keystore file in a secure location"
echo "• Create backup copies of the keystore"
echo "• Never commit keystore files to version control"
echo ""
echo "📱 Next Steps:"
echo "1. Move keystore to android/app/ directory"
echo "2. Update android/gradle.properties with signing config"
echo "3. Configure build.gradle for release signing"
echo ""

# Create backup reminder
echo "💾 Backup Reminder:"
echo "Create encrypted backups of your keystore and passwords."
echo "Store backups in multiple secure locations."
