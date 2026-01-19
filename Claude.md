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

### Configurazione Ibrida Local/GitHub (RACCOMANDATA)

La configurazione migliore e usare **Local Mode in sviluppo** e **GitHub Mode in produzione**:

```typescript
import { config, fields, collection, singleton } from '@keystatic/core';

// Determina se siamo in ambiente locale (dev) o produzione
const isLocal = process.env.NODE_ENV === 'development' || import.meta.env?.DEV;

// Storage: local in dev, github in produzione
const storage = isLocal
  ? { kind: 'local' as const }
  : {
      kind: 'github' as const,
      repo: 'owner/repo-name' as const,
    };

export default config({
  storage,
  // ... resto della configurazione
});
```

**Vantaggi**:
- In sviluppo: modifiche istantanee senza push, niente autenticazione OAuth
- In produzione: collaborazione team, versionamento Git, OAuth sicuro

### Local Mode

**Uso**: Sviluppo locale, prototipazione

```typescript
storage: {
  kind: 'local',
}
```

- Salva i contenuti nel filesystem locale
- Non richiede autenticazione
- Modifiche immediate senza push
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

**IMPORTANTE**: In GitHub mode, Keystatic legge dal repository REMOTO. Le modifiche locali non sono visibili finche non fai push.

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

### ATTENZIONE CRITICA: La gestione immagini e la parte PIU DELICATA di Keystatic

La gestione delle immagini in Keystatic e la fonte principale di errori. Questa sezione contiene le lezioni apprese da debugging estensivo.

### REGOLA FONDAMENTALE: GitHub Mode legge dal repository REMOTO

**CRITICO per GitHub Mode**: Keystatic in `storage: { kind: 'github' }` **NON legge dal filesystem locale**. Legge i file direttamente dal repository GitHub remoto.

**Conseguenze pratiche**:
1. Se modifichi immagini o JSON localmente, **devi fare push** prima che Keystatic le veda
2. Le anteprime nell'Admin UI vengono caricate da GitHub, non dal tuo disco
3. Un'immagine puo esistere localmente ma non apparire in `/keystatic` finche non e su GitHub

```bash
# Workflow corretto per vedere le immagini in Keystatic
git add .
git commit -m "Add images"
git push  # <-- Solo dopo questo Keystatic vedra le immagini!
```

### Come Keystatic Salva i Path delle Immagini

Keystatic salva nel JSON il **path COMPLETO** dell'immagine, composto da:
```
publicPath + slug_entry + nome_file
```

**Esempio CONCRETO** (da debugging reale):

Config:
```typescript
image: fields.image({
  directory: 'src/assets/images/portfolio',
  publicPath: '/src/assets/images/portfolio/',
})
```

Quando carichi un'immagine per l'entry `progetto-1`:
- File salvato in: `src/assets/images/portfolio/progetto-1/image.png`
- Valore nel JSON: `"/src/assets/images/portfolio/progetto-1/image.png"` (path COMPLETO)

**NON** salva solo il filename `"image.png"`. Salva il path completo.

### Struttura File per Collections

Per una collection con `slugField: 'title'`:

```
keystatic.config.ts:
  directory: 'src/assets/images/portfolio'
  publicPath: '/src/assets/images/portfolio/'

Entry con slug "progetto-1":
  File:  src/assets/images/portfolio/progetto-1/image.png
  JSON:  "image": "/src/assets/images/portfolio/progetto-1/image.png"

Entry con slug "progetto-2":
  File:  src/assets/images/portfolio/progetto-2/image.png
  JSON:  "image": "/src/assets/images/portfolio/progetto-2/image.png"
```

### Struttura File per Singletons

Per un singleton chiamato `global`:

```
keystatic.config.ts:
  directory: 'src/assets/images/uploads'
  publicPath: '/src/assets/images/uploads/'

Singleton "global", campo "logo":
  File:  src/assets/images/uploads/global/logo.png
  JSON:  "logo": "/src/assets/images/uploads/global/logo.png"
```

### Configurazione CORRETTA e TESTATA

Questa configurazione e stata verificata funzionante:

```typescript
// keystatic.config.ts
import { config, fields, collection, singleton } from '@keystatic/core';

export default config({
  storage: {
    kind: 'github',
    repo: 'owner/repo-name',
  },

  singletons: {
    global: singleton({
      label: 'Impostazioni Globali',
      path: 'content/settings/global',
      format: { data: 'json' },
      schema: {
        logoNavbar: fields.image({
          label: 'Logo Navbar',
          directory: 'src/assets/images/uploads',
          publicPath: '/src/assets/images/uploads/',
        }),
        logoHero: fields.image({
          label: 'Logo Hero',
          directory: 'src/assets/images/uploads',
          publicPath: '/src/assets/images/uploads/',
        }),
      },
    }),
  },

  collections: {
    portfolio: collection({
      label: 'Portfolio',
      slugField: 'title',
      path: 'content/portfolio/*',
      format: { data: 'json' },
      schema: {
        title: fields.slug({ name: { label: 'Titolo' } }),
        image: fields.image({
          label: 'Immagine',
          directory: 'src/assets/images/portfolio',
          publicPath: '/src/assets/images/portfolio/',
        }),
        description: fields.text({ label: 'Descrizione', multiline: true }),
        order: fields.number({ label: 'Ordine', defaultValue: 0 }),
        featured: fields.checkbox({ label: 'In Evidenza' }),
      },
    }),
  },
});
```

### Struttura File Risultante (VERIFICATA)

```
src/assets/images/
├── uploads/
│   └── global/                    <- Nome del singleton
│       ├── logoNavbar.png         <- Campo logoNavbar
│       └── logoHero.png           <- Campo logoHero
└── portfolio/
    ├── progetto-1/                <- Slug dell'entry
    │   └── image.png              <- Campo image
    ├── progetto-2/
    │   └── image.png
    └── vfdc/                      <- Altro entry
        └── image.png

content/
├── settings/
│   └── global.json
└── portfolio/
    ├── progetto-1.json
    ├── progetto-2.json
    └── vfdc.json
```

### JSON Risultante (VERIFICATO)

**content/settings/global.json:**
```json
{
  "logoNavbar": "/src/assets/images/uploads/global/logoNavbar.png",
  "logoHero": "/src/assets/images/uploads/global/logoHero.png"
}
```

**content/portfolio/progetto-1.json:**
```json
{
  "title": "Progetto 1",
  "image": "/src/assets/images/portfolio/progetto-1/image.png",
  "description": "Descrizione progetto",
  "order": 1,
  "featured": true
}
```

### Usare le Immagini nel Frontend con Astro Image

Con `src/assets/`, devi usare `import.meta.glob` per caricare le immagini e ottenerle ottimizzate:

```typescript
---
// src/pages/index.astro
import { Image } from 'astro:assets';

// Import JSON portfolio
const portfolioFiles = import.meta.glob<{ default: any }>(
  '/content/portfolio/*.json',
  { eager: true }
);

// Import TUTTE le immagini portfolio
const portfolioImages = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/images/portfolio/**/*.{png,jpg,jpeg,gif,webp}',
  { eager: true }
);

// Costruisci array portfolio con immagini
const portfolio = Object.entries(portfolioFiles)
  .map(([filePath, mod]) => {
    const slug = filePath.split('/').pop()?.replace('.json', '') || '';
    const titleData = mod.default.title;
    const displayTitle = typeof titleData === 'object' ? titleData.name : titleData;

    // Il JSON contiene il path completo: /src/assets/images/portfolio/slug/image.png
    const imagePath = mod.default.image;
    const imageModule = portfolioImages[imagePath];

    return {
      ...mod.default,
      slug,
      displayTitle,
      image: imageModule?.default || null,
    };
  })
  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
---

{portfolio.map((item) => (
  item.image ? (
    <Image
      src={item.image}
      alt={item.displayTitle}
      width={400}
      height={400}
      class="w-full h-full object-cover"
    />
  ) : (
    <div>No image</div>
  )
))}
```

### Checklist Debug Immagini

Quando le immagini non appaiono in `/keystatic`:

1. **Hai fatto push su GitHub?** (CRITICO per GitHub mode)
   ```bash
   git status  # Deve mostrare "nothing to commit"
   git log -1  # Verifica che il commit con le immagini sia pushato
   ```

2. **Il path nel JSON corrisponde al file fisico?**
   ```bash
   # Leggi il JSON
   cat content/portfolio/progetto-1.json | grep image
   # Output: "image": "/src/assets/images/portfolio/progetto-1/image.png"

   # Verifica che il file esista
   ls -la src/assets/images/portfolio/progetto-1/image.png
   ```

3. **La directory e il publicPath sono coerenti?**
   - `directory: 'src/assets/images/portfolio'` (senza slash iniziale)
   - `publicPath: '/src/assets/images/portfolio/'` (con slash iniziale E finale)

4. **Lo slug nel JSON corrisponde alla sottocartella?**
   - Entry slug: `progetto-1`
   - Sottocartella immagine: `src/assets/images/portfolio/progetto-1/`

### Errore Comune: Solo filename nel JSON

**SBAGLIATO** - Se il JSON contiene solo il filename:
```json
{
  "image": "image.png"
}
```

**CORRETTO** - Deve contenere il path completo:
```json
{
  "image": "/src/assets/images/portfolio/progetto-1/image.png"
}
```

Se hai JSON con solo filename, Keystatic non trovera l'immagine. Correggi manualmente o ricrea l'entry tramite l'Admin UI.

### Errore Comune: Immagini non pushate

Se modifichi/aggiungi immagini localmente ma non fai push:
- Il file esiste nel tuo filesystem ✓
- Keystatic Admin UI non lo vede ✗
- L'anteprima mostra "Choose image" invece dell'immagine

**Soluzione**: `git add . && git commit -m "Add images" && git push`

### Alternativa: Usare public/ invece di src/assets/

Se preferisci path piu semplici senza ottimizzazione Astro:

```typescript
image: fields.image({
  directory: 'public/images/portfolio',
  publicPath: '/images/portfolio/',
})
```

**Pro**: Path diretti, niente import.meta.glob
**Contro**: Niente ottimizzazione immagini Astro

```astro
<!-- Uso diretto nel template -->
<img src={item.image} alt={item.title} />
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
