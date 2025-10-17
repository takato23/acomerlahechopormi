import { v4 as uuidv4 } from 'uuid';
import type { VisionIngredientInsight, VisionActionRecommendation } from '@/types/vision';
import { buildFallbackInsight } from './normalizer';

export interface PantrySnapshotItem {
  name: string;
  quantityLabel?: string;
  unit?: string;
  freshness?: 'fresh' | 'stale' | 'unknown';
}

export interface PlannerContextSnapshot {
  upcomingMeals?: string[];
  activeMissions?: string[];
  householdSize?: number;
  primaryGoal?: string | null;
}

export interface FallbackEngineParams {
  hash: string;
  fileName: string;
  pantryItems?: PantrySnapshotItem[];
  plannerContext?: PlannerContextSnapshot;
  reason: string;
  errorMessage?: string;
  now?: string;
}

const DEFAULT_KEYWORD_MAP: Record<string, string> = {
  pollo: 'Pollo',
  chicken: 'Pollo',
  manzana: 'Manzana',
  apple: 'Manzana',
  banana: 'Banana',
  platano: 'Banana',
  zanahoria: 'Zanahoria',
  carrot: 'Zanahoria',
  lenteja: 'Lentejas',
  lentejas: 'Lentejas',
  arroz: 'Arroz',
  rice: 'Arroz',
  pasta: 'Pasta',
  tomate: 'Tomate',
  tomato: 'Tomate',
  ensalada: 'Verduras de ensalada',
  salad: 'Verduras de ensalada',
  sopa: 'Ingredientes para sopa',
  soup: 'Ingredientes para sopa',
};

const tokenizeFileName = (fileName: string): string[] => {
  return fileName
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .split(/[^a-záéíóúüñ0-9]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3);
};

const matchPantryItems = (tokens: string[], pantryItems: PantrySnapshotItem[] = []): VisionIngredientInsight[] => {
  const normalizedTokens = new Set(tokens.map((token) => token.normalize('NFD').replace(/[^a-z0-9]/gi, '')));

  return pantryItems
    .map((item) => {
      const normalizedName = item.name.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/gi, '');
      if (!normalizedTokens.has(normalizedName) && !tokens.some((token) => normalizedName.includes(token))) {
        return null;
      }

      return {
        name: item.name,
        confidence: 0.7,
        quantityLabel: item.quantityLabel,
        unit: item.unit,
        freshness: item.freshness ?? 'unknown',
        pantryMatchId: normalizedName,
      } satisfies VisionIngredientInsight;
    })
    .filter(Boolean) as VisionIngredientInsight[];
};

const buildKeywordIngredients = (tokens: string[]): VisionIngredientInsight[] => {
  const matchedNames = tokens
    .map((token) => DEFAULT_KEYWORD_MAP[token])
    .filter((name): name is string => Boolean(name));

  const seen = new Set<string>();
  return matchedNames
    .filter((name) => {
      if (seen.has(name)) return false;
      seen.add(name);
      return true;
    })
    .map((name) => ({
      name,
      confidence: 0.45,
    } satisfies VisionIngredientInsight));
};

const buildActionRecommendations = (
  ingredients: VisionIngredientInsight[],
  plannerContext?: PlannerContextSnapshot,
): VisionActionRecommendation[] => {
  if (!ingredients.length) {
    return [
      {
        id: uuidv4(),
        type: 'add_to_pantry',
        label: 'Registrar manualmente ingredientes detectados',
        description: 'No se pudieron identificar ingredientes con certeza. Revisa la imagen y añade los productos necesarios.',
        confidence: 0.3,
      },
    ];
  }

  const primaryIngredient = ingredients[0];
  const actions: VisionActionRecommendation[] = [
    {
      id: uuidv4(),
      type: 'plan_meal',
      label: `Planificar comida con ${primaryIngredient.name}`,
      description: plannerContext?.upcomingMeals?.length
        ? `Sugerido para ${plannerContext.upcomingMeals[0]}`
        : 'Crea una comida rápida usando este ingrediente principal.',
      confidence: 0.55,
      suggestedMealType: plannerContext?.upcomingMeals?.length ? undefined : 'Cena',
    },
    {
      id: uuidv4(),
      type: 'add_to_pantry',
      label: `Verifica stock de ${primaryIngredient.name}`,
      description: 'Confirma cantidades y estado en la despensa.',
      confidence: 0.5,
    },
  ];

  if (plannerContext?.activeMissions?.length) {
    actions.push({
      id: uuidv4(),
      type: 'create_mission',
      label: `Vincular a misión "${plannerContext.activeMissions[0]}"`,
      description: 'Añade esta imagen como evidencia rápida en la misión en curso.',
      confidence: 0.4,
    });
  }

  if (plannerContext?.householdSize && plannerContext.householdSize >= 4) {
    actions.push({
      id: uuidv4(),
      type: 'batch_cook',
      label: 'Preparar batch cooking',
      description: 'Prepárate para cocinar en cantidad y ahorrar tiempo esta semana.',
      confidence: 0.35,
    });
  }

  return actions;
};

export const buildFallbackVisionInsight = ({
  hash,
  fileName,
  pantryItems,
  plannerContext,
  reason,
  errorMessage,
  now,
}: FallbackEngineParams) => {
  const tokens = tokenizeFileName(fileName);
  const pantryIngredients = matchPantryItems(tokens, pantryItems);
  const keywordIngredients = buildKeywordIngredients(tokens);

  const combined = [...pantryIngredients];
  keywordIngredients.forEach((ingredient) => {
    if (!combined.some((item) => item.name === ingredient.name)) {
      combined.push(ingredient);
    }
  });

  if (!combined.length) {
    combined.push({
      name: 'Ingredientes sin identificar',
      confidence: 0.2,
    });
  }

  const summaryBase = combined
    .slice(0, 3)
    .map((item) => item.name)
    .join(', ');

  const summary = summaryBase
    ? `Sugerencia heurística basada en "${summaryBase}" detectado en el archivo.`
    : 'No se pudieron identificar ingredientes; revisa manualmente.';

  const actions = buildActionRecommendations(combined, plannerContext);

  return buildFallbackInsight({
    hash,
    summary,
    reason,
    ingredients: combined,
    actions,
    errorMessage,
    now,
  });
};
