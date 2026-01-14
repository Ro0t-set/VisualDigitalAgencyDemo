// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import keystatic from '@keystatic/astro';
import cloudflare from '@astrojs/cloudflare';

// CF_PAGES = Cloudflare Pages (SSR con Keystatic)
// CI = GitHub Actions (static senza Keystatic)
const isCloudflare = process.env.CF_PAGES === '1';
const isGitHubActions = process.env.CI === 'true' && !isCloudflare;

// https://astro.build/config
export default defineConfig({
  site: isGitHubActions ? 'https://tommasopatriti.me': 'https://visualdigitalagencydemo.pages.dev',
  base: isGitHubActions ? '/VisualDigitalAgencyDemo' : '',
  output: isGitHubActions ? 'static' : 'server',
  adapter: isGitHubActions ? undefined : cloudflare(),

  integrations: [
    react(),
    markdoc(),
    ...(isGitHubActions ? [] : [keystatic()]),
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
