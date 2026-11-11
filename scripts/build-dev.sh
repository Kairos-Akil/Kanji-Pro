#!/usr/bin/env bash
# Release APK (the one published on GitHub): release build type, JS minified and bundled in,
# signed with my release key (see plugins/withReleaseSigning.js; the build stops if the key
# isn't set up in ~/.gradle/gradle.properties).
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
