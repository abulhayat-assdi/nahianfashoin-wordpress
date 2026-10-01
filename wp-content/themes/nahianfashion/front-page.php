<?php
/**
 * Home page.
 */
defined('ABSPATH') || exit;
get_header();
get_template_part('template-parts/home/hero');
get_template_part('template-parts/home/trust-badges');
get_template_part('template-parts/home/category-grid');
get_template_part('template-parts/home/category-sections');
get_template_part('template-parts/home/combo');
get_template_part('template-parts/home/reviews');
get_footer();
