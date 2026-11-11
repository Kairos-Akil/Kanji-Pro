#!/usr/bin/env bash
# Fully prod build: release build type, packaged as an .aab (Android App Bundle) —
# the format Google Play requires for store submission.
# Signed with my release key (see plugins/withReleaseSigning.js). For Play, choose Play App
# Signing with "use my own key", so the Play and GitHub versions share one key.
set -euo pipefail
cd "$(dirname "$0")/.."

# Regenerate android/ if app.json or the logo changed since the last prebuild.
bash scripts/ensure-native.sh

export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"

cd android
./gradlew bundleRelease

echo ""
echo "Done: android/app/build/outputs/bundle/release/app-release.aab"
echo "This is the file you upload to the Google Play Console."
