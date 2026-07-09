#!/usr/bin/env bash
# Fully prod build: release build type, packaged as an .aab (Android App Bundle) —
# the format Google Play requires for store submission.
# NOTE: this still uses the default debug keystore unless you configure a release
# signing config in android/app/build.gradle — fine for local testing, but the Play
# Store requires the same signing key on every future update, so set that up
# (or use Play App Signing) before your first real store upload.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f android/gradlew ]; then
    echo "No native android project found, running expo prebuild..."
    npx expo prebuild --platform android
fi

export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"

cd android
./gradlew bundleRelease

echo ""
echo "Done: android/app/build/outputs/bundle/release/app-release.aab"
echo "This is the file you upload to the Google Play Console."
