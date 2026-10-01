# WordPress + WooCommerce + Nahian Fashion theme/plugin. Build context = repository root.
FROM wordpress:php8.3-apache

RUN apt-get update \
 && apt-get install -y --no-install-recommends unzip less mariadb-client \
 && rm -rf /var/lib/apt/lists/*

# WP-CLI (used by the entrypoint for the first-run setup)
RUN curl -fsSL -o /usr/local/bin/wp https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar \
 && chmod +x /usr/local/bin/wp

# WooCommerce (latest stable at build time; later updates are done from the WordPress admin)
RUN curl -fsSL -o /tmp/wc.zip https://downloads.wordpress.org/plugin/woocommerce.latest-stable.zip \
 && unzip -q /tmp/wc.zip -d /usr/src/wordpress/wp-content/plugins \
 && rm /tmp/wc.zip

COPY wp-content/themes/nahianfashion /usr/src/wordpress/wp-content/themes/nahianfashion
COPY wp-content/plugins/nahianfashion-cms /usr/src/wordpress/wp-content/plugins/nahianfashion-cms
COPY deploy/coolify/uploads.ini /usr/local/etc/php/conf.d/zz-nahianfashion.ini
COPY deploy/coolify/nf-entrypoint.sh /usr/local/bin/nf-entrypoint.sh
RUN chmod +x /usr/local/bin/nf-entrypoint.sh \
 && chown -R www-data:www-data /usr/src/wordpress/wp-content

ENTRYPOINT ["nf-entrypoint.sh"]
CMD ["apache2-foreground"]
