// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import keystatic from '@keystatic/astro';
import { readFileSync } from 'fs';

// Leggi .env manualmente per determinare output mode
let outputMode = 'static';
let useKeystatic = false;

try {
  const envFile = readFileSync('.env', 'utf-8');
  const match = envFile.match(/ASTRO_OUTPUT_MODE=(\w+)/);
  if (match) outputMode = match[1];
  useKeystatic = envFile.includes('KEYSTATIC_ENABLED=true');
} catch {
  // .env non esiste, usa defaults
}

// https://astro.build/config
export default defineConfig({
  site: 'https://tommasopatriti.me',
  base: outputMode === 'static' ? '/VisualDigitalAgencyDemo' : '',
  output: outputMode,

  integrations: [
    react(),
    markdoc(),
    ...(useKeystatic ? [keystatic()] : []),
    sitemap({
      i18n: {
        defaultLocale: 'it',
        locales: {
          it: 'it-IT',
        },
      },
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
