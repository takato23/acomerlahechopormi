/*
 * Lightweight image provider for generated recipes.
 * Intenta obtener una imagen representativa usando Pexels o Unsplash
 * y cae en una fuente libre cuando no hay claves configuradas.
 */

type Provider = 'pexels' | 'unsplash' | 'unsplash-source';

const providerCache = new Map<string, string | null>();

// Función para obtener variables de entorno que funciona tanto en desarrollo como en producción
const getEnvVar = (key: string): string | undefined => {
  // En Vite, las variables de entorno se reemplazan en build time
  // En desarrollo/testing, usamos process.env
  const env = typeof process !== 'undefined' && process.env ? process.env : {};
  return env[key];
};

const PEXELS_API_KEY = getEnvVar('VITE_PEXELS_API_KEY');
const UNSPLASH_ACCESS_KEY = getEnvVar('VITE_UNSPLASH_ACCESS_KEY');

const hasFetchSupport = () => typeof fetch === 'function';

const requestPexelsImage = async (query: string): Promise<string | null> => {
  if (!PEXELS_API_KEY || !hasFetchSupport()) return null;

  try {
    const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`, {
      headers: {
        Authorization: PEXELS_API_KEY,
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      photos?: Array<{ src?: { original?: string; large?: string; medium?: string; small?: string } }>;
    };

    const photo = data.photos?.[0];
    return photo?.src?.medium ?? photo?.src?.large ?? photo?.src?.original ?? null;
  } catch (error) {
    console.warn('[recipeImageProvider] Error consultando Pexels', error);
    return null;
  }
};

const requestUnsplashImage = async (query: string): Promise<string | null> => {
  if (!UNSPLASH_ACCESS_KEY || !hasFetchSupport()) return null;

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=landscape&per_page=1&content_filter=high`,
      {
        headers: {
          Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      },
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      results?: Array<{ urls?: { regular?: string; small?: string; full?: string } }>;
    };

    const photo = data.results?.[0];
    return photo?.urls?.regular ?? photo?.urls?.small ?? photo?.urls?.full ?? null;
  } catch (error) {
    console.warn('[recipeImageProvider] Error consultando Unsplash API', error);
    return null;
  }
};

const requestUnsplashSourceImage = async (query: string): Promise<string | null> => {
  if (!hasFetchSupport()) return null;

  const url = `https://source.unsplash.com/featured/800x600/?food,${encodeURIComponent(query)}`;

  try {
    const response = await fetch(url, {
      redirect: 'follow',
      mode: 'cors',
    });

    if (!response.ok) {
      return null;
    }

    return response.url;
  } catch (error) {
    console.warn('[recipeImageProvider] Error consultando Unsplash fuente pública', error);
    return null;
  }
};

const providerSequence: Array<{ provider: Provider; handler: (query: string) => Promise<string | null> }> = [
  { provider: 'pexels', handler: requestPexelsImage },
  { provider: 'unsplash', handler: requestUnsplashImage },
  { provider: 'unsplash-source', handler: requestUnsplashSourceImage },
];

const buildQueries = (title: string, ingredients?: string[]): string[] => {
  const normalizedTitle = title.trim();
  const ingredientQuery = ingredients?.filter(Boolean).slice(0, 3).join(' ');

  const queries = [normalizedTitle];

  if (ingredientQuery && ingredientQuery.length > 0) {
    queries.push(`${normalizedTitle} ${ingredientQuery}`.trim());
    queries.push(ingredientQuery);
  }

  queries.push('receta casera saludable');

  return Array.from(new Set(queries.filter((query) => query && query.length > 0)));
};

export interface RecipeImageDescriptor {
  title: string;
  ingredients?: string[];
}

export const getRecipeImageUrl = async ({ title, ingredients }: RecipeImageDescriptor): Promise<string | null> => {
  if (!title || !hasFetchSupport()) {
    return null;
  }

  const candidateQueries = buildQueries(title, ingredients);

  for (const query of candidateQueries) {
    const cacheKey = query.toLowerCase();
    if (providerCache.has(cacheKey)) {
      const cached = providerCache.get(cacheKey);
      return cached ?? null;
    }

    // Ejecutar proveedores en paralelo por query hasta encontrar uno válido
    for (const { handler } of providerSequence) {
      // eslint-disable-next-line no-await-in-loop
      const url = await handler(query);
      if (url) {
        providerCache.set(cacheKey, url);
        return url;
      }
    }

    providerCache.set(cacheKey, null);
  }

  return null;
};

export const recipeImageProvider = {
  getImageUrl: getRecipeImageUrl,
};
