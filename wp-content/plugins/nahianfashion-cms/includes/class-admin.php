<?php
defined('ABSPATH') || exit;

/**
 * The full-screen admin panel at /admin (React bundle in admin/assets). Access = WordPress login with the
 * manage_woocommerce capability (Administrator = "super admin", Shop manager = "admin").
 */
class NF_Admin {
    const ROUTES_VERSION = '1';

    public static function init(): void {
        add_action('init', [__CLASS__, 'rewrite'], 20);
        add_action('init', [__CLASS__, 'maybe_flush'], 99);
        add_filter('query_vars', static function ($v) { $v[] = 'nf_admin'; return $v; });
        add_action('template_redirect', [__CLASS__, 'render'], 0);
        add_filter('redirect_canonical', static fn($url) => get_query_var('nf_admin') ? false : $url);
        // WordPress would otherwise send /admin to /wp-admin.
        remove_action('template_redirect', 'wp_redirect_admin_locations', 1000);
    }

    public static function rewrite(): void {
        add_rewrite_rule('^admin(/.*)?$', 'index.php?nf_admin=1', 'top');
    }

    public static function maybe_flush(): void {
        if (get_option('nf_admin_routes_version') !== self::ROUTES_VERSION) {
            flush_rewrite_rules(false);
            update_option('nf_admin_routes_version', self::ROUTES_VERSION);
        }
    }

    public static function role_label(WP_User $u): string {
        return in_array('administrator', (array) $u->roles, true) ? 'super_admin' : 'admin';
    }

    public static function logo_url(): string {
        $id = (int) get_option('nf_logo_id', 0);
        $url = $id ? wp_get_attachment_url($id) : '';
        if (!$url && function_exists('nf_logo_url')) {
            $url = nf_logo_url();
        }
        return (string) $url;
    }

    public static function render(): void {
        if (!get_query_var('nf_admin')) {
            return;
        }
        nocache_headers();
        if (!is_user_logged_in()) {
            wp_safe_redirect(wp_login_url(home_url(wp_parse_url($_SERVER['REQUEST_URI'] ?? '/admin', PHP_URL_PATH))));
            exit;
        }
        if (!current_user_can('manage_woocommerce')) {
            wp_die(esc_html__('You do not have permission to access the admin panel.', 'nahianfashion-cms'), 403);
        }
        $user = wp_get_current_user();
        $cfg = [
            'base'      => rtrim((string) wp_parse_url(home_url('/admin'), PHP_URL_PATH), '/'),
            'rest'      => esc_url_raw(rest_url('nf/v1/')),
            'nonce'     => wp_create_nonce('wp_rest'),
            'logo'      => self::logo_url(),
            'logoutUrl' => wp_logout_url(home_url('/')),
            'user'      => ['id' => (string) $user->ID, 'name' => $user->display_name, 'role' => self::role_label($user)],
        ];
        $css = NF_CMS_DIR . 'admin/assets/admin.css';
        $js  = NF_CMS_DIR . 'admin/assets/admin.js';
        header('Content-Type: text/html; charset=utf-8');
        header('X-Robots-Tag: noindex, nofollow');
        ?><!doctype html>
<html lang="en" style="scroll-behavior: smooth;">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>Nahian Fashion CMS</title>
<link rel="icon" href="<?php echo esc_url($cfg['logo']); ?>" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=Hind+Siliguri:wght@400;600;700&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="<?php echo esc_url(NF_CMS_URL . 'admin/assets/admin.css?ver=' . filemtime($css)); ?>" />
</head>
<body class="bg-white text-foreground antialiased min-h-screen flex flex-col" style="font-family: 'Poppins', 'Hind Siliguri', system-ui, sans-serif;">
<div id="nf-admin-root"></div>
<script>window.NF_ADMIN = <?php echo wp_json_encode($cfg, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE); ?>;</script>
<script src="<?php echo esc_url(NF_CMS_URL . 'admin/assets/admin.js?ver=' . filemtime($js)); ?>" defer></script>
</body>
</html>
        <?php
        exit;
    }
}
