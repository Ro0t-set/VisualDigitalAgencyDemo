import { defineConfig } from "tinacms";

// Your hosting provider likely exposes this as an environment variable
const branch =
  process.env.GITHUB_BRANCH ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.HEAD ||
  "main";

export default defineConfig({
  branch,

  // Per self-hosting locale senza cloud
  // Cambia a true per usare TinaCloud (richiede account)
  clientId: null,
  token: null,

  build: {
    outputFolder: "admin",
    publicFolder: "public",
  },
  media: {
    tina: {
      mediaRoot: "uploads",
      publicFolder: "public",
    },
  },
  schema: {
    collections: [
      // Impostazioni Globali
      {
        name: "settings",
        label: "Impostazioni",
        path: "content/settings",
        format: "json",
        ui: {
          allowedActions: {
            create: false,
            delete: false,
          },
          global: true,
        },
        fields: [
          {
            type: "string",
            name: "companyName",
            label: "Nome Azienda",
            required: true,
          },
          {
            type: "string",
            name: "tagline",
            label: "Slogan",
          },
          {
            type: "image",
            name: "logo",
            label: "Logo",
          },
          {
            type: "object",
            name: "colors",
            label: "Colori Brand",
            fields: [
              {
                type: "string",
                name: "primary",
                label: "Colore Primario",
                ui: {
                  component: "color",
                },
              },
              {
                type: "string",
                name: "secondary",
                label: "Colore Secondario",
                ui: {
                  component: "color",
                },
              },
              {
                type: "string",
                name: "accent",
                label: "Colore Accent",
                ui: {
                  component: "color",
                },
              },
            ],
          },
          {
            type: "object",
            name: "contact",
            label: "Contatti",
            fields: [
              { type: "string", name: "email", label: "Email" },
              { type: "string", name: "phone", label: "Telefono" },
              { type: "string", name: "address", label: "Indirizzo" },
            ],
          },
          {
            type: "object",
            name: "social",
            label: "Social Media",
            fields: [
              { type: "string", name: "facebook", label: "Facebook URL" },
              { type: "string", name: "instagram", label: "Instagram URL" },
              { type: "string", name: "linkedin", label: "LinkedIn URL" },
              { type: "string", name: "twitter", label: "Twitter URL" },
            ],
          },
          {
            type: "object",
            name: "seo",
            label: "SEO",
            fields: [
              { type: "string", name: "titleSuffix", label: "Suffisso Titolo" },
              {
                type: "string",
                name: "defaultDescription",
                label: "Descrizione Default",
                ui: { component: "textarea" },
              },
            ],
          },
          {
            type: "object",
            name: "legal",
            label: "Info Legali",
            fields: [
              { type: "string", name: "piva", label: "Partita IVA" },
              {
                type: "string",
                name: "codiceDestinatario",
                label: "Codice Destinatario",
              },
            ],
          },
        ],
      },
      // Pagina Home
      {
        name: "home",
        label: "Home Page",
        path: "content/pages",
        format: "json",
        ui: {
          allowedActions: {
            create: false,
            delete: false,
          },
        },
        match: {
          include: "home",
        },
        fields: [
          {
            type: "string",
            name: "title",
            label: "Titolo Pagina",
            required: true,
          },
          {
            type: "object",
            name: "seo",
            label: "SEO",
            fields: [
              { type: "string", name: "metaTitle", label: "Meta Title" },
              {
                type: "string",
                name: "metaDescription",
                label: "Meta Description",
                ui: { component: "textarea" },
              },
            ],
          },
          {
            type: "object",
            name: "hero",
            label: "Hero Section",
            fields: [
              {
                type: "string",
                name: "headline",
                label: "Titolo Principale",
              },
              {
                type: "string",
                name: "subheadline",
                label: "Sottotitolo",
                ui: { component: "textarea" },
              },
              {
                type: "image",
                name: "backgroundImage",
                label: "Immagine Sfondo",
              },
              {
                type: "object",
                name: "cta",
                label: "Pulsante Principale",
                fields: [
                  { type: "string", name: "text", label: "Testo" },
                  { type: "string", name: "link", label: "Link" },
                ],
              },
              {
                type: "object",
                name: "secondaryCta",
                label: "Pulsante Secondario",
                fields: [
                  { type: "string", name: "text", label: "Testo" },
                  { type: "string", name: "link", label: "Link" },
                ],
              },
            ],
          },
        ],
      },
      // Portfolio
      {
        name: "portfolio",
        label: "Portfolio",
        path: "content/portfolio",
        format: "json",
        fields: [
          {
            type: "string",
            name: "title",
            label: "Titolo Progetto",
            required: true,
          },
          {
            type: "string",
            name: "description",
            label: "Descrizione",
            ui: { component: "textarea" },
          },
          {
            type: "image",
            name: "image",
            label: "Immagine",
            required: true,
          },
          {
            type: "number",
            name: "order",
            label: "Ordine",
          },
          {
            type: "boolean",
            name: "featured",
            label: "In Evidenza",
          },
        ],
      },
    ],
  },
});
