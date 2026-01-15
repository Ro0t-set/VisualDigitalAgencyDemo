// Helper per importare immagini ottimizzate da src/assets/
// Astro ottimizza solo le immagini importate da src/assets/

// Import tutte le immagini dalla cartella gallery
const galleryImages = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/images/gallery/**/*.{png,jpg,jpeg,webp,svg}',
  { eager: true }
);

// Import tutte le immagini dalla cartella uploads (logo, play-button, etc.)
const uploadImages = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/images/uploads/**/*.{png,jpg,jpeg,webp,svg}',
  { eager: true }
);

// Combina tutti gli import
const allImages = { ...galleryImages, ...uploadImages };

/**
 * Ottiene l'immagine ottimizzata dato il path Keystatic
 * @param keystaticPath - Il path salvato da Keystatic (es. "/src/assets/images/gallery/1.png")
 * @returns L'oggetto ImageMetadata per il componente Image di Astro
 */
export function getImage(keystaticPath: string | null | undefined): ImageMetadata | null {
  if (!keystaticPath) return null;

  const image = allImages[keystaticPath];
  return image?.default ?? null;
}

/**
 * Verifica se un path è un SVG (non necessita ottimizzazione)
 */
export function isSvg(path: string | null | undefined): boolean {
  return path?.toLowerCase().endsWith('.svg') ?? false;
}
