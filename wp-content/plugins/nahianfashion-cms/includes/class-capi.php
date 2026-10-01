<?php
defined('ABSPATH') || exit;

/**
 * Server-side Meta Conversions API "Purchase" event (fire and forget; never blocks an order).
 * Credentials come from constants/env (NF_FB_PIXEL_ID, NF_FB_CAPI_TOKEN, NF_FB_CAPI_TEST_CODE) or the
 * options nf_fb_pixel_id / nf_fb_capi_token / nf_fb_capi_test_code. Nothing is stored in the repository.
 */
class NF_CAPI {
    private static function cfg(string $const, string $env, string $opt): string {
        if (defined($const) && constant($const)) {
            return (string) constant($const);
        }
        $e = getenv($env);
        if ($e) {
            return (string) $e;
        }
        return (string) get_option($opt, '');
    }

    private static function sha(string $v): string {
        return hash('sha256', $v);
    }

    public static function send_purchase(array $in): void {
        $pixel = self::cfg('NF_FB_PIXEL_ID', 'FB_PIXEL_ID', 'nf_fb_pixel_id');
        $token = self::cfg('NF_FB_CAPI_TOKEN', 'FB_CAPI_ACCESS_TOKEN', 'nf_fb_capi_token');
        if ($pixel === '' || $token === '') {
            return;
        }
        $test = self::cfg('NF_FB_CAPI_TEST_CODE', 'FB_CAPI_TEST_EVENT_CODE', 'nf_fb_capi_test_code');

        $digits = preg_replace('/\D/', '', $in['phone']);
        if (strpos($digits, '0') === 0) {
            $digits = '880' . substr($digits, 1);
        }
        $parts = preg_split('/\s+/', trim($in['customer_name']));
        $user = ['ph' => [self::sha($digits)], 'fn' => [self::sha(mb_strtolower($parts[0]))]];
        if (count($parts) > 1) {
            $user['ln'] = [self::sha(mb_strtolower(end($parts)))];
        }
        if (!empty($in['ip']) && $in['ip'] !== 'unknown') {
            $user['client_ip_address'] = $in['ip'];
        }
        if (!empty($in['user_agent'])) {
            $user['client_user_agent'] = $in['user_agent'];
        }
        $body = [
            'data' => [[
                'event_name'       => 'Purchase',
                'event_time'       => time(),
                'event_id'         => $in['order_id'],
                'action_source'    => 'website',
                'event_source_url' => $in['source_url'],
                'user_data'        => $user,
                'custom_data'      => [
                    'currency' => 'BDT', 'value' => $in['total'], 'content_type' => 'product',
                    'contents' => $in['contents'],
                    'num_items' => array_sum(array_column($in['contents'], 'quantity')),
                ],
            ]],
        ];
        if ($test !== '') {
            $body['test_event_code'] = $test;
        }
        wp_remote_post('https://graph.facebook.com/v21.0/' . rawurlencode($pixel) . '/events?access_token=' . rawurlencode($token), [
            'timeout'  => 8,
            'blocking' => false,
            'headers'  => ['Content-Type' => 'application/json'],
            'body'     => wp_json_encode($body),
        ]);
    }
}
