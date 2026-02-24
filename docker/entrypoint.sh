#!/bin/bash
set -e

echo "=== MagicQC Container Entrypoint ==="

# ---------------------------------------------------------------------------
# RACE CONDITION FIX:
# Both 'app' and 'worker' share the bind mount ./:/var/www.
# The lock file MUST be on the shared mount — /tmp is per-container and
# flock there does nothing. /var/www/.deploy.lock is visible to both.
# ---------------------------------------------------------------------------
LOCKFILE="/var/www/.deploy.lock"

(
    flock -x -w 120 200

    # Use a marker to avoid re-syncing if this container already did it
    IMAGE_ID=$(cat /proc/self/cgroup 2>/dev/null | head -1 | sed 's/.*\///' | cut -c1-12)
    MARKER="/var/www/.last_sync_hash"
    BUILD_HASH=$(md5sum /tmp/vendor-output/autoload.php 2>/dev/null | awk '{print $1}' || echo "none")
    CURRENT_HASH=$(cat "$MARKER" 2>/dev/null || echo "")

    if [ "$BUILD_HASH" != "$CURRENT_HASH" ]; then
        echo "Syncing Vite build assets..."
        if [ -d "/tmp/build-output" ]; then
            rm -rf /var/www/public/build
            cp -r /tmp/build-output /var/www/public/build
        fi

        echo "Syncing vendor dependencies..."
        if [ -d "/tmp/vendor-output" ]; then
            rm -rf /var/www/vendor
            cp -r /tmp/vendor-output /var/www/vendor
        fi

        echo "Clearing bootstrap cache..."
        rm -f /var/www/bootstrap/cache/packages.php \
              /var/www/bootstrap/cache/services.php \
              /var/www/bootstrap/cache/config.php

        echo "$BUILD_HASH" > "$MARKER"
        echo "Sync complete."
    else
        echo "Already synced, skipping."
    fi

) 200>"$LOCKFILE"

echo "Entrypoint complete, starting: $@"
exec "$@"
