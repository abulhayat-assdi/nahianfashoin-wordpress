<?php
/**
 * 404 page.
 */
defined('ABSPATH') || exit;
$GLOBALS['nf_bare'] = true;
nf_set_seo(['title' => 'Page Not Found | Nahian Fashion', 'noindex' => true, 'follow' => true]);
get_header(); ?>
<main class="min-h-screen bg-[#f5f5f5] flex flex-col items-center justify-center text-center px-6">
  <p class="text-[13px] font-bold uppercase tracking-widest text-[#1a3c2e] mb-4">404</p>
  <h1 class="font-heading text-[48px] md:text-[64px] text-[#222] leading-tight">Page Not Found</h1>
  <p class="mt-6 max-w-[480px] text-[16px] text-[#666] leading-relaxed">The page you are looking for doesn't exist or has been moved. Let's get you back to our collection.</p>
  <div class="mt-10 flex flex-wrap gap-4 justify-center">
    <a href="<?php echo esc_url(nf_url('/')); ?>" class="px-8 py-4 bg-[#1a3c2e] text-white font-bold uppercase tracking-wider text-[14px] hover:bg-[#0f2a1e] transition-colors">Back to Home</a>
    <a href="<?php echo esc_url(nf_url('/collections/all')); ?>" class="px-8 py-4 border border-[#1a3c2e] text-[#1a3c2e] font-bold uppercase tracking-wider text-[14px] hover:bg-[#1a3c2e] hover:text-white transition-colors">Shop All Products</a>
  </div>
</main>
<?php get_footer();
