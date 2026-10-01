<?php
defined('ABSPATH') || exit;

/**
 * Steadfast courier integration (parcel creation + delivery-ratio "fraud check").
 *
 * Credentials (never stored in the repository): constants NF_STEADFAST_API_KEY / NF_STEADFAST_SECRET_KEY,
 * the environment variables STEADFAST_API_KEY / STEADFAST_SECRET_KEY, or the options nf_steadfast_api_key /
 * nf_steadfast_secret_key (editable in the admin panel settings).
 *
 * Fraud-check lookups are protected exactly like the original: DB cache (12h), a global hourly/daily call
 * budget, a cooldown after a rate-limit response and retries with backoff for transient failures.
 */
class NF_Steadfast {
    const BASE = 'https://portal.packzy.com/api/v1';
    const RATE_LIMIT_MESSAGE = 'Steadfast API rate limit exceeded';

    private static function env_int(string $name, int $fallback): int {
        $v = getenv($name);
        return ($v !== false && is_numeric($v) && $v > 0) ? (int) $v : $fallback;
    }

    private static function cfg(string $key): int {
        $defaults = ['ttl' => 12 * HOUR_IN_SECONDS, 'hour' => 30, 'day' => 150, 'cooldown' => 15 * MINUTE_IN_SECONDS, 'gap_ms' => 1200];
        switch ($key) {
            case 'ttl':      return self::env_int('STEADFAST_FRAUD_CACHE_HOURS', 12) * HOUR_IN_SECONDS;
            case 'hour':     return self::env_int('STEADFAST_FRAUD_MAX_PER_HOUR', $defaults['hour']);
            case 'day':      return self::env_int('STEADFAST_FRAUD_MAX_PER_DAY', $defaults['day']);
            case 'cooldown': return self::env_int('STEADFAST_FRAUD_COOLDOWN_MINUTES', 15) * MINUTE_IN_SECONDS;
            default:         return self::env_int('STEADFAST_FRAUD_MIN_GAP_MS', $defaults['gap_ms']);
        }
    }

    public static function credentials(): array {
        $get = static function (string $const, string $env, string $opt): string {
            if (defined($const) && constant($const)) {
                return (string) constant($const);
            }
            $e = getenv($env);
            return $e ? (string) $e : (string) get_option($opt, '');
        };
        return [
            $get('NF_STEADFAST_API_KEY', 'STEADFAST_API_KEY', 'nf_steadfast_api_key'),
            $get('NF_STEADFAST_SECRET_KEY', 'STEADFAST_SECRET_KEY', 'nf_steadfast_secret_key'),
        ];
    }

    private static function headers(string $key, string $secret): array {
        return ['Api-Key' => $key, 'Secret-Key' => $secret, 'Content-Type' => 'application/json'];
    }

    /** 11-digit BD number (01XXXXXXXXX) or null. */
    public static function normalize_phone(string $phone): ?string {
        $c = preg_replace('/\D/', '', $phone);
        if (strpos($c, '880') === 0) {
            $c = substr($c, 3);
        } elseif (strpos($c, '88') === 0) {
            $c = substr($c, 2);
        }
        if (strlen($c) > 11) {
            $c = substr($c, -11);
        }
        if (strlen($c) === 10 && $c[0] !== '0') {
            $c = '0' . $c;
        }
        return (strlen($c) === 11 && strpos($c, '01') === 0) ? $c : null;
    }

    /* ───────────────────────── parcel creation ───────────────────────── */

    /** @return array{success:bool,status:int,body:array} */
    public static function send_to_courier(array $in): array {
        foreach (['order_id', 'invoice', 'customer_name', 'customer_phone', 'customer_address'] as $f) {
            if (empty($in[$f])) {
                return ['success' => false, 'status' => 400, 'body' => ['success' => false, 'error' => 'Missing required order details']];
            }
        }
        $clean = preg_replace('/\D/', '', (string) $in['customer_phone']);
        if (strpos($clean, '880') === 0) {
            $clean = substr($clean, 2);
        } elseif (strpos($clean, '88') === 0) {
            $clean = substr($clean, 2);
        }
        if (strlen($clean) !== 11) {
            return ['success' => false, 'status' => 400, 'body' => ['success' => false, 'error' => 'Invalid phone number: ' . $in['customer_phone'] . '. Steadfast requires an 11-digit number.']];
        }
        [$key, $secret] = self::credentials();
        $res = wp_remote_post(self::BASE . '/create_order', [
            'timeout' => 20,
            'headers' => self::headers($key, $secret),
            'body'    => wp_json_encode([
                'invoice' => $in['invoice'], 'recipient_name' => $in['customer_name'], 'recipient_phone' => $clean,
                'recipient_address' => $in['customer_address'], 'cod_amount' => $in['amount_to_collect'] ?? 0, 'note' => $in['note'] ?? '',
            ]),
        ]);
        if (is_wp_error($res)) {
            return ['success' => false, 'status' => 500, 'body' => ['success' => false, 'error' => 'Connection to Courier Server failed. Please check your internet or API keys.']];
        }
        $code = wp_remote_retrieve_response_code($res);
        $result = json_decode(wp_remote_retrieve_body($res), true);
        if ($code < 200 || $code >= 300 || (int) ($result['status'] ?? 0) !== 200) {
            $err = $result['message'] ?? ($result['errors'][0] ?? null) ?? ('Courier API error: ' . wp_json_encode($result));
            return ['success' => false, 'status' => 400, 'body' => ['success' => false, 'error' => is_string($err) ? $err : wp_json_encode($err)]];
        }
        $consignment = isset($result['consignment']['consignment_id']) ? (string) $result['consignment']['consignment_id'] : null;
        if ($consignment) {
            $order = wc_get_order((int) $in['order_id']);
            if ($order) {
                $order->update_meta_data('_nf_consignment_id', $consignment);
                $order->save();
            }
        }
        return ['success' => true, 'status' => 200, 'body' => [
            'success' => true, 'message' => 'Parcel sent to Steadfast successfully!', 'consignment_id' => $consignment, 'data' => $result,
        ]];
    }

    /* ───────────────────────── fraud check (cached, metered) ───────────────────────── */

    private static function now(): string {
        return gmdate('Y-m-d H:i:s');
    }

    private static function ts(?string $d): ?int {
        return $d ? (int) strtotime($d . ' UTC') : null;
    }

    private static function read_cache(string $phone): ?array {
        global $wpdb;
        $t = NF_DB::table('steadfast_fraud_cache');
        return $wpdb->get_row($wpdb->prepare("SELECT * FROM $t WHERE phone = %s", $phone), ARRAY_A) ?: null;
    }

    private static function to_stats(array $row): ?array {
        if (!(int) $row['found']) {
            return null;
        }
        return [
            'total' => (int) $row['total'], 'success' => (int) $row['success'], 'cancel' => (int) $row['cancel'],
            'success_rate' => (int) $row['success_rate'], 'fraud_reports' => json_decode((string) $row['fraud_reports'], true) ?: [],
        ];
    }

    private static function write_cache(string $phone, ?array $stats): void {
        global $wpdb;
        $t = NF_DB::table('steadfast_fraud_cache');
        $now = self::now();
        $wpdb->query($wpdb->prepare(
            "INSERT INTO $t (phone, found, total, success, cancel, success_rate, fraud_reports, fetched_at, updated_at)
             VALUES (%s, %d, %d, %d, %d, %d, %s, %s, %s)
             ON DUPLICATE KEY UPDATE found = VALUES(found), total = VALUES(total), success = VALUES(success), cancel = VALUES(cancel),
               success_rate = VALUES(success_rate), fraud_reports = VALUES(fraud_reports), fetched_at = VALUES(fetched_at), updated_at = VALUES(updated_at)",
            $phone, $stats !== null ? 1 : 0, $stats['total'] ?? 0, $stats['success'] ?? 0, $stats['cancel'] ?? 0, $stats['success_rate'] ?? 0,
            wp_json_encode($stats['fraud_reports'] ?? []), $now, $now
        ));
    }

    private static function read_state(): array {
        global $wpdb;
        $t = NF_DB::table('steadfast_api_state');
        $now = self::now();
        $wpdb->query($wpdb->prepare("INSERT IGNORE INTO $t (id, window_start, window_count, day_start, day_count, updated_at) VALUES ('singleton', %s, 0, %s, 0, %s)", $now, $now, $now));
        return $wpdb->get_row("SELECT * FROM $t WHERE id = 'singleton'", ARRAY_A);
    }

    /** @return array{granted:bool,reason?:string,retry_at?:int} Atomically claims one outgoing call from the global budget. */
    private static function reserve(): array {
        global $wpdb;
        $t = NF_DB::table('steadfast_api_state');
        $state = self::read_state();
        $now = time();
        if (($cu = self::ts($state['cooldown_until'])) && $cu > $now) {
            return ['granted' => false, 'reason' => 'cooldown', 'retry_at' => $cu];
        }
        if (($last = self::ts($state['last_call_at']))) {
            $gap = self::cfg('gap_ms') - (int) round((microtime(true) - $last) * 1000);
            if ($gap > 0) {
                usleep(min($gap, self::cfg('gap_ms')) * 1000);
            }
        }
        $stamp = self::now();
        $hour_cut = gmdate('Y-m-d H:i:s', time() - HOUR_IN_SECONDS);
        $day_cut = gmdate('Y-m-d H:i:s', time() - DAY_IN_SECONDS);
        $max_h = self::cfg('hour');
        $max_d = self::cfg('day');
        $rows = $wpdb->query($wpdb->prepare(
            "UPDATE $t SET
               window_count = CASE WHEN window_start IS NULL OR window_start <= %s THEN 1 ELSE window_count + 1 END,
               window_start = CASE WHEN window_start IS NULL OR window_start <= %s THEN %s ELSE window_start END,
               day_count = CASE WHEN day_start IS NULL OR day_start <= %s THEN 1 ELSE day_count + 1 END,
               day_start = CASE WHEN day_start IS NULL OR day_start <= %s THEN %s ELSE day_start END,
               last_call_at = %s, updated_at = %s
             WHERE id = 'singleton'
               AND (cooldown_until IS NULL OR cooldown_until <= %s)
               AND (window_start IS NULL OR window_start <= %s OR window_count < %d)
               AND (day_start IS NULL OR day_start <= %s OR day_count < %d)",
            $hour_cut, $hour_cut, $stamp, $day_cut, $day_cut, $stamp, $stamp, $stamp, $stamp, $hour_cut, $max_h, $day_cut, $max_d
        ));
        if ($rows) {
            return ['granted' => true];
        }
        $cur = self::read_state();
        if (($cu = self::ts($cur['cooldown_until'])) && $cu > time()) {
            return ['granted' => false, 'reason' => 'cooldown', 'retry_at' => $cu];
        }
        $ws = self::ts($cur['window_start']);
        $exhausted_hour = $ws && $ws > time() - HOUR_IN_SECONDS && (int) $cur['window_count'] >= $max_h;
        $retry = $exhausted_hour ? $ws + HOUR_IN_SECONDS : (self::ts($cur['day_start']) ?: time()) + DAY_IN_SECONDS;
        return ['granted' => false, 'reason' => 'quota', 'retry_at' => $retry];
    }

    private static function start_cooldown(int $seconds): int {
        global $wpdb;
        $t = NF_DB::table('steadfast_api_state');
        $until = time() + max($seconds, MINUTE_IN_SECONDS);
        $wpdb->update($t, ['cooldown_until' => gmdate('Y-m-d H:i:s', $until), 'updated_at' => self::now()], ['id' => 'singleton']);
        return $until;
    }

    private static function parse_stats($d): ?array {
        if (!is_array($d)) {
            return null;
        }
        $total = (int) ($d['total_parcels'] ?? $d['Total_parcels'] ?? $d['total'] ?? 0);
        $success = (int) ($d['total_delivered'] ?? $d['Total_delivered'] ?? $d['success'] ?? 0);
        $cancel = (int) ($d['total_cancelled'] ?? $d['Total_cancelled'] ?? $d['cancel'] ?? 0);
        $reports = isset($d['total_fraud_reports']) && is_array($d['total_fraud_reports']) ? $d['total_fraud_reports'] : [];
        if (!($total > 0) && !$reports) {
            return null;
        }
        return ['total' => $total, 'success' => $success, 'cancel' => $cancel, 'success_rate' => $total > 0 ? (int) round($success / $total * 100) : 0, 'fraud_reports' => $reports];
    }

    private static function looks_rate_limited(int $status, $body): bool {
        if ($status === 429) {
            return true;
        }
        $text = is_string($body) ? $body : wp_json_encode($body ?? '');
        return (bool) preg_match('/rate.?limit|too many request|limit exceeded/i', (string) $text);
    }

    /** @return array{kind:string,stats?:?array,retry_after?:int,message?:string} */
    private static function call(string $phone): array {
        [$key, $secret] = self::credentials();
        if ($key === '' || $secret === '') {
            return ['kind' => 'error', 'message' => 'Steadfast API keys are not configured'];
        }
        $last = 'Steadfast API request failed';
        for ($attempt = 1; $attempt <= 3; $attempt++) {
            $res = wp_remote_get(self::BASE . '/fraud_check/' . rawurlencode($phone), ['timeout' => 10, 'headers' => self::headers($key, $secret)]);
            if (is_wp_error($res)) {
                $last = $res->get_error_message();
            } else {
                $code = (int) wp_remote_retrieve_response_code($res);
                $raw = wp_remote_retrieve_body($res);
                $body = json_decode($raw, true);
                if ($body === null) {
                    $body = $raw;
                }
                if (self::looks_rate_limited($code, $body)) {
                    $ra = wp_remote_retrieve_header($res, 'retry-after');
                    return ['kind' => 'rate_limited', 'retry_after' => is_numeric($ra) && $ra > 0 ? (int) $ra : self::cfg('cooldown')];
                }
                if ($code >= 200 && $code < 300) {
                    return ['kind' => 'ok', 'stats' => self::parse_stats($body)];
                }
                $last = (is_array($body) ? ($body['message'] ?? $body['error'] ?? null) : null) ?: "Steadfast API error (HTTP $code)";
                if ($code < 500) {
                    return ['kind' => 'error', 'message' => $last];
                }
            }
            if ($attempt < 3) {
                usleep((600 * (2 ** ($attempt - 1)) + random_int(0, 200)) * 1000);
            }
        }
        return ['kind' => 'error', 'message' => $last];
    }

    /** Delivery/fraud stats for a phone; hits the API only when the cache is missing/stale. */
    public static function fraud_check(string $phone, bool $force = false): array {
        $cached = self::read_cache($phone);
        if ($cached && !$force && time() - self::ts($cached['fetched_at']) < self::cfg('ttl')) {
            return ['stats' => self::to_stats($cached), 'error' => null, 'cached' => true, 'stale' => false, 'fetched_at' => gmdate('c', self::ts($cached['fetched_at'])), 'next_retry_at' => null];
        }
        $fallback = static fn(string $err, ?int $retry) => [
            'stats' => $cached ? self::to_stats($cached) : null, 'error' => $cached ? null : $err, 'cached' => (bool) $cached, 'stale' => (bool) $cached,
            'fetched_at' => $cached ? gmdate('c', self::ts($cached['fetched_at'])) : null, 'next_retry_at' => $retry ? gmdate('c', $retry) : null,
        ];
        $r = self::reserve();
        if (!$r['granted']) {
            return $fallback($r['reason'] === 'cooldown' ? self::RATE_LIMIT_MESSAGE : self::RATE_LIMIT_MESSAGE . ' (daily/hourly search budget used up)', $r['retry_at']);
        }
        $out = self::call($phone);
        if ($out['kind'] === 'rate_limited') {
            return $fallback(self::RATE_LIMIT_MESSAGE, self::start_cooldown($out['retry_after']));
        }
        if ($out['kind'] === 'error') {
            return $fallback($out['message'], null);
        }
        self::write_cache($phone, $out['stats']);
        return ['stats' => $out['stats'], 'error' => null, 'cached' => false, 'stale' => false, 'fetched_at' => gmdate('c'), 'next_retry_at' => null];
    }

    /** Local order history for a phone (last 10 digits), drafts excluded. */
    public static function local_stats(string $phone): array {
        $last10 = substr($phone, -10);
        $orders = wc_get_orders([
            'limit' => -1, 'return' => 'objects',
            'meta_query' => [['key' => '_nf_phone', 'value' => $last10, 'compare' => 'LIKE']],
            'status' => array_map(static fn($s) => 'wc-' . NF_Orders::wc_status($s), array_values(array_diff(array_keys(NF_Orders::STATUSES), ['incomplete']))),
        ]);
        $st = array_map(static fn($o) => NF_Orders::from_wc_status($o->get_status()), $orders);
        $count = static fn(array $set) => count(array_filter($st, static fn($s) => in_array($s, $set, true)));
        return [
            'total' => count($st), 'success' => $count(['delivered']), 'cancel' => $count(['returned', 'cancelled']),
            'pending' => $count(['pending', 'received', 'preparing', 'on_way']),
        ];
    }

    public static function check_ratio(string $phone, bool $force): array {
        $clean = self::normalize_phone($phone);
        if (!$phone || $phone === '—') {
            return ['status' => 400, 'body' => ['error' => 'Valid phone number required']];
        }
        if (!$clean) {
            return ['status' => 400, 'body' => ['error' => "Invalid phone number format: $phone"]];
        }
        $look = self::fraud_check($clean, $force);
        return ['status' => 200, 'body' => [
            'success' => true,
            'local' => self::local_stats($clean),
            'steadfast' => $look['stats'] ?: ($look['error'] ? ['error' => $look['error']] : null),
            'steadfast_meta' => ['cached' => $look['cached'], 'stale' => $look['stale'], 'fetched_at' => $look['fetched_at'], 'next_retry_at' => $look['next_retry_at']],
        ]];
    }
}
