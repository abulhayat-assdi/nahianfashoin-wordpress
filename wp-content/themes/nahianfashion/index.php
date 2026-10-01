<?php
/**
 * Fallback template. Specific templates (front-page, WooCommerce, pages, 404) are added per section.
 */
defined('ABSPATH') || exit;
get_header();
?>
<div class="mx-auto max-w-[1280px] px-6 md:px-10 py-12">
  <?php if (have_posts()) : while (have_posts()) : the_post(); ?>
    <div class="product-description"><?php the_content(); ?></div>
  <?php endwhile; endif; ?>
</div>
<?php
get_footer();
