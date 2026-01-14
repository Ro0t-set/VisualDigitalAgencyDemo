import { config, fields, collection, singleton } from '@keystatic/core';

export default config({
  storage: {
    kind: 'github',
    repo: 'Ro0t-set/VisualDigitalAgencyDemo',
  },

  ui: {
    brand: { name: 'Viral Digital Agency' },
  },

  singletons: {
    // Impostazioni Globali del sito
    global: singleton({
      label: 'Impostazioni Globali',
      path: 'content/settings/global',
      format: { data: 'json' },
      schema: {
        companyName: fields.text({ label: 'Nome Azienda' }),
        tagline: fields.text({ label: 'Tagline' }),
        logo: fields.image({
          label: 'Logo',
          directory: 'public/uploads',
          publicPath: '/uploads/',
        }),
        colors: fields.object({
          primary: fields.text({ label: 'Colore Primario', defaultValue: '#8B5CF6' }),
          secondary: fields.text({ label: 'Colore Secondario', defaultValue: '#6D28D9' }),
          accent: fields.text({ label: 'Colore Accent', defaultValue: '#EC4899' }),
        }, { label: 'Colori' }),
        contact: fields.object({
          email: fields.text({ label: 'Email' }),
          phone: fields.text({ label: 'Telefono' }),
          address: fields.text({ label: 'Indirizzo' }),
        }, { label: 'Contatti' }),
        social: fields.object({
          facebook: fields.url({ label: 'Facebook' }),
          instagram: fields.url({ label: 'Instagram' }),
          linkedin: fields.url({ label: 'LinkedIn' }),
          twitter: fields.url({ label: 'Twitter/X' }),
        }, { label: 'Social Media' }),
        seo: fields.object({
          titleSuffix: fields.text({ label: 'Suffisso Titolo SEO' }),
          defaultDescription: fields.text({ label: 'Descrizione Default', multiline: true }),
        }, { label: 'SEO' }),
        form: fields.object({
          formspreeId: fields.text({ label: 'Formspree ID' }),
        }, { label: 'Form Contatti' }),
        legal: fields.object({
          piva: fields.text({ label: 'Partita IVA' }),
          codiceDestinatario: fields.text({ label: 'Codice Destinatario SDI' }),
        }, { label: 'Dati Legali' }),
      },
    }),

    // Homepage - tutte le sezioni
    homepage: singleton({
      label: 'Homepage',
      path: 'content/pages/homepage',
      format: { data: 'json' },
      schema: {
        seo: fields.object({
          title: fields.text({ label: 'Titolo SEO' }),
          description: fields.text({ label: 'Descrizione SEO', multiline: true }),
        }, { label: 'SEO' }),

        // Hero Section
        hero: fields.object({
          badge: fields.text({ label: 'Badge (testo sopra titolo)' }),
          title: fields.text({ label: 'Titolo Principale' }),
          subtitle: fields.text({ label: 'Sottotitolo', multiline: true }),
          ctaPrimary: fields.object({
            text: fields.text({ label: 'Testo' }),
            link: fields.text({ label: 'Link' }),
          }, { label: 'CTA Primario' }),
          ctaSecondary: fields.object({
            text: fields.text({ label: 'Testo' }),
            link: fields.text({ label: 'Link' }),
          }, { label: 'CTA Secondario' }),
        }, { label: 'Hero Section' }),

        // About Section
        about: fields.object({
          badge: fields.text({ label: 'Badge' }),
          title: fields.text({ label: 'Titolo' }),
          description: fields.text({ label: 'Descrizione', multiline: true }),
          backgroundImage: fields.text({ label: 'URL Immagine Background' }),
        }, { label: 'About Section' }),

        // Services Section
        services: fields.object({
          badge: fields.text({ label: 'Badge' }),
          title: fields.text({ label: 'Titolo' }),
          subtitle: fields.text({ label: 'Sottotitolo' }),
          description: fields.text({ label: 'Descrizione', multiline: true }),
        }, { label: 'Sezione Servizi' }),

        // Trailer/Video Section
        trailer: fields.object({
          badge: fields.text({ label: 'Badge' }),
          title: fields.text({ label: 'Titolo' }),
          videoUrl: fields.text({ label: 'URL Video (YouTube/Vimeo)' }),
          backgroundImage: fields.text({ label: 'URL Immagine Background' }),
          playButtonText: fields.text({ label: 'Testo sotto play button' }),
        }, { label: 'Sezione Trailer/Video' }),

        // Portfolio Section
        portfolio: fields.object({
          badge: fields.text({ label: 'Badge' }),
          title: fields.text({ label: 'Titolo' }),
          subtitle: fields.text({ label: 'Sottotitolo' }),
        }, { label: 'Sezione Portfolio' }),

        // Social Section
        social: fields.object({
          badge: fields.text({ label: 'Badge' }),
          title: fields.text({ label: 'Titolo' }),
        }, { label: 'Sezione Social' }),

        // Contact Section
        contact: fields.object({
          title: fields.text({ label: 'Titolo' }),
          description: fields.text({ label: 'Descrizione', multiline: true }),
        }, { label: 'Sezione Contatti' }),
      },
    }),
  },

  collections: {
    // Portfolio Items (Gallery)
    portfolio: collection({
      label: 'Portfolio',
      slugField: 'title',
      path: 'content/portfolio/*',
      format: { data: 'json' },
      schema: {
        title: fields.slug({ name: { label: 'Titolo' } }),
        image: fields.image({
          label: 'Immagine',
          directory: 'public/uploads/gallery',
          publicPath: '/uploads/gallery/',
          validation: { isRequired: true },
        }),
        description: fields.text({ label: 'Descrizione', multiline: true }),
        order: fields.number({ label: 'Ordine', defaultValue: 0 }),
        featured: fields.checkbox({ label: 'In Evidenza' }),
      },
    }),
  },
});
