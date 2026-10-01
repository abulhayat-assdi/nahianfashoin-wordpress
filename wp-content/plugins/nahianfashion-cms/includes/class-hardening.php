<?php
defined('ABSPATH') || exit;

/** Small, safe hardening measures for a public shop (no behaviour change for visitors). */
class NF_Hardening {
    public static function init(): void {
        add_filter('xmlrpc_enabled', '__return_false');
        add_filter('login_errors', static fn() => __('Incorrect username or password.', 'nahianfashion-cms'));
        add_filter('rest_endpoints', static function ($endpoints) {
            if (!is_user_logged_in()) {
                foreach (array_keys($endpoints) as $route) {
                    if (strpos($route, '/wp/v2/users') === 0) {
                        unset($endpoints[$route]);
                    }
                }
            }
            return $endpoints;
        });
        add_action('template_redirect', static function () {
            if (is_author() || (isset($_GET['author']) && !is_admin())) {
                wp_safe_redirect(home_url('/'), 301);
                exit;
            }
        }, 0);
        add_action('send_headers', static function () {
            header('X-Content-Type-Options: nosniff');
            header('X-Frame-Options: SAMEORIGIN');
            header('Referrer-Policy: strict-origin-when-cross-origin');
        });
    }
}
