#!/usr/bin/env bash
# 1) let the official entrypoint prepare /var/www/html (wp-config from env, first-run copy)
# 2) refresh theme + plugin from the image (the data volume keeps old copies otherwise)
# 3) optional unattended first install (NF_AUTO_INSTALL=1)
set -Eeuo pipefail

docker-entrypoint.sh apache2 -v >/dev/null   # "apache2" as first arg makes it prepare the site, then the harmless command exits

WP_DIR=/var/www/html
SRC=/usr/src/wordpress/wp-content
for item in themes/nahianfashion plugins/nahianfashion-cms; do
  rm -rf "$WP_DIR/wp-content/$item"
  mkdir -p "$(dirname "$WP_DIR/wp-content/$item")"
  cp -a "$SRC/$item" "$WP_DIR/wp-content/$item"
done
# WooCommerce is only copied on the very first start (afterwards it is updated from the WordPress admin)
if [ ! -d "$WP_DIR/wp-content/plugins/woocommerce" ] && [ -d "$SRC/plugins/woocommerce" ]; then
  cp -a "$SRC/plugins/woocommerce" "$WP_DIR/wp-content/plugins/woocommerce"
fi
chown -R www-data:www-data "$WP_DIR/wp-content"

if [ "${NF_AUTO_INSTALL:-0}" = "1" ]; then
  WP="wp --allow-root --path=$WP_DIR"
  for i in $(seq 1 60); do $WP db check >/dev/null 2>&1 && break; sleep 2; done
  if ! $WP core is-installed >/dev/null 2>&1; then
    : "${NF_SITE_URL:?NF_SITE_URL is required}" "${NF_ADMIN_USER:?}" "${NF_ADMIN_PASSWORD:?}" "${NF_ADMIN_EMAIL:?}"
    $WP core install --url="$NF_SITE_URL" --title="Nahian Fashion" --admin_user="$NF_ADMIN_USER" \
        --admin_password="$NF_ADMIN_PASSWORD" --admin_email="$NF_ADMIN_EMAIL" --skip-email
    $WP plugin activate woocommerce nahianfashion-cms
    $WP theme activate nahianfashion
    $WP nf setup
    $WP rewrite flush --hard || true
  fi
  chown -R www-data:www-data "$WP_DIR/wp-content"
fi

exec docker-entrypoint.sh "$@"
