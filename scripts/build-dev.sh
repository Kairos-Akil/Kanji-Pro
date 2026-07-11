#!/usr/bin/env bash
# Optimized dev build ("quasi prod"): release build type, JS minified and bundled in,
# signed with the default debug keystore so it installs straight on any device without
# extra setup. Good for real-device testing / sharing an installable APK with others.
set -euo pipefail
cd "$(dirname "$0")/.."

# Regenerate android/ if app.json or the logo changed since the last prebuild.
bash scripts/ensure-native.sh

export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"

cd android
./gradlew assembleRelease

echo ""
echo "Done: android/app/build/outputs/apk/release/app-release.apk"
echo "This APK is standalone (no Metro needed) — install it directly on a device."
