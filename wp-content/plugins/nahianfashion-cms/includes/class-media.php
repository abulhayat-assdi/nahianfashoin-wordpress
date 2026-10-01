<?php
defined('ABSPATH') || exit;

/**
 * Sideloads images into the WordPress media library. The source URL is stored on the attachment
 * (`_nf_source_url`) so a re-run of the importer reuses it instead of creating duplicates.
 */
class NF_Media {
    /** @var string|null directory holding pre-downloaded copies (file name = URL path with "/" -> "__") */
    public static ?string $local_dir = null;
    /** @var string[] URLs that could not be fetched */
    public static array $failed = [];

    public static function sideload(?string $url, int $parent = 0): int {
        $url = trim((string) $url);
        if ($url === '') {
            return 0;
        }
        $existing = get_posts([
            'post_type'      => 'attachment',
            'post_status'    => 'any',
            'posts_per_page' => 1,
            'fields'         => 'ids',
            'meta_key'       => '_nf_source_url',
            'meta_value'     => $url,
        ]);
        if ($existing) {
            return (int) $existing[0];
        }

        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/media.php';
        require_once ABSPATH . 'wp-admin/includes/image.php';

        $tmp = self::fetch($url);
        if (!$tmp) {
            self::$failed[] = $url;
            return 0;
        }
        $path = (string) wp_parse_url($url, PHP_URL_PATH);
        $file = ['name' => basename($path), 'tmp_name' => $tmp];
        $id = media_handle_sideload($file, $parent);
        if (is_wp_error($id)) {
            @unlink($tmp);
            self::$failed[] = $url . ' (' . $id->get_error_message() . ')';
            return 0;
        }
        update_post_meta($id, '_nf_source_url', $url);
        return (int) $id;
    }

    private static function fetch(string $url): ?string {
        if (self::$local_dir) {
            $path = ltrim((string) wp_parse_url($url, PHP_URL_PATH), '/');
            $local = rtrim(self::$local_dir, '/') . '/' . str_replace('/', '__', $path);
            if (is_readable($local) && filesize($local) > 0) {
                $tmp = wp_tempnam($local);
                copy($local, $tmp);
                return $tmp;
            }
        }
        $tmp = download_url($url, 120);
        return is_wp_error($tmp) ? null : $tmp;
    }
}
