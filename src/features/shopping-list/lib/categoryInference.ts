import { supabase } from '@/lib/supabaseClient';

// Estructura para almacenar keywords en memoria (cache)
interface KeywordInfo {
  categoryId: string;
  priority: number;
}
const keywordCache = new Map<string, KeywordInfo[]>();
let keywordsLoaded = false;

/**
 * Carga las keywords desde Supabase y las almacena en caché.
 * Debería llamarse una vez al inicio o cuando se necesiten las keywords.
 */
async function loadKeywords(): Promise<void> {
  if (keywordsLoaded) return;

  console.debug('[categoryInference] Loading keywords from DB...');
  const { data, error } = await supabase
    .from('category_keywords')
    .select('keyword, category_id, priority');

  if (error) {
    console.error('Error loading keywords:', error);
    // Podríamos intentar recargar después de un tiempo o manejar el error
    return;
  }

  keywordCache.clear();
  for (const item of data) {
    const keyword = item.keyword.toLowerCase(); // Asegurar minúsculas
    const match: KeywordInfo = { categoryId: item.category_id, priority: item.priority };
    
    if (keywordCache.has(keyword)) {
      keywordCache.get(keyword)!.push(match);
    } else {
      keywordCache.set(keyword, [match]);
    }
  }
  keywordsLoaded = true;
  console.debug(`[categoryInference] Loaded ${keywordCache.size} unique keywords.`);
}

/**
 * Intenta inferir la categoría de un ítem basándose en su nombre y las keywords cacheadas.
 * @param itemName Nombre del ítem a categorizar.
 * @returns El ID de la categoría más probable o null si no se encuentra o hay empate.
 */
export async function inferCategory(itemName: string): Promise<string | null> {
  if (!itemName) return null;

  // Asegurarse de que las keywords estén cargadas (llamar una vez o usar un flag)
  if (!keywordsLoaded) {
    await loadKeywords();
    // Si aún no se cargaron (error), no podemos inferir
    if (!keywordsLoaded) return null; 
  }
// 1. Limpiar nombre: minúsculas, quitar acentos (opcional), quitar plurals simples (opcional)
const cleanedName = itemName.toLowerCase()
                         // .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Opcional: Quitar acentos
                         .replace(/(es|s)$/, ''); // Quitar 's' o 'es' final simple

  // 2. Tokenizar: Separar en palabras
  const words = cleanedName.split(/\s+/).filter(Boolean);

  // 3. Buscar coincidencias y calcular score por categoría
  const categoryScores = new Map<string, { score: number; maxPriority: number }>();

  for (const word of words) {
    const cacheEntry = keywordCache.get(word); // Usar get para verificar y obtener
    if (cacheEntry) {
      // const matches = keywordCache.get(word)!; // Ya no es necesario get de nuevo
      for (const match of cacheEntry) {
        const current = categoryScores.get(match.categoryId) || { score: 0, maxPriority: -1 };
        // Score: Suma de (prioridad + 1) por cada keyword coincidente
        current.score += (match.priority + 1); 
        // Guardar la prioridad más alta encontrada para esta categoría
        current.maxPriority = Math.max(current.maxPriority, match.priority); 
        categoryScores.set(match.categoryId, current);
      }
    }
  }

  // 4. Encontrar la(s) categoría(s) con el mayor score
  let bestCategoryId: string | null = null;
  let maxScore = 0;
  let maxPriorityInBest = -1;
  let tie = false;

  for (const [categoryId, scores] of categoryScores.entries()) {
    if (scores.score > maxScore) {
      maxScore = scores.score;
      bestCategoryId = categoryId;
      maxPriorityInBest = scores.maxPriority;
      tie = false;
    } else if (scores.score === maxScore && maxScore > 0) {
      // Empate de score: desempatar por prioridad máxima
      if (scores.maxPriority > maxPriorityInBest) {
        bestCategoryId = categoryId;
        maxPriorityInBest = scores.maxPriority;
        tie = false; // Se resolvió el empate
      } else if (scores.maxPriority === maxPriorityInBest) {
        tie = true; // Empate persiste
      }
    }
  }

  // 5. Devolver resultado
  const MIN_SCORE_THRESHOLD = 1; // Necesita al menos una keyword con prioridad 0 o más
  if (!tie && bestCategoryId && maxScore >= MIN_SCORE_THRESHOLD) {
    console.debug(`[categoryInference] Inferred category ${bestCategoryId} for "${itemName}" (Score: ${maxScore})`);
    return bestCategoryId;
  }

  console.debug(`[categoryInference] Could not infer category for "${itemName}" (Tie: ${tie}, Max Score: ${maxScore})`);
  return null; // No se encontró categoría o hubo empate irresoluble
}

// Opcional: Función para forzar la recarga de keywords si es necesario
export function reloadKeywords() {
  keywordsLoaded = false;
  return loadKeywords();
}

// Cargar keywords al inicio (puede moverse a un punto más adecuado en la app)
loadKeywords();