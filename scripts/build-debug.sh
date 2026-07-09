#!/usr/bin/env bash
# Debug build: unminified/debuggable JS, but still fully standalone (no Metro,
# no network, no account needed) — the JS bundle is embedded in the APK like the
# release builds, just without optimizations. Slowest of the three to build.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f android/gradlew ]; then
    echo "No native android project found, running expo prebuild..."
    npx expo prebuild --platform android
fi

# By default RNGP skips embedding the JS bundle for the debug variant and expects
# Metro instead. Force it to bundle in debug too, so this APK never needs Metro.
GRADLE_FILE=android/app/build.gradle
if ! grep -q "^\s*debuggableVariants = \[\]" "$GRADLE_FILE"; then
    sed -i '/^react {/a\    debuggableVariants = []  // force JS bundling into debug builds so no Metro is needed' "$GRADLE_FILE"
fi

export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"

cd android
./gradlew assembleDebug

echo ""
echo "Done: android/app/build/outputs/apk/debug/app-debug.apk"
echo "Standalone — install and run it directly, no Metro/dev server needed."
