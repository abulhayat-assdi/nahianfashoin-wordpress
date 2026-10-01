<?php
defined('ABSPATH') || exit;

/**
 * WP-CLI: wp nf import --seed=data/seed/nahianfashion_seed.sql [--images-dir=/path] [--only=settings,products,...]
 *         wp nf setup
 */
class NF_CLI {
    /**
     * Imports a PostgreSQL dump (repo seed or full live dump) into WordPress/WooCommerce.
     *
     * ## OPTIONS
     *
     * --seed=<file>
     * : Path to the pg_dump file (COPY format).
     *
     * [--images-dir=<dir>]
     * : Folder with pre-downloaded images (file name = URL path with "/" replaced by "__"). Missing files are downloaded from their URL.
     *
     * [--only=<steps>]
     * : Comma-separated subset of: settings,footer,categories,pages,home,combos,testimonials,products,reviews,coupons,blocked,fraud_cache,orders. Default: everything except orders.
     *
     * [--with-orders]
     * : Also import orders (needs a live dump; the repo seed has none).
     */
    public function import($args, $assoc) {
        if (!empty($assoc['images-dir'])) {
            NF_Media::$local_dir = $assoc['images-dir'];
        }
        $imp = new NF_Importer($assoc['seed'], static function ($m) { WP_CLI::log($m); });
        $steps = isset($assoc['only']) ? array_map('trim', explode(',', $assoc['only'])) : array_keys(NF_Importer::STEPS);
        if (!isset($assoc['only']) && empty($assoc['with-orders'])) {
            $steps = array_values(array_diff($steps, ['orders']));
        }
        $imp->run_all($steps);
        if (NF_Media::$failed) {
            WP_CLI::warning("Images that could not be imported:\n" . implode("\n", NF_Media::$failed));
        }
        flush_rewrite_rules();
        WP_CLI::success('Import finished.');
    }

    /** Applies the recommended store settings (permalinks, currency, timezone ...). Safe to re-run. */
    public function setup() {
        NF_Setup::run();
        WP_CLI::success('Setup applied.');
    }
}
