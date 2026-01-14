// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import keystatic from '@keystatic/astro';

// Determina ambiente: CI/CD (static) o Dev locale (server + Keystatic)
// CF_PAGES = Cloudflare Pages, CI = GitHub Actions, NETLIFY = Netlify
const isProduction = process.env.CF_PAGES === '1' || process.env.CI === 'true' || process.env.NETLIFY === 'true';
const isGitHubPages = process.env.CI === 'true' && !process.env.CF_PAGES && !process.env.NETLIFY;

// https://astro.build/config
export default defineConfig({
  site: 'https://tommasopatriti.me',
  base: isGitHubPages ? '/VisualDigitalAgencyDemo' : '',
  output: isProduction ? 'static' : 'server',

  integrations: [
    react(),
    markdoc(),
    ...(isProduction ? [] : [keystatic()]),
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
