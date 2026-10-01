# Dev tools

`screenshot.js` / `compare/` take screenshots of the reference Next.js site (`reference-nextjs-latest`) and of the
WordPress build and diff them (`python3 compare/diff.py <page>...`; needs Pillow + numpy and Playwright).

Local test environment used during development (not part of the deliverable):
WordPress + WooCommerce on MariaDB (`php -S` with `PHP_CLI_SERVER_WORKERS`), the Next.js reference on PostgreSQL
loaded from `data/seed/nahianfashion_seed.sql`, and the image set downloaded from `data/image-urls.txt`.

Import into WordPress: `wp nf import --seed=data/seed/nahianfashion_seed.sql [--images-dir=<dir>]`.
