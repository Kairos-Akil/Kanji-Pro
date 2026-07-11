#!/usr/bin/env bash
# Regenerates the native android/ project when it's missing or stale. android/ is a
# generated snapshot of app.json (version, icons, package id, ...) — Gradle reads only
# the snapshot, so building with a stale one silently ships outdated config.
set -euo pipefail

# Files whose changes only reach the APK through a fresh prebuild.
NATIVE_INPUTS=(app.json assets/MyAssets/blueLogo.png)

needs_prebuild=false
if [ ! -f android/gradlew ]; then
    echo "No native android project found."
    needs_prebuild=true
else
    for f in "${NATIVE_INPUTS[@]}"; do
        if [ "$f" -nt android/app/build.gradle ]; then
            echo "$f changed since the last prebuild."
            needs_prebuild=true
            break
        fi
    done
fi

if $needs_prebuild; then
    echo "Regenerating native project (expo prebuild --clean)..."
    npx expo prebuild --platform android --clean --no-install
fi
