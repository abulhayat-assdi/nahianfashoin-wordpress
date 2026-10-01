<?php
defined('ABSPATH') || exit;

/**
 * WP-CLI: wp nf import --seed=data/seed/nahianfashion_seed.sql [--images-dir=/path] [--only=settings,footer,categories,pages]
 */
class NF_CLI {
    /**
     * Imports the Postgres seed into WordPress/WooCommerce.
     *
     * ## OPTIONS
     *
     * --seed=<file>
     * : Path to nahianfashion_seed.sql (pg_dump).
     *
     * [--images-dir=<dir>]
     * : Folder with pre-downloaded images (file name = URL path with "/" replaced by "__"). Missing files are downloaded from their URL.
     *
     * [--only=<steps>]
     * : Comma-separated subset of: settings,footer,categories,pages,home,combos,testimonials,products,reviews. Default: all.
     */
    public function import($args, $assoc) {
        $seed = new NF_Seed_Reader($assoc['seed']);
        if (!empty($assoc['images-dir'])) {
            NF_Media::$local_dir = $assoc['images-dir'];
        }
        $imp = new NF_Importer($seed, static function ($m) { WP_CLI::log($m); });
        $steps = isset($assoc['only']) ? array_map('trim', explode(',', $assoc['only'])) : ['settings', 'footer', 'categories', 'pages', 'home', 'combos', 'testimonials', 'products', 'reviews'];
        foreach ($steps as $s) {
            if (!method_exists($imp, $s)) {
                WP_CLI::warning("Unknown step: $s");
                continue;
            }
            $imp->$s();
        }
        if (NF_Media::$failed) {
            WP_CLI::warning("Images that could not be imported:\n" . implode("\n", NF_Media::$failed));
        }
        flush_rewrite_rules();
        WP_CLI::success('Import finished.');
    }
}
