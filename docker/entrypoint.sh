#!/bin/bash
set -e

# Create directories if they don't exist
mkdir -p /var/www/public/build
mkdir -p /var/www/vendor

# Copy built assets from image backup to the bind-mounted volume
if [ -d "/tmp/build-output" ]; then
    echo "Copying Vite build assets to public/build..."
    cp -rf /tmp/build-output/* /var/www/public/build/
fi

if [ -d "/tmp/vendor-output" ]; then
    echo "Copying vendor dependencies..."
    cp -rf /tmp/vendor-output/* /var/www/vendor/
fi

echo "Entrypoint complete, starting: $@"

# Execute the original command
exec "$@"
