# Keystatic + Astro: Guida Completa per Applicazioni Sicure

Questa guida contiene tutte le regole e best practices per creare applicazioni Keystatic + Astro sicure e affidabili.

---

## Indice

1. [Architettura e Concetti Fondamentali](#architettura-e-concetti-fondamentali)
2. [Configurazione Iniziale](#configurazione-iniziale)
3. [Storage Modes](#storage-modes)
4. [Sicurezza e Autenticazione](#sicurezza-e-autenticazione)
5. [Dual Deployment (Cloudflare + GitHub Pages)](#dual-deployment)
6. [Schema Design](#schema-design)
7. [Gestione Immagini](#gestione-immagini)
8. [Reader API](#reader-api)
9. [Checklist di Sicurezza](#checklist-di-sicurezza)
10. [Troubleshooting](#troubleshooting)

---

## Architettura e Concetti Fondamentali

### Cos'e Keystatic

Keystatic e un CMS headless Git-based che permette di gestire contenuti attraverso un'interfaccia Admin UI, salvando i dati direttamente nel repository Git (locale o GitHub).

### Componenti Principali

```
┌─────────────────────────────────────────────────────────────┐
│                        KEYSTATIC                            │
├─────────────────────────────────────────────────────────────┤
│  Config (keystatic.config.ts)                               │
│  ├── Storage: local | github | cloud                        │
│  ├── Singletons: dati unici (settings, homepage)            │
│  └── Collections: dati multipli (posts, portfolio)          │
├─────────────────────────────────────────────────────────────┤
│  Admin UI (/keystatic)                                      │
│  └── Richiede SSR (server-side rendering)                   │
├─────────────────────────────────────────────────────────────┤
│  Reader API                                                 │
│  └── Accesso ai contenuti lato server                       │
└─────────────────────────────────────────────────────────────┘
```

### Requisiti Fondamentali

- **SSR obbligatorio**: Keystatic richiede server-side rendering per l'Admin UI
- **Astro adapter**: Necessario per il deployment (cloudflare, vercel, node, etc.)
- **React integration**: L'Admin UI e costruita in React

---

## Configurazione Iniziale

### 1. Installazione

```bash
# Aggiungi le integrazioni Astro
npx astro add react markdoc

# Installa Keystatic
npm install @keystatic/core @keystatic/astro
```

### 2. Configurazione Astro (astro.config.mjs)

```javascript
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import keystatic from '@keystatic/astro';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server', // OBBLIGATORIO per Keystatic
  adapter: cloudflare(),
  integrations: [
    react(),
    markdoc(),
    keystatic(),
  ],
});
```

### 3. Configurazione Keystatic (keystatic.config.ts)

```typescript
import { config, fields, collection, singleton } from '@keystatic/core';

export default config({
  storage: {
    kind: 'github',
    repo: 'owner/repo-name',
  },

  ui: {
    brand: { name: 'Nome Progetto' },
  },

  singletons: {
    // Definizioni singleton
  },

  collections: {
    // Definizioni collection
  },
});
```

---

## Storage Modes

### Local Mode

**Uso**: Sviluppo locale, prototipazione

```typescript
storage: {
  kind: 'local',
}
```

- Salva i contenuti nel filesystem locale
- Non richiede autenticazione
- Ideale per `npm run dev`

### GitHub Mode

**Uso**: Produzione con team collaborativo

```typescript
storage: {
  kind: 'github',
  repo: 'owner/repo-name',
  // Opzionale: limita ai branch con questo prefisso
  branchPrefix: 'content/',
}
```

**Variabili d'ambiente richieste**:
- `KEYSTATIC_GITHUB_CLIENT_ID`
- `KEYSTATIC_GITHUB_CLIENT_SECRET`
- `KEYSTATIC_SECRET`
- `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` (Astro)

### Cloud Mode

**Uso**: Semplificazione OAuth, team senza account GitHub

```typescript
storage: {
  kind: 'cloud',
},
cloud: {
  project: 'team-name/project-name',
}
```

- Gestisce l'autenticazione automaticamente
- Supporta Cloud Images per storage immagini

---

## Sicurezza e Autenticazione

### Come Funziona OAuth con GitHub Mode

```
┌──────────┐    ┌───────────────────┐    ┌────────┐
│ Browser  │    │ Cloudflare Worker │    │ GitHub │
└────┬─────┘    └────────┬──────────┘    └───┬────┘
     │                   │                   │
     │ 1. Click login    │                   │
     │──────────────────>│                   │
     │                   │                   │
     │ 2. Redirect       │                   │
     │<──────────────────│                   │
     │                   │                   │
     │ 3. Autorizza su GitHub               │
     │──────────────────────────────────────>│
     │                   │                   │
     │ 4. Callback con code                 │
     │<──────────────────────────────────────│
     │                   │                   │
     │ 5. Code exchange  │                   │
     │──────────────────>│                   │
     │                   │ 6. Scambia code   │
     │                   │   per token       │
     │                   │──────────────────>│
     │                   │<──────────────────│
     │                   │                   │
     │ 7. Session cookie │                   │
     │<──────────────────│                   │
```

### Cosa e Esposto e Cosa No

| Variabile | Dove vive | Visibile al browser? |
|-----------|-----------|---------------------|
| `KEYSTATIC_GITHUB_CLIENT_ID` | Cloudflare env | Si (pubblico per OAuth) |
| `KEYSTATIC_GITHUB_CLIENT_SECRET` | Cloudflare env | **NO** - solo server |
| `KEYSTATIC_SECRET` | Cloudflare env | **NO** - solo server |

### Regole di Sicurezza Fondamentali

1. **MAI** committare `.env` nel repository
2. **MAI** hardcodare secrets nel codice
3. **SEMPRE** usare environment variables della piattaforma di hosting
4. **SEMPRE** verificare che `.env` sia in `.gitignore`
5. L'accesso a `/keystatic` richiede permessi `write` sul repo GitHub

---

## Dual Deployment

### Strategia: Cloudflare Pages + GitHub Pages

Questa configurazione permette di avere:
- **Cloudflare Pages**: SSR con Keystatic per editing
- **GitHub Pages**: Build statico per demo/backup

### Configurazione astro.config.mjs

```javascript
// Rileva l'ambiente di build
const isCloudflare = process.env.CF_PAGES === '1';
const isGitHubActions = process.env.CI === 'true' && !isCloudflare;

export default defineConfig({
  // URL e base path dinamici
  site: isGitHubActions
    ? 'https://username.github.io'
    : 'https://project.pages.dev',
  base: isGitHubActions ? '/repo-name' : '',

  // Output mode
  output: isGitHubActions ? 'static' : 'server',

  // Adapter solo per SSR
  adapter: isGitHubActions ? undefined : cloudflare(),

  // Keystatic solo su Cloudflare
  integrations: [
    react(),
    markdoc(),
    ...(isGitHubActions ? [] : [keystatic()]),
    sitemap(),
  ],
});
```

### Variabili d'ambiente per piattaforma

**Cloudflare Pages** (automatiche):
- `CF_PAGES=1`

**GitHub Actions** (automatiche):
- `CI=true`

### Struttura file .env

```bash
# .env (locale e Cloudflare - MAI committare)
KEYSTATIC_GITHUB_CLIENT_ID=xxx
KEYSTATIC_GITHUB_CLIENT_SECRET=xxx
KEYSTATIC_SECRET=xxx
PUBLIC_KEYSTATIC_GITHUB_APP_SLUG=app-name

# .env.example (da committare - solo documentazione)
# Vedi dashboard Cloudflare per le variabili Keystatic
```

---

## Schema Design

### Singletons vs Collections

| Tipo | Uso | Esempio |
|------|-----|---------|
| **Singleton** | Dato unico | Settings, Homepage, About page |
| **Collection** | Dati multipli | Blog posts, Portfolio, Team members |

### Singleton: Best Practices

```typescript
singletons: {
  global: singleton({
    label: 'Impostazioni Globali',
    path: 'content/settings/global',  // Percorso file
    format: { data: 'json' },          // Formato dati
    schema: {
      companyName: fields.text({ label: 'Nome Azienda' }),

      // Raggruppa campi correlati con objects
      contact: fields.object({
        email: fields.text({ label: 'Email' }),
        phone: fields.text({ label: 'Telefono' }),
      }, { label: 'Contatti' }),

      // Colori come testo con default
      colors: fields.object({
        primary: fields.text({
          label: 'Colore Primario',
          defaultValue: '#8B5CF6'
        }),
      }, { label: 'Colori' }),
    },
  }),
}
```

### Collection: Best Practices

```typescript
collections: {
  portfolio: collection({
    label: 'Portfolio',
    slugField: 'title',              // Campo per lo slug
    path: 'content/portfolio/*',     // Percorso con wildcard
    format: { data: 'json' },
    schema: {
      // Slug field per URL-friendly identifiers
      title: fields.slug({
        name: { label: 'Titolo' }
      }),

      // Immagine con validation
      image: fields.image({
        label: 'Immagine',
        directory: 'src/assets/images/gallery',
        publicPath: '/src/assets/images/gallery/',
        validation: { isRequired: true },
      }),

      // Ordinamento
      order: fields.number({
        label: 'Ordine',
        defaultValue: 0
      }),

      // Flag boolean
      featured: fields.checkbox({ label: 'In Evidenza' }),
    },
  }),
}
```

### Tipi di Campo Disponibili

| Campo | Uso | Esempio |
|-------|-----|---------|
| `fields.text()` | Testo breve/lungo | Titoli, descrizioni |
| `fields.slug()` | URL-friendly string | Identificatori entry |
| `fields.number()` | Numeri | Ordine, prezzi |
| `fields.checkbox()` | Boolean | Featured, published |
| `fields.select()` | Scelta singola | Categoria, stato |
| `fields.multiselect()` | Scelte multiple | Tags |
| `fields.date()` | Date | Pubblicazione |
| `fields.url()` | URL validati | Link esterni |
| `fields.image()` | Immagini | Media content |
| `fields.file()` | File generici | PDF, documenti |
| `fields.object()` | Oggetti nested | Gruppi di campi |
| `fields.array()` | Liste | Items ripetibili |
| `fields.conditional()` | Campi condizionali | Show/hide based on value |
| `fields.relationship()` | Relazioni | Link tra collections |
| `fields.markdoc()` | Rich text | Contenuti formattati |
| `fields.mdx()` | MDX content | Contenuti con componenti |

### Conditional Fields

```typescript
seo: fields.conditional(
  fields.checkbox({
    label: 'Personalizza SEO',
    defaultValue: false
  }),
  {
    true: fields.object({
      title: fields.text({ label: 'Titolo SEO' }),
      description: fields.text({ label: 'Descrizione SEO' }),
    }),
    false: fields.empty(),
  }
)
```

### Relationship Fields

```typescript
// ATTENZIONE: Se lo slug dell'entry referenziata cambia,
// la relazione si rompe! Pianifica gli slug attentamente.

author: fields.relationship({
  label: 'Autore',
  collection: 'authors',  // Deve esistere in collections
})

// Per relazioni multiple, wrappa in array
authors: fields.array(
  fields.relationship({
    label: 'Autori',
    collection: 'authors',
  }),
  { label: 'Autori', itemLabel: props => props.value }
)
```

---

## Gestione Immagini

### ATTENZIONE: Errori Comuni da Evitare

La gestione delle immagini in Keystatic e una delle parti piu delicate. Errori nella configurazione causano:
- Immagini non visibili nell'Admin UI `/keystatic`
- Immagini che non si caricano nel frontend
- Path errati nei file JSON

### Come Funziona Keystatic con le Immagini

Keystatic gestisce le immagini in modo **diverso** per Collections e Singletons:

#### Per le Collections (con slug)

Keystatic crea una **sottocartella con lo slug dell'entry**:

```
directory: 'public/images/portfolio'
publicPath: '/images/portfolio/'

Risultato per entry "progetto-alpha":
public/images/portfolio/progetto-alpha/image.jpg

Valore salvato nel JSON: /images/portfolio/progetto-alpha/image.jpg
```

#### Per i Singletons (senza slug)

Keystatic crea una **sottocartella con il nome del singleton**:

```
directory: 'public/images/settings'
publicPath: '/images/settings/'

Risultato per singleton "global", campo "logo":
public/images/settings/global/logo.png

Valore salvato nel JSON: /images/settings/global/logo.png
```

### Configurazione CORRETTA per Collections

```typescript
// keystatic.config.ts
collections: {
  portfolio: collection({
    label: 'Portfolio',
    slugField: 'title',
    path: 'content/portfolio/*',
    format: { data: 'json' },
    schema: {
      title: fields.slug({ name: { label: 'Titolo' } }),

      // CONFIGURAZIONE CORRETTA
      image: fields.image({
        label: 'Immagine',
        // Directory SENZA slash iniziale
        directory: 'public/images/portfolio',
        // PublicPath CON slash iniziale e finale
        publicPath: '/images/portfolio/',
        validation: { isRequired: true },
      }),
    },
  }),
}
```

**Struttura file risultante:**
```
public/
└── images/
    └── portfolio/
        ├── progetto-1/
        │   └── image.jpg
        ├── progetto-2/
        │   └── image.png
        └── progetto-3/
            └── image.webp
```

**Valore nel JSON:**
```json
{
  "title": "progetto-1",
  "image": "/images/portfolio/progetto-1/image.jpg"
}
```

### Configurazione CORRETTA per Singletons

```typescript
singletons: {
  global: singleton({
    label: 'Impostazioni',
    path: 'content/settings/global',
    format: { data: 'json' },
    schema: {
      logo: fields.image({
        label: 'Logo',
        // Directory SENZA slash iniziale
        directory: 'public/images/brand',
        // PublicPath CON slash iniziale e finale
        publicPath: '/images/brand/',
      }),
    },
  }),
}
```

**Struttura file risultante:**
```
public/
└── images/
    └── brand/
        └── global/           <- Nome del singleton
            └── logo.png      <- Nome del campo
```

**Valore nel JSON:**
```json
{
  "logo": "/images/brand/global/logo.png"
}
```

### Regole d'Oro per le Immagini

| Proprieta | Regola | Esempio Corretto | Esempio ERRATO |
|-----------|--------|------------------|----------------|
| `directory` | SENZA slash iniziale | `public/images/gallery` | `/public/images/gallery` |
| `directory` | SENZA slash finale | `public/images/gallery` | `public/images/gallery/` |
| `publicPath` | CON slash iniziale | `/images/gallery/` | `images/gallery/` |
| `publicPath` | CON slash finale | `/images/gallery/` | `/images/gallery` |

### Dove Salvare le Immagini: public/ vs src/assets/

| Directory | Uso | Pro | Contro |
|-----------|-----|-----|--------|
| `public/` | Immagini gestite da Keystatic | Path prevedibili, servite direttamente | No ottimizzazione Astro |
| `src/assets/` | Immagini con Astro Image | Ottimizzazione automatica | Path complessi da gestire |

**Raccomandazione**: Usa `public/` per le immagini gestite da Keystatic. E piu semplice e prevedibile.

### Configurazione per src/assets/ (Avanzato)

Se vuoi usare `src/assets/` con Astro Image optimization:

```typescript
image: fields.image({
  label: 'Immagine',
  directory: 'src/assets/images/gallery',
  publicPath: '/src/assets/images/gallery/',
})
```

**ATTENZIONE**: Con `src/assets/`, devi usare `import.meta.glob` per caricare le immagini:

```typescript
---
// Nel componente Astro
import { Image } from 'astro:assets';

// Importa tutte le immagini della gallery
const images = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/images/gallery/**/*.{png,jpg,jpeg,webp}',
  { eager: true }
);

// Funzione per trovare l'immagine dal path salvato nel JSON
function getImage(jsonPath: string) {
  // jsonPath = "/src/assets/images/gallery/progetto-1/image.jpg"
  const key = jsonPath; // Il path nel JSON corrisponde alla chiave del glob
  return images[key]?.default;
}

// Uso
const portfolioItem = { image: "/src/assets/images/gallery/progetto-1/image.jpg" };
const imageData = getImage(portfolioItem.image);
---

{imageData && <Image src={imageData} alt="Portfolio" />}
```

### Verifica Configurazione Immagini

Checklist per debug:

1. **Il file esiste fisicamente?**
   ```bash
   ls -la public/images/portfolio/progetto-1/
   ```

2. **Il path nel JSON e corretto?**
   ```bash
   cat content/portfolio/progetto-1.json | grep image
   ```

3. **Il publicPath corrisponde alla struttura?**
   - Se `publicPath: '/images/portfolio/'`
   - E lo slug e `progetto-1`
   - E il campo e `image`
   - Il file deve essere in: `public/images/portfolio/progetto-1/image.*`

4. **L'Admin UI mostra l'immagine?**
   - Vai su `/keystatic`
   - Apri l'entry
   - L'immagine deve essere visibile nel campo

### Errori Comuni e Soluzioni

#### Immagine non visibile in /keystatic

**Causa**: Il path nel JSON non corrisponde alla posizione fisica del file.

**Verifica**:
```bash
# Vedi cosa c'e nel JSON
cat content/portfolio/progetto-1.json

# Esempio output: "image": "/images/portfolio/progetto-1/image.jpg"

# Verifica che il file esista
ls public/images/portfolio/progetto-1/image.jpg
```

**Soluzione**: Assicurati che:
- `directory` punti alla cartella corretta (senza il nome dell'entry)
- `publicPath` corrisponda al path relativo dalla root del sito

#### Immagine visibile in keystatic ma non nel frontend

**Causa**: Il path e corretto per Keystatic ma non per il frontend.

**Verifica**: Il path salvato deve corrispondere a un URL accessibile.
- `/images/...` -> serve da `public/images/...`
- `/src/assets/...` -> richiede import dinamico con Vite

#### Upload fallisce silenziosamente

**Causa**: La directory non esiste o non ha permessi di scrittura.

**Soluzione**:
```bash
mkdir -p public/images/portfolio
```

### Esempio Completo: Portfolio con Immagini

**keystatic.config.ts:**
```typescript
import { config, fields, collection } from '@keystatic/core';

export default config({
  storage: { kind: 'github', repo: 'owner/repo' },

  collections: {
    portfolio: collection({
      label: 'Portfolio',
      slugField: 'title',
      path: 'content/portfolio/*',
      format: { data: 'json' },
      schema: {
        title: fields.slug({ name: { label: 'Titolo' } }),
        image: fields.image({
          label: 'Immagine Principale',
          directory: 'public/images/portfolio',
          publicPath: '/images/portfolio/',
          validation: { isRequired: true },
        }),
        gallery: fields.array(
          fields.image({
            label: 'Immagine',
            directory: 'public/images/portfolio',
            publicPath: '/images/portfolio/',
          }),
          { label: 'Galleria', itemLabel: (props) => props.value || 'Immagine' }
        ),
      },
    }),
  },
});
```

**Struttura risultante dopo upload:**
```
content/
└── portfolio/
    └── progetto-web.json

public/
└── images/
    └── portfolio/
        └── progetto-web/
            ├── image.jpg           <- Campo "image"
            ├── gallery/0/image.png <- Prima immagine gallery
            └── gallery/1/image.jpg <- Seconda immagine gallery
```

**content/portfolio/progetto-web.json:**
```json
{
  "title": "progetto-web",
  "image": "/images/portfolio/progetto-web/image.jpg",
  "gallery": [
    "/images/portfolio/progetto-web/gallery/0/image.png",
    "/images/portfolio/progetto-web/gallery/1/image.jpg"
  ]
}
```

**Componente Astro:**
```astro
---
import portfolio from '../../content/portfolio/progetto-web.json';
---

<img src={portfolio.image} alt={portfolio.title} />

{portfolio.gallery.map((img, i) => (
  <img src={img} alt={`Gallery ${i + 1}`} />
))}
```

---

## Reader API

### Setup Base

```typescript
// src/lib/keystatic.ts
import { createReader } from '@keystatic/core/reader';
import keystaticConfig from '../../keystatic.config';

export const reader = createReader(process.cwd(), keystaticConfig);
```

### Uso nei Componenti Astro

```typescript
---
// Frontmatter - eseguito lato server
import { reader } from '../lib/keystatic';

// Leggi singleton
const settings = await reader.singletons.global.read();

// Leggi tutti gli items di una collection
const allPosts = await reader.collections.posts.all();

// Leggi singolo item per slug
const post = await reader.collections.posts.read('my-post-slug');

// Lista solo gli slug
const slugs = await reader.collections.posts.list();
---
```

### GitHub Reader (per build statici)

```typescript
import { createGitHubReader } from '@keystatic/core/reader/github';

const reader = createGitHubReader(keystaticConfig, {
  repo: 'owner/repo',
  token: process.env.GITHUB_PAT, // Personal Access Token
});
```

### Type Safety

```typescript
import { Entry } from '@keystatic/core/reader';
import keystaticConfig from '../keystatic.config';

// Tipo per entry di una collection
type PostEntry = Entry<typeof keystaticConfig['collections']['posts']>;

// Tipo per singleton
type GlobalSettings = Entry<typeof keystaticConfig['singletons']['global']>;
```

---

## Checklist di Sicurezza

### Prima del Deploy

- [ ] `.env` e in `.gitignore`
- [ ] `.env.example` contiene solo documentazione, non secrets
- [ ] Nessun secret hardcodato nel codice
- [ ] Environment variables configurate nella dashboard Cloudflare
- [ ] GitHub App ha accesso solo ai repository necessari

### Configurazione Cloudflare

1. Vai su **Cloudflare Dashboard** > **Pages** > **Progetto**
2. **Settings** > **Environment variables**
3. Aggiungi le variabili:
   - `KEYSTATIC_GITHUB_CLIENT_ID`
   - `KEYSTATIC_GITHUB_CLIENT_SECRET`
   - `KEYSTATIC_SECRET`
   - `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG`
4. **IMPORTANTE**: Configura per "Production" e "Preview" se necessario

### Verifica Accessi

- [ ] Solo utenti con `write` access al repo possono accedere a `/keystatic`
- [ ] Il callback URL nella GitHub App e corretto
- [ ] Non ci sono route API esposte senza autenticazione

### Monitoraggio

- [ ] Controlla i log di Cloudflare per errori di autenticazione
- [ ] Verifica che le immagini uploadate siano accessibili
- [ ] Testa il flusso di login su un nuovo browser/incognito

---

## Troubleshooting

### Errore: Redirect URI Mismatch

**Problema**: GitHub restituisce errore di redirect URI durante il login.

**Soluzione**:
1. Vai su GitHub > Settings > Developer settings > GitHub Apps
2. Trova la tua app
3. Aggiungi il callback URL corretto:
   - `https://your-domain.pages.dev/keystatic/api/github/oauth/callback`

### Errore: 404 su /keystatic

**Problema**: La route `/keystatic` non esiste.

**Cause possibili**:
1. Build statico invece che SSR
2. Integrazione keystatic non inclusa

**Verifica**:
```javascript
// astro.config.mjs
output: 'server',  // NON 'static'
integrations: [keystatic()],  // Deve essere presente
```

### Errore: Content non aggiornato

**Problema**: Le modifiche in Keystatic non appaiono nel sito.

**Cause**:
1. Cache del CDN
2. Build non triggerato

**Soluzioni**:
1. Purga cache Cloudflare
2. Verifica che il commit sia stato pushato
3. Controlla che il branch sia quello corretto

### Errore: Immagini non caricate

**Problema**: Le immagini uploadate non appaiono.

**Verifica**:
1. `directory` e `publicPath` sono coerenti nel config
2. Il percorso nel JSON corrisponde al file effettivo
3. Per Astro Image, usa import dinamico corretto

### Build Fallito su GitHub Actions

**Problema**: La build statica fallisce.

**Verifica**:
1. Keystatic deve essere escluso: `...(isGitHubActions ? [] : [keystatic()])`
2. Output deve essere `'static'`
3. Nessun adapter definito

---

## Struttura Progetto Raccomandata

```
project/
├── .github/
│   └── workflows/
│       └── deploy.yml          # CI/CD per GitHub Pages
├── content/                     # Contenuti Keystatic
│   ├── settings/
│   │   └── global.json
│   ├── pages/
│   │   └── homepage.json
│   └── [collections]/
│       └── *.json
├── src/
│   ├── assets/
│   │   └── images/
│   │       ├── uploads/        # Immagini globali
│   │       └── gallery/        # Immagini collections
│   ├── components/
│   ├── layouts/
│   ├── lib/
│   │   └── keystatic.ts        # Reader API helper
│   ├── pages/
│   └── styles/
├── .env                         # Secrets (gitignored)
├── .env.example                 # Documentazione env
├── .gitignore
├── astro.config.mjs
├── keystatic.config.ts
├── package.json
└── tsconfig.json
```

---

## Riferimenti

- [Documentazione Keystatic](https://keystatic.com/docs)
- [Astro + Keystatic Integration](https://keystatic.com/docs/installation-astro)
- [GitHub Mode Setup](https://keystatic.com/docs/github-mode)
- [Cloudflare Pages Deployment](https://developers.cloudflare.com/pages/)
- [Astro SSR Adapters](https://docs.astro.build/en/guides/server-side-rendering/)
