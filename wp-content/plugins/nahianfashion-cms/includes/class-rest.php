<?php
defined('ABSPATH') || exit;

/** Public read-only REST endpoints used by the storefront JS (namespace nf/v1). */
class NF_REST {
    public static function init(): void {
        add_action('rest_api_init', [__CLASS__, 'routes']);
    }

    public static function routes(): void {
        register_rest_route('nf/v1', '/products', [
            'methods'             => 'GET',
            'callback'            => [__CLASS__, 'products'],
            'permission_callback' => '__return_true',
        ]);
    }

    /** Lightweight product list for header search: id, slug, name, price, media_urls. */
    public static function products(): WP_REST_Response {
        $out = [];
        if (function_exists('wc_get_products')) {
            $products = wc_get_products(['status' => 'publish', 'limit' => -1, 'orderby' => 'date', 'order' => 'DESC']);
            foreach ($products as $p) {
                $img = wp_get_attachment_url($p->get_image_id());
                $out[] = [
                    'id'         => (string) $p->get_id(),
                    'slug'       => $p->get_slug(),
                    'name'       => $p->get_name(),
                    'price'      => (string) $p->get_price(),
                    'media_urls' => $img ? [$img] : [],
                ];
            }
        }
        $res = new WP_REST_Response(['data' => $out]);
        $res->header('Cache-Control', 'public, max-age=60');
        return $res;
    }
}
