#!/bin/bash
set -e

echo "=== MagicQC Container Entrypoint ==="

# ---------------------------------------------------------------------------
# RACE CONDITION FIX:
# Both the 'app' and 'worker' containers share the same bind mount (./:/var/www).
# They both run this entrypoint simultaneously. Without mutual exclusion,
# one container deletes vendor/ while the other is trying to use it.
#
# flock ensures only ONE container syncs at a time. The second container
# blocks here until the first finishes, then syncs harmlessly (same files).
# ---------------------------------------------------------------------------
LOCKFILE="/tmp/.entrypoint.lock"

(
    flock -x 200

    # Sync Vite build assets from the Docker image to the bind-mounted volume.
    if [ -d "/tmp/build-output" ]; then
        echo "Syncing Vite build assets..."
        rm -rf /var/www/public/build
        cp -r /tmp/build-output /var/www/public/build
    fi

    # Sync vendor dependencies from the Docker image to the bind-mounted volume.
    if [ -d "/tmp/vendor-output" ]; then
        echo "Syncing vendor dependencies..."
        rm -rf /var/www/vendor
        cp -r /tmp/vendor-output /var/www/vendor
    fi

    # Clear Laravel's bootstrap cache on every boot to prevent stale
    # service provider references from crashing the container.
    echo "Clearing bootstrap cache..."
    rm -f /var/www/bootstrap/cache/packages.php \
          /var/www/bootstrap/cache/services.php \
          /var/www/bootstrap/cache/config.php

) 200>"$LOCKFILE"

echo "Entrypoint complete, starting: $@"

# Execute the CMD passed to the container (php-fpm or queue:work)
exec "$@"
