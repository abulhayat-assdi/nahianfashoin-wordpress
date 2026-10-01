<?php
/**
 * Inline Lucide icons (same set and geometry the original storefront used).
 */
defined('ABSPATH') || exit;

function nf_icon(string $name, int $size = 24, string $class = '', float $stroke = 2): string {
    static $icons = [
        'menu'           => '<path d="M4 5h16"/><path d="M4 12h16"/><path d="M4 19h16"/>',
        'x'              => '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
        'search'         => '<path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/>',
        'shopping-bag'   => '<path d="M16 10a4 4 0 0 1-8 0"/><path d="M3.103 6.034h17.794"/><path d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z"/>',
        'user'           => '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
        'trash-2'        => '<path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
        'grid-2x2'       => '<path d="M12 3v18"/><path d="M3 12h18"/><rect x="3" y="3" width="18" height="18" rx="2"/>',
        'home'           => '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
        'alert-triangle' => '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    ];
    if (!isset($icons[$name])) {
        return '';
    }
    $cls = trim('lucide lucide-' . $name . ' ' . $class);
    return sprintf(
        '<svg xmlns="http://www.w3.org/2000/svg" width="%1$d" height="%1$d" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="%2$s" stroke-linecap="round" stroke-linejoin="round" class="%3$s" aria-hidden="true">%4$s</svg>',
        $size,
        $stroke,
        esc_attr($cls),
        $icons[$name]
    );
}
