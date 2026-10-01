<?php
/**
 * /cart: the cart itself is the drawer in the header (opened by app.js on this URL).
 */
defined('ABSPATH') || exit;
$s = nf_settings();
nf_set_seo(['title' => ($s['site_name'] ?: 'Nahian Fashion') . ($s['site_tagline'] ? ' | ' . $s['site_tagline'] : ''), 'noindex' => true, 'follow' => false]);
get_header(); ?>
<div class="min-h-[60vh] flex items-center justify-center">
  <p class="text-[#999] text-[14px]">Loading your cart...</p>
</div>
<?php get_footer();
