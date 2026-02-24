#!/bin/bash
set -e

echo "=== MagicQC Container Entrypoint ==="

# ---------------------------------------------------------------------------
# Sync Vite build assets from the Docker image to the bind-mounted volume.
# We delete-then-copy (not no-clobber) so the bind mount ALWAYS matches
# what was built inside the Docker image. This prevents stale JS/CSS from
# surviving across rebuilds.
# ---------------------------------------------------------------------------
if [ -d "/tmp/build-output" ]; then
    echo "Syncing Vite build assets..."
    rm -rf /var/www/public/build
    cp -r /tmp/build-output /var/www/public/build
fi

# ---------------------------------------------------------------------------
# Sync vendor dependencies from the Docker image to the bind-mounted volume.
# Same delete-then-copy strategy. This is the ROOT FIX for the recurring
# "Class not found" errors — cp -rfn (no-clobber) was silently keeping
# stale vendor files that didn't match the current composer.lock.
# ---------------------------------------------------------------------------
if [ -d "/tmp/vendor-output" ]; then
    echo "Syncing vendor dependencies..."
    rm -rf /var/www/vendor
    cp -r /tmp/vendor-output /var/www/vendor
fi

# ---------------------------------------------------------------------------
# Clear Laravel's bootstrap cache on every boot. These files cache
# discovered service providers and package configs. If they reference
# classes from an older version of a package (e.g. Lighthouse), Laravel
# crashes before any artisan command can run — making it impossible to
# fix from inside the container.
# ---------------------------------------------------------------------------
echo "Clearing bootstrap cache..."
rm -f /var/www/bootstrap/cache/packages.php \
      /var/www/bootstrap/cache/services.php \
      /var/www/bootstrap/cache/config.php

echo "Entrypoint complete, starting: $@"

# Execute the CMD passed to the container (php-fpm or queue:work)
exec "$@"
