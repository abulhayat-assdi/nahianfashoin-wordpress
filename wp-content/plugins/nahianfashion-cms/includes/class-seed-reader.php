<?php
defined('ABSPATH') || exit;

/**
 * Reads the `COPY ... FROM stdin` blocks of a pg_dump file (data/seed/nahianfashion_seed.sql)
 * and returns rows as associative arrays. Booleans stay 't'/'f' strings, NULL becomes null.
 */
class NF_Seed_Reader {
    /** @var array<string, array<int, array<string, ?string>>> */
    private array $tables = [];

    public function __construct(string $file) {
        if (!is_readable($file)) {
            throw new RuntimeException("Seed file not readable: $file");
        }
        $h = fopen($file, 'rb');
        $cols = null;
        $name = null;
        while (($line = fgets($h)) !== false) {
            $line = rtrim($line, "\r\n");
            if ($cols === null) {
                if (strncmp($line, 'COPY ', 5) === 0 && preg_match('/^COPY (?:public\.)?"?(\w+)"? \(([^)]*)\) FROM stdin;$/', $line, $m)) {
                    $name = $m[1];
                    $cols = array_map('trim', explode(',', $m[2]));
                    $this->tables[$name] = [];
                }
                continue;
            }
            if ($line === '\\.') {
                $cols = null;
                continue;
            }
            $vals = explode("\t", $line);
            $row = [];
            foreach ($cols as $i => $c) {
                $v = $vals[$i] ?? null;
                $row[$c] = ($v === null || $v === '\\N') ? null : self::unescape($v);
            }
            $this->tables[$name][] = $row;
        }
        fclose($h);
    }

    public function table(string $name): array {
        return $this->tables[$name] ?? [];
    }

    public static function bool(?string $v): bool {
        return $v === 't' || $v === 'true' || $v === '1';
    }

    public static function json(?string $v) {
        if ($v === null || $v === '') {
            return null;
        }
        $d = json_decode($v, true);
        return json_last_error() === JSON_ERROR_NONE ? $d : null;
    }

    private static function unescape(string $v): string {
        if (strpos($v, '\\') === false) {
            return $v;
        }
        return preg_replace_callback('/\\\\(.)/s', static function ($m) {
            switch ($m[1]) {
                case 'n': return "\n";
                case 't': return "\t";
                case 'r': return "\r";
                case 'b': return "\x08";
                case 'f': return "\f";
                case 'v': return "\v";
                default:  return $m[1];
            }
        }, $v);
    }
}
