# MagicQC Server Troubleshooting: 502 Bad Gateway & Lighthouse GraphQL Errors (Feb 2026)

This document extracts the conversation context and troubleshooting steps taken to resolve a sequence of deployment errors on the `magicqc.online` VPS.

## Context

After a routine `git pull` and `docker-compose build` process, the production server began returning **502 Bad Gateway** errors. The `nginx` container was running perfectly, but it was unable to communicate with PHP-FPM inside the `app` container on port 9000.

## Issue 1: Entrypoint Script Crashing

**The Error:**
The `app` container was instantly crashing upon startup, meaning PHP-FPM never turned on.
```
cp: cannot create regular file '/var/www/public/build/assets/ArticleController-CEadPfBp.js': File exists
```

**The Cause:**
The `docker/entrypoint.sh` script executes every single time the container boots. It attempts to copy Vite build assets from `/tmp/build-output` to the bind-mounted `/var/www/public/build` directory using `cp -rf`. Because the files already existed from a previous successful run, and because of Linux host volume permissions versus the internal `root` user, `cp` threw a "Permission denied / File exists" error. This caused the script to panic and exit, taking the container down with it.

**The Fix:**
Modified `docker/entrypoint.sh` to use the `-n` (no-clobber) flag instead of `-f` (force).
```diff
- cp -rf /tmp/build-output/* /var/www/public/build/
+ cp -rfn /tmp/build-output/* /var/www/public/build/
```
This tells the script to gracefully skip files that already exist, rather than crashing.

---

## Issue 2: Composer Timeout During Docker Build

**The Error:**
When running `docker-compose build app`, the `composer install` step hung indefinitely, eventually throwing:
```
A connection timeout was encountered. If you intend to run Composer without connecting to the internet, run the command again prefixed with COMPOSER_DISABLE_NETWORK=1 to make Composer run in offline mode.
```

**The Cause:**
This is a common Linux Docker networking issue where the temporary build container loses DNS resolution or attempts to use IPv6 to reach `packagist.org`. When the invisible Docker network bridge blocks or drops the IPv6 packet, Composer hangs until it times out 15 seconds later before falling back to IPv4. Doing this for 90 packages makes the build take 20+ minutes.

**The Fix:**
Instructed Composer to strictly use IPv4 from the beginning by modifying the `Dockerfile`:
```diff
- RUN composer install --no-interaction --optimize-autoloader --no-dev
+ RUN COMPOSER_IPRESOLVE=4 composer install --no-interaction --optimize-autoloader --no-dev
```

---

## Issue 3: Lighthouse "QueryComplexity" Not Found

**The Error:**
Even after the entrypoint fix, the `worker` container was stuck in a rapid restart loop, throwing this fatal error in its logs:
```
Class "GraphQL\Validator\Rules\QueryComplexity" not found
```
Because the worker crashing destabilized Laravel's internal boot sequence, the `app` container sometimes successfully started PHP-FPM, but failed to actually serve Nginx requests, keeping the 502 error alive.

**The Cause:**
A recent update to the `nuwave/lighthouse` GraphQL package (likely migrating from v5 to v6) completely removed deprecated validation classes like `QueryComplexity` and `QueryDepth`. However, the local `config/lighthouse.php` file was still trying to load these deleted classes in its `security` array.

**The Fix:**
Replaced the deprecated constant calls with absolute integers (`0` for unlimited) in `config/lighthouse.php`:
```diff
    'security' => [
-        'max_query_complexity' => GraphQL\Validator\Rules\QueryComplexity::DISABLED,
-        'max_query_depth' => GraphQL\Validator\Rules\QueryDepth::DISABLED,
+        'max_query_complexity' => 0,
+        'max_query_depth' => 0,
        'disable_introspection' => (bool) env('LIGHTHOUSE_SECURITY_DISABLE_INTROSPECTION', false)
            ? \GraphQL\Validator\Rules\DisableIntrospection::ENABLED
-            : GraphQL\Validator\Rules\DisableIntrospection::DISABLED,
+            : 0,
    ],
```

---

## Issue 4: Lighthouse "DebugFlag" Not Found

**The Error:**
After pulling the first config fix, the worker container generated a nearly identical error:
```
Class "GraphQL\Error\DebugFlag" not found
```

**The Cause:**
The same Lighthouse package upgrade also removed the `DebugFlag` class used to configure error reporting.

**The Fix:**
Replaced the compound bitwise flags with the hardcoded integer `3` (which represents `INCLUDE_DEBUG_MESSAGE | INCLUDE_TRACE`) in `config/lighthouse.php`:
```diff
-    'debug' => env('LIGHTHOUSE_DEBUG', GraphQL\Error\DebugFlag::INCLUDE_DEBUG_MESSAGE | GraphQL\Error\DebugFlag::INCLUDE_TRACE),
+    'debug' => env('LIGHTHOUSE_DEBUG', 3),
```

---

## Issue 5: Cached LighthouseServiceProvider Crashing Container

**The Error:**
After pulling the final `config/lighthouse.php` fix, attempting to clear the Laravel configuration caches via `docker-compose exec app php artisan config:clear` failed because Laravel crashed beforehand:
```
Class "Nuwave\Lighthouse\LighthouseServiceProvider" not found
```

**The Cause:**
In modern versions of the Lighthouse package, the main service provider class was renamed or moved. However, Laravel aggressively caches its discovered packages inside the server's filesystem at `bootstrap/cache/packages.php`.
Even though the actual Lighthouse package was updated, Laravel read the old, hard-coded cache file on boot, looked for the deleted provider class, and instantly crashed—preventing any artisan commands (including `cache:clear`) from running.

**The Fix:**
Since Laravel couldn't boot to run its own `cache:clear` command, the corrupt cache files had to be manually deleted from the host machine using `sudo` to bypass the Docker container's file ownership (`www-data`/`root`):

```bash
sudo rm -f bootstrap/cache/packages.php bootstrap/cache/services.php bootstrap/cache/config.php
docker-compose restart app worker
```
Upon restart, Laravel cleanly discovered the updated Lighthouse Service Providers, the containers stabilized, and the 502 Bad Gateway was resolved.
