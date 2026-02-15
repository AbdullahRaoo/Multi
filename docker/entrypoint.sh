#!/bin/sh
set -e

ENV_FILE="/var/www/html/.env"
ENV_PERSIST="/var/www/html/.env-data/.env"

echo ">> MagicQC entrypoint starting..."

# ── Step 1: Get .env file ready ──
if [ -f "$ENV_PERSIST" ]; then
    echo ">> Restoring persisted .env from volume..."
    cp "$ENV_PERSIST" "$ENV_FILE"
else
    echo ">> First boot: creating .env from .env.production..."
    if [ -f /var/www/html/.env.production ]; then
        cp /var/www/html/.env.production "$ENV_FILE"
    else
        echo ">> ERROR: No .env.production found!"
        exit 1
    fi

    # Generate APP_KEY if empty or missing
    if ! grep -q '^APP_KEY=base64:' "$ENV_FILE" 2>/dev/null; then
        echo ">> Generating application key..."
        php artisan key:generate --force --no-interaction
    fi

    # Persist .env to volume so the key survives container recreations
    mkdir -p "$(dirname "$ENV_PERSIST")"
    cp "$ENV_FILE" "$ENV_PERSIST"
    echo ">> .env persisted to volume."
fi

# ── Step 2: Verify APP_KEY is actually set ──
APP_KEY_VALUE=$(grep '^APP_KEY=' "$ENV_FILE" | head -1 | cut -d= -f2-)
echo ">> APP_KEY starts with: $(echo "$APP_KEY_VALUE" | head -c 10)..."
if [ -z "$APP_KEY_VALUE" ] || [ "$APP_KEY_VALUE" = "" ]; then
    echo ">> APP_KEY is empty — generating now..."
    php artisan key:generate --force --no-interaction
    cp "$ENV_FILE" "$ENV_PERSIST"
fi

# ── Step 3: Cache configuration ──
echo ">> Caching configuration..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# ── Step 4: Verify the cached config has the key ──
CACHED_KEY=$(php artisan tinker --execute="echo config('app.key');" 2>/dev/null || echo "FAILED")
echo ">> Cached APP_KEY starts with: $(echo "$CACHED_KEY" | head -c 10)..."

# ── Step 5: Run migrations ──
echo ">> Running migrations..."
php artisan migrate --force 2>/dev/null || echo ">> Migration skipped (DB may not be ready)"

# ── Step 6: Storage link ──
php artisan storage:link 2>/dev/null || true

# ── Step 7: Permissions ──
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache 2>/dev/null || true

echo ">> ✅ Ready! Starting PHP-FPM..."
exec php-fpm
