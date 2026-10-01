<?php
/**
 * Checkout (/checkout, /checkout?buyNow=<id>). The page is rendered client-side by assets/js/checkout.js
 * from the cart in localStorage; this file only provides the shell and configuration.
 */
defined('ABSPATH') || exit;
nf_set_seo(['title' => 'Checkout | Nahian Fashion', 'noindex' => true, 'follow' => false]);
$config = [
    'rest'     => esc_url_raw(rest_url('nf/v1/')),
    'nonce'    => wp_create_nonce('wp_rest'),
    'home'     => untrailingslashit(home_url()),
    'whatsapp' => nf_whatsapp_url(nf_settings()['whatsapp_number']),
    'icons'    => nf_icon_paths(),
];
get_header(); ?>
<div id="nf-checkout" data-config="<?php echo esc_attr(wp_json_encode($config, JSON_UNESCAPED_UNICODE)); ?>">
  <div class="min-h-[70vh] flex flex-col items-center justify-center gap-4">
    <?php echo nf_icon('loader-circle', 40, 'w-10 h-10 animate-spin text-[#1a3c2e]'); ?>
    <p class="text-[#666]">চেকআউট প্রস্তুত করা হচ্ছে...</p>
  </div>
</div>
<?php
wp_enqueue_script('nf-checkout', get_theme_file_uri('assets/js/checkout.js'), ['nf-app'], filemtime(get_theme_file_path('assets/js/checkout.js')), ['in_footer' => true, 'strategy' => 'defer']);
get_footer();
