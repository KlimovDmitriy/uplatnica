import type { NuxtPage } from 'nuxt/schema'
import { PREFIXED_LOCALES } from './shared/utils/lang'

const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || 'https://uplatnica.example.rs'

export default defineNuxtConfig({
  compatibilityDate: '2026-09-01',
  devtools: { enabled: true },

  modules: ['@nuxtjs/i18n', '@nuxtjs/sitemap', '@nuxtjs/robots', 'nuxt-schema-org'],

  css: ['~/assets/css/main.css'],

  hooks: {
    // "/ru/x", "/en/x", "/sr-cyrl/x": the same pages rendered in another language, so search
    // engines index every language. plugins/locale-route.ts sets the language from the prefix.
    'pages:extend'(pages) {
      const copies: NuxtPage[] = []
      for (const code of PREFIXED_LOCALES) {
        for (const page of pages) {
          copies.push({
            ...page,
            name: page.name && `lang-${code}-${page.name}`,
            path: page.path === '/' ? `/${code}` : `/${code}${page.path}`,
          })
        }
      }
      pages.push(...copies)
    },
    // jsPDF is big and needed only when the visitor downloads a PDF (slipPdf.ts imports it on
    // demand), so don't let the browser preload or prefetch its chunk. It still loads on demand.
    'build:manifest'(manifest) {
      for (const [key, entry] of Object.entries(manifest)) {
        if (/jspdf|jsqr/.test(key) || /jspdf|jsqr/.test(entry.file ?? '')) {
          entry.prefetch = false
          entry.preload = false
        }
      }
    },
  },

  // Language alternates are written into every page's <head> by usePageSeo (the sitemap module's
  // i18n integration would only emit the en/ru ones: it doesn't know our prefix routing).
  sitemap: {
    autoI18n: false,
  },

  // Baked in at `nuxt generate` from NUXT_PUBLIC_* env vars (see .env.example).
  runtimeConfig: {
    public: {
      googleSiteVerification: '',
      yandexVerification: '',
      plausibleDomain: '',
      plausibleSrc: 'https://plausible.io/js/script.js',
    },
  },

  site: {
    url: siteUrl,
    name: 'Uplatnica',
  },

  app: {
    head: {
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
      meta: [{ name: 'theme-color', content: '#ffffff' }],
    },
  },

  i18n: {
    baseUrl: siteUrl,
    defaultLocale: 'sr',
    // Routing is ours (see hooks above and shared/utils/lang.ts): visitors never see a
    // language prefix, the chosen language lives in localStorage.
    strategy: 'no_prefix',
    locales: [
      { code: 'sr', language: 'sr-Latn-RS', name: 'Srpski', file: 'sr.json' },
      { code: 'sr-cyrl', language: 'sr-Cyrl-RS', name: 'Српски', file: 'sr-cyrl.ts' },
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
      { code: 'ru', language: 'ru-RU', name: 'Русский', file: 'ru.json' },
    ],
    detectBrowserLanguage: false,
  },

  // WebSite/WebPage nodes come from app/plugins/schema-website.server.ts (the module's i18n
  // defaults list the same @id for every language).
  schemaOrg: {
    defaults: false,
  },

  // Fully static: every page in every language is prerendered. The crawler starts from each
  // language's home page and follows its in-language links.
  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ['/', ...PREFIXED_LOCALES.map(code => `/${code}`)],
    },
  },
})
