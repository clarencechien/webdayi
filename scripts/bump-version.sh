#!/bin/bash

# WebDaYi Version Bump Script
# Usage: ./bump-version.sh <major|minor|patch> [release-name]

set -e

VERSION_FILE="mvp1/version.json"
INDEX_FILE="mvp1/index.html"

if [ ! -f "$VERSION_FILE" ]; then
  echo "Error: $VERSION_FILE not found"
  exit 1
fi

# Get current version
CURRENT_VERSION=$(cat $VERSION_FILE | grep '"version"' | head -1 | cut -d'"' -f4)
echo "Current version: $CURRENT_VERSION"

# Parse version
IFS='.' read -ra VERSION_PARTS <<< "$CURRENT_VERSION"
MAJOR="${VERSION_PARTS[0]}"
MINOR="${VERSION_PARTS[1]}"
PATCH="${VERSION_PARTS[2]}"

# Determine bump type
BUMP_TYPE="${1:-patch}"
RELEASE_NAME="${2:-Release}"

case "$BUMP_TYPE" in
  major)
    MAJOR=$((MAJOR + 1))
    MINOR=0
    PATCH=0
    ;;
  minor)
    MINOR=$((MINOR + 1))
    PATCH=0
    ;;
  patch)
    PATCH=$((PATCH + 1))
    ;;
  *)
    echo "Usage: $0 <major|minor|patch> [release-name]"
    exit 1
    ;;
esac

NEW_VERSION="${MAJOR}.${MINOR}.${PATCH}"
BUILD_DATE=$(date -u +"%Y%m%d-%H%M")
COMMIT_SHORT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

echo "New version: $NEW_VERSION"
echo "Build: $BUILD_DATE"
echo "Commit: $COMMIT_SHORT"
echo "Release: $RELEASE_NAME"

# Update version.json
echo "Updating $VERSION_FILE..."
sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$NEW_VERSION\"/" $VERSION_FILE
sed -i "s/\"build\": \"[^\"]*\"/\"build\": \"$BUILD_DATE\"/" $VERSION_FILE
sed -i "s/\"buildDate\": \"[^\"]*\"/\"buildDate\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"/" $VERSION_FILE
sed -i "s/\"commit\": \"[^\"]*\"/\"commit\": \"$COMMIT_SHORT\"/" $VERSION_FILE
sed -i "s/\"releaseName\": \"[^\"]*\"/\"releaseName\": \"$RELEASE_NAME\"/" $VERSION_FILE

# Update index.html meta tags
echo "Updating $INDEX_FILE meta tags..."
sed -i "s/<meta name=\"app-version\" content=\"[^\"]*\">/<meta name=\"app-version\" content=\"$NEW_VERSION\">/" $INDEX_FILE
sed -i "s/<meta name=\"app-build\" content=\"[^\"]*\">/<meta name=\"app-build\" content=\"$BUILD_DATE\">/" $INDEX_FILE
sed -i "s/<meta name=\"app-commit\" content=\"[^\"]*\">/<meta name=\"app-commit\" content=\"$COMMIT_SHORT\">/" $INDEX_FILE
sed -i "s/<meta name=\"app-release\" content=\"[^\"]*\">/<meta name=\"app-release\" content=\"$RELEASE_NAME\">/" $INDEX_FILE

# Update index.html title
sed -i "s/<title>WebDaYi ([^)]*) - MVP 1.0 v[0-9.]*<\/title>/<title>WebDaYi (網頁大易輸入法) - MVP 1.0 v$NEW_VERSION<\/title>/" $INDEX_FILE

# Update window.WEBDAYI_VERSION
sed -i "s/version: '[^']*'/version: '$NEW_VERSION'/" $INDEX_FILE
sed -i "s/build: '[^']*'/build: '$BUILD_DATE'/" $INDEX_FILE
sed -i "s/commit: '[^']*'/commit: '$COMMIT_SHORT'/" $INDEX_FILE
sed -i "s/releaseName: '[^']*'/releaseName: '$RELEASE_NAME'/" $INDEX_FILE

echo ""
echo "✅ Version bumped successfully!"
echo ""
echo "Next steps:"
echo "1. Review changes: git diff $VERSION_FILE $INDEX_FILE"
echo "2. Commit: git add $VERSION_FILE $INDEX_FILE && git commit -m 'chore: bump version to $NEW_VERSION'"
echo "3. Push: git push"
