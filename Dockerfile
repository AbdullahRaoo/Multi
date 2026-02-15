# Stage 1: Build frontend
FROM node:20-alpine AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN DOCKER_BUILD=1 npm run build

# Stage 2: Install PHP dependencies
FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-scripts --no-interaction
COPY . .
RUN composer dump-autoload --optimize

# Stage 3: Production PHP-FPM
FROM php:8.2-fpm-alpine

# Install PHP extensions
RUN apk add --no-cache \
    libpng-dev libjpeg-turbo-dev freetype-dev \
    libxml2-dev libzip-dev icu-dev oniguruma-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
    pdo_mysql mbstring xml curl zip gd bcmath intl opcache

# Configure OPcache for production
RUN echo "opcache.enable=1" >> /usr/local/etc/php/conf.d/opcache.ini \
    && echo "opcache.memory_consumption=128" >> /usr/local/etc/php/conf.d/opcache.ini \
    && echo "opcache.max_accelerated_files=10000" >> /usr/local/etc/php/conf.d/opcache.ini \
    && echo "opcache.validate_timestamps=0" >> /usr/local/etc/php/conf.d/opcache.ini

# PHP upload limits
RUN echo "upload_max_filesize = 64M" >> /usr/local/etc/php/conf.d/uploads.ini \
    && echo "post_max_size = 64M" >> /usr/local/etc/php/conf.d/uploads.ini \
    && echo "memory_limit = 256M" >> /usr/local/etc/php/conf.d/uploads.ini

WORKDIR /var/www/html

# Copy app files
COPY --chown=www-data:www-data . .

# Copy vendor from composer stage
COPY --from=vendor --chown=www-data:www-data /app/vendor ./vendor

# Copy built frontend from node stage
COPY --from=frontend --chown=www-data:www-data /app/public/build ./public/build

# Set permissions
RUN chmod -R 775 storage bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache

# Cache Laravel config
RUN php artisan config:clear \
    && php artisan route:clear \
    && php artisan view:clear

EXPOSE 9000

USER www-data
CMD ["php-fpm"]
