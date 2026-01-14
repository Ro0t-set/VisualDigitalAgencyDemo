# Sito Vetrina - Template Astro

Template sito vetrina moderno e minimale con Astro e Tailwind CSS. Perfetto per freelancer che vogliono creare siti web per clienti in modo rapido.

## Caratteristiche

- **Astro** - Framework web veloce e moderno
- **Tailwind CSS** - Styling utility-first
- **Mobile-first** - Design responsive
- **SEO Ready** - Meta tags dinamici e sitemap automatica
- **Form Contatti** - Integrazione con Formspree
- **Performance** - Target 100/100 PageSpeed
- **Zero dipendenze CMS** - Contenuti in JSON editabili

## Struttura Pagine

- **Homepage** - Hero, servizi in evidenza, CTA
- **Chi Siamo** - Storia, valori, team
- **Servizi** - Lista servizi
- **Contatti** - Form + info contatto

## Quick Start

### 1. Usa questo template

```bash
gh repo create nome-cliente --template TUO_USERNAME/sito-vetrina-template --private --clone
cd nome-cliente
npm install
```

### 2. Avvia il server di sviluppo

```bash
npm run dev
```

Il sito sarà disponibile su `http://localhost:4321`

### 3. Personalizza i contenuti

Modifica i file in `content/`:

- `content/settings/global.json` - Nome azienda, colori, contatti, social
- `content/pages/*.json` - Contenuti delle pagine
- `content/services/*.json` - Lista servizi

## Personalizzazione Rapida (15 min)

1. **Impostazioni globali** (`content/settings/global.json`):
   - `companyName` - Nome azienda
   - `tagline` - Slogan
   - `colors` - Colori brand (primary, secondary, accent)
   - `contact` - Email, telefono, indirizzo
   - `social` - Link social media
   - `form.formspreeId` - ID form Formspree

2. **Homepage** (`content/pages/home.json`):
   - Hero text e CTA
   - Sezioni features

3. **Servizi** (`content/services/*.json`):
   - Aggiungi/rimuovi file per aggiungere servizi
   - Ogni servizio ha: titolo, descrizione, icona, features

4. **Domain** (`astro.config.mjs`):
   - Cambia `site` con il dominio di produzione

## Form Contatti

Il form usa Formspree per la gestione delle email:

1. Registrati su [formspree.io](https://formspree.io)
2. Crea un nuovo form
3. Copia l'ID del form (es. `xyzabcde`)
4. Aggiorna `content/settings/global.json`:

```json
{
  "form": {
    "formspreeId": "xyzabcde"
  }
}
```

## Icone Disponibili

Per i servizi e le features puoi usare queste icone:

- `rocket` - Razzo
- `lightbulb` - Lampadina
- `chart` - Grafico
- `shield` - Scudo
- `cog` - Ingranaggio
- `users` - Utenti
- `code` - Codice
- `globe` - Globo

## Build e Deploy

### Build per produzione

```bash
npm run build
```

I file statici saranno generati in `dist/`.

### Deploy su qualsiasi hosting

Carica il contenuto di `dist/` su:
- Vercel
- Netlify
- GitHub Pages
- Qualsiasi hosting statico
- Il tuo server

## Struttura Progetto

```
├── content/
│   ├── pages/          # Contenuti pagine (JSON)
│   ├── services/       # Lista servizi (JSON)
│   └── settings/       # Configurazioni globali
├── public/
│   ├── uploads/        # Immagini
│   └── favicon.svg
├── src/
│   ├── components/     # Componenti riutilizzabili
│   ├── layouts/        # Layout base
│   ├── pages/          # Pagine Astro
│   └── styles/         # CSS globale
├── astro.config.mjs
└── package.json
```

## Aggiungere Nuovi Servizi

1. Crea un nuovo file in `content/services/nome-servizio.json`:

```json
{
  "title": "Nome Servizio",
  "shortDescription": "Breve descrizione",
  "icon": "rocket",
  "features": [
    {"feature": "Feature 1"},
    {"feature": "Feature 2"}
  ],
  "order": 1,
  "featured": true
}
```

2. Importa il servizio in `src/pages/index.astro` e `src/pages/servizi.astro`

## Aggiungere Nuove Pagine

1. Crea il file contenuto in `content/pages/nuova-pagina.json`
2. Crea la pagina Astro in `src/pages/nuova-pagina.astro`
3. Aggiungi il link nel menu in `src/components/Header.astro`

## Licenza

MIT
