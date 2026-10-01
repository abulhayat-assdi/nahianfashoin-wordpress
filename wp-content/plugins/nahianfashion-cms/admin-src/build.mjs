// Builds the admin panel: JS bundle (esbuild) + CSS (Tailwind 4 over the same sources, then the original admin.css).
import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(here, '../admin/assets');
mkdirSync(out, { recursive: true });
mkdirSync(resolve(here, '.build'), { recursive: true });

await build({
  entryPoints: [resolve(here, 'src/main.tsx')],
  outfile: resolve(out, 'admin.js'),
  bundle: true, minify: true, format: 'iife', target: 'es2020', jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"production"' },
  alias: {
    '@': resolve(here, 'src'),
    'next/link': resolve(here, 'src/shims/link.tsx'),
    'next/navigation': resolve(here, 'src/shims/navigation.tsx'),
  },
  legalComments: 'none',
});

// CSS: site tokens (same @theme as the storefront) + Tailwind utilities used by the admin + original admin.css last.
const globals = readFileSync(resolve(here, '../../../themes/nahianfashion/_src/input.css'), 'utf8')
  .replace(/@import "tailwindcss"[^;]*;\n(@source[^\n]*\n)*/, '');
const admin = readFileSync(resolve(here, 'src/admin.css'), 'utf8');
const inter = admin.match(/@import url\([^)]*\);/)?.[0] ?? '';
const input = `${inter}\n@import "tailwindcss" source(none);\n@source "./**/*.tsx";\n${globals}\n${admin.replace(inter, '')}\n`;
writeFileSync(resolve(here, 'src/.tailwind-input.css'), input);
execFileSync(resolve(here, 'node_modules/.bin/tailwindcss'), ['-i', resolve(here, 'src/.tailwind-input.css'), '-o', resolve(out, 'admin.css'), '--minify'], { stdio: 'inherit' });
