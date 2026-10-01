import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/constants';

const PRIVATE_PATHS = [
  '/admin/',
  '/api/',
  '/cart',
  '/checkout',
  '/thank-you/',
  '/account-login',
  '/account-register',
  '/account-forgot-password',
  '/account-reset-password',
  '/account-order',
  '/account-address',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: PRIVATE_PATHS },
      { userAgent: 'Googlebot', allow: '/', disallow: PRIVATE_PATHS },
      { userAgent: 'Bingbot', allow: '/', disallow: PRIVATE_PATHS },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
