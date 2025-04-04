import { supabase } from '@/lib/supabaseClient';

// Tipos y estructuras de datos
interface KeywordInfo {
  categoryId: string;
  priority: number;
}

// Estado del sistema
const keywordCache = new Map<string, KeywordInfo[]>();
let keywordsLoaded = false;

/**
 * Carga las palabras clave desde la base de datos.
 */
async function loadKeywords(): Promise<void> {
  if (keywordsLoaded) {
    console.log('[categoryInference] Keywords already loaded');
    return;
  }

  console.log('[categoryInference] Starting to load keywords...');

  try {
    const { data, error } = await supabase
      .from('category_keywords')
      .select('keyword, category_id, priority');

    if (error) throw error;
    if (!data?.length) throw new Error('No keywords found');

    keywordCache.clear();

    for (const { keyword, category_id, priority } of data) {
      const normalizedKeyword = keyword.toLowerCase();
      const existing = keywordCache.get(normalizedKeyword) || [];
      existing.push({ categoryId: category_id, priority });
      keywordCache.set(normalizedKeyword, existing);
    }

    console.log('[categoryInference] Loaded keywords:', {
      total: keywordCache.size,
      examples: ['pollo', 'carne', 'pescado'].map(word => ({
        word,
        matches: keywordCache.get(word)?.map(m => m.categoryId)
      }))
    });

    keywordsLoaded = true;
  } catch (error) {
    console.error('[categoryInference] Failed to load keywords:', error);
    keywordCache.clear();
    keywordsLoaded = false;
    throw error;
  }
}

/**
 * Intenta inferir la categoría más apropiada para un ítem.
 */
export async function inferCategory(itemName: string): Promise<string | null> {
  if (!itemName?.trim()) return null;

  if (!keywordsLoaded) {
    await loadKeywords();
    if (!keywordsLoaded) return null;
  }

  const words = itemName.toLowerCase()
    .replace(/(es|s)$/, '')
    .split(/\s+/)
    .filter(Boolean);

  console.log('[categoryInference] Analyzing:', { original: itemName, words });

  const scores = new Map<string, { score: number; priority: number }>();

  // Calcular puntajes por categoría
  for (const word of words) {
    const matches = keywordCache.get(word);
    if (matches?.length) {
      console.log(`[categoryInference] Matches for "${word}":`, matches);
      for (const { categoryId, priority } of matches) {
        const current = scores.get(categoryId) || { score: 0, priority: -1 };
        current.score += priority + 1;
        current.priority = Math.max(current.priority, priority);
        scores.set(categoryId, current);
      }
    }
  }

  if (!scores.size) {
    console.log('[categoryInference] No matches found');
    return null;
  }

  // Encontrar la mejor categoría
  let bestCategory: string | null = null;
  let bestScore = 0;
  let bestPriority = -1;
  let hasTie = false;

  for (const [categoryId, { score, priority }] of scores) {
    if (score > bestScore || (score === bestScore && priority > bestPriority)) {
      bestCategory = categoryId;
      bestScore = score;
      bestPriority = priority;
      hasTie = false;
    } else if (score === bestScore && priority === bestPriority) {
      hasTie = true;
    }
  }

  if (!hasTie && bestCategory && bestScore >= 1) {
    console.log(`[categoryInference] Selected "${bestCategory}" (score: ${bestScore})`);
    return bestCategory;
  }

  console.log('[categoryInference] No clear winner');
  return null;
}

/**
 * Fuerza una recarga de las palabras clave.
 */
export async function reloadKeywords(): Promise<void> {
  keywordsLoaded = false;
  await loadKeywords();
}

/**
 * Inicializa el sistema de inferencia.
 */
export async function initializeCategories(): Promise<void> {
  try {
    await loadKeywords();
    if (!keywordsLoaded) throw new Error('Failed to initialize category system');
  } catch (error) {
    console.error('[categoryInference] Initialization failed:', error);
    throw error;
  }
}

// Inicialización automática
initializeCategories().catch(err => {
  console.error('[categoryInference] Background initialization failed:', err);
});
