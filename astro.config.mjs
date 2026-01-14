// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import keystatic from '@keystatic/astro';
import { readFileSync } from 'fs';

// Determina ambiente: GitHub Pages (static) o Netlify/Dev (server + Keystatic)
let isGitHubPages = false;
try {
  const envFile = readFileSync('.env', 'utf-8');
  isGitHubPages = envFile.includes('DEPLOY_TARGET=github');
} catch {
  // .env non esiste, default: server mode con Keystatic
}

// https://astro.build/config
export default defineConfig({
  site: isGitHubPages ? 'https://tommasopatriti.me' : 'https://tommasopatriti.me',
  base: isGitHubPages ? '/VisualDigitalAgencyDemo' : '',
  output: isGitHubPages ? 'static' : 'server',

  integrations: [
    react(),
    markdoc(),
    ...(isGitHubPages ? [] : [keystatic()]),
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
