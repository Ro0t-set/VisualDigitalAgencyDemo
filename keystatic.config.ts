import { config, fields, collection, singleton } from '@keystatic/core';

export default config({
  // Solo modalità locale per GitHub Pages
  storage: {
    kind: 'local',
  },

  ui: {
    brand: {
      name: 'Viral Digital Agency',
    },
  },

  singletons: {
    settings: singleton({
      label: 'Impostazioni Sito',
      path: 'content/settings/global',
      format: { data: 'json' },
      schema: {
        companyName: fields.text({ label: 'Nome Azienda' }),
        tagline: fields.text({ label: 'Slogan' }),
        logo: fields.image({
          label: 'Logo',
          directory: 'public/uploads',
          publicPath: '/uploads/',
        }),
        contact: fields.object({
          email: fields.text({ label: 'Email' }),
          phone: fields.text({ label: 'Telefono' }),
          address: fields.text({ label: 'Indirizzo' }),
        }, { label: 'Contatti' }),
        social: fields.object({
          instagram: fields.url({ label: 'Instagram URL' }),
          facebook: fields.url({ label: 'Facebook URL' }),
        }, { label: 'Social Media' }),
      },
    }),

    hero: singleton({
      label: 'Hero Section',
      path: 'content/sections/hero',
      format: { data: 'json' },
      schema: {
        headline: fields.text({ label: 'Titolo Principale' }),
        subheadline: fields.text({ label: 'Sottotitolo', multiline: true }),
        ctaText: fields.text({ label: 'Testo Pulsante' }),
        ctaLink: fields.text({ label: 'Link Pulsante' }),
        secondaryCtaText: fields.text({ label: 'Testo Pulsante Secondario' }),
        secondaryCtaLink: fields.text({ label: 'Link Pulsante Secondario' }),
      },
    }),

    about: singleton({
      label: 'About Section',
      path: 'content/sections/about',
      format: { data: 'json' },
      schema: {
        title: fields.text({ label: 'Titolo' }),
        description: fields.text({ label: 'Descrizione', multiline: true }),
        backgroundImage: fields.image({
          label: 'Immagine Sfondo',
          directory: 'public/uploads',
          publicPath: '/uploads/',
        }),
      },
    }),

    services: singleton({
      label: 'Services Section',
      path: 'content/sections/services',
      format: { data: 'json' },
      schema: {
        title: fields.text({ label: 'Titolo' }),
        subtitle: fields.text({ label: 'Sottotitolo' }),
        description: fields.text({ label: 'Descrizione', multiline: true }),
      },
    }),
  },

  collections: {
    portfolio: collection({
      label: 'Portfolio',
      path: 'content/portfolio/*',
      slugField: 'title',
      format: { data: 'json' },
      schema: {
        title: fields.slug({ name: { label: 'Titolo Progetto' } }),
        description: fields.text({ label: 'Descrizione', multiline: true }),
        image: fields.image({
          label: 'Immagine',
          directory: 'public/uploads/gallery',
          publicPath: '/uploads/gallery/',
        }),
        order: fields.integer({ label: 'Ordine', defaultValue: 0 }),
        featured: fields.checkbox({ label: 'In Evidenza' }),
      },
    }),
  },
});
