import type { Recipe } from "@/types/recipeTypes";

// Datos mock para funcionar sin Supabase

export const MOCK_RECIPES: Recipe[] = [
  {
    id: '1',
    title: 'Tostadas con Aguacate',
    description: 'Desayuno rápido y nutritivo perfecto para empezar el día',
    prep_time_minutes: 5,
    cook_time_minutes: 3,
    servings: 1,
    image_url: null,
    is_favorite: false,
    instructions: [
      'Tostar el pan integral hasta que esté dorado',
      'Machacar el aguacate con un poco de sal y limón',
      'Untar el aguacate sobre el pan tostado',
      'Agregar un huevo pochado encima si deseas más proteína'
    ],
    main_ingredients: ['pan', 'aguacate'],
    tags: ['Desayuno', 'Rápido', 'Saludable', 'Vegetariano'],
    ingredients: [
      { id: 'ri-1-1', recipe_id: '1', ingredient_id: null, ingredient_name: 'Pan integral', quantity: 2, unit: 'rebanadas' , notes: 'Tostar al momento de servir'},
      { id: 'ri-1-2', recipe_id: '1', ingredient_id: null, ingredient_name: 'Aguacate', quantity: 1, unit: 'unidad' , notes: 'Machacar con sal y limón'},
      { id: 'ri-1-3', recipe_id: '1', ingredient_id: null, ingredient_name: 'Limón', quantity: 0.5, unit: 'unidad' , notes: 'Agregar solo el jugo'},
      { id: 'ri-1-4', recipe_id: '1', ingredient_id: null, ingredient_name: 'Sal', quantity: 1, unit: 'pizca' , notes: 'Ajustar a gusto'}
    ],
    user_id: 'mock-user-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    difficulty_level: 'simple',
    cuisine_type: ['mediterránea'],
    estimated_time: 8,
    nutritional_info: undefined,
    seasonal_flags: undefined,
    equipment_needed: ['Plato', 'Cuchillo'],
    cooking_methods: ['sin_cocción']
  },
  {
    id: '2',
    title: 'Ensalada César con Pollo',
    description: 'Ensalada fresca y completa con aderezo cremoso',
    prep_time_minutes: 15,
    cook_time_minutes: 10,
    servings: 2,
    image_url: null,
    is_favorite: false,
    instructions: [
      'Cocinar el pollo a la plancha con sal y pimienta',
      'Lavar y cortar la lechuga romana',
      'Preparar el aderezo mezclando mayonesa, ajo, limón y parmesano',
      'Mezclar todos los ingredientes y servir'
    ],
    main_ingredients: ['pollo', 'lechuga', 'parmesano'],
    tags: ['Ensalada', 'Proteína', 'Completa'],
    ingredients: [
      { id: 'ri-2-1', recipe_id: '2', ingredient_id: null, ingredient_name: 'Pechuga de pollo', quantity: 300, unit: 'g' , notes: 'Dorar hasta que quede jugoso'},
      { id: 'ri-2-2', recipe_id: '2', ingredient_id: null, ingredient_name: 'Lechuga romana', quantity: 1, unit: 'unidad' , notes: 'Secar bien antes de mezclar'},
      { id: 'ri-2-3', recipe_id: '2', ingredient_id: null, ingredient_name: 'Queso parmesano', quantity: 50, unit: 'g' , notes: 'Rallar fino'},
      { id: 'ri-2-4', recipe_id: '2', ingredient_id: null, ingredient_name: 'Pan tostado', quantity: 100, unit: 'g' , notes: 'Cortar en cubos pequeños'},
      { id: 'ri-2-5', recipe_id: '2', ingredient_id: null, ingredient_name: 'Mayonesa', quantity: 3, unit: 'cucharadas' , notes: 'Base del aderezo'},
      { id: 'ri-2-6', recipe_id: '2', ingredient_id: null, ingredient_name: 'Ajo', quantity: 1, unit: 'diente' , notes: 'Picar fino o prensar'},
      { id: 'ri-2-7', recipe_id: '2', ingredient_id: null, ingredient_name: 'Limón', quantity: 0.5, unit: 'unidad' , notes: 'Usar solo el jugo'}
    ],
    user_id: 'mock-user-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    difficulty_level: 'simple',
    cuisine_type: ['italiana'],
    estimated_time: 25,
    nutritional_info: undefined,
    seasonal_flags: undefined,
    equipment_needed: ['Bol', 'Cuchillo', 'Sartén'],
    cooking_methods: ['asar']
  },
  {
    id: '3',
    title: 'Pasta con Salsa de Tomate',
    description: 'Clásica pasta italiana con salsa casera',
    prep_time_minutes: 10,
    cook_time_minutes: 20,
    servings: 4,
    image_url: null,
    is_favorite: false,
    instructions: [
      'Cocinar la pasta en agua hirviendo con sal',
      'En una sartén, sofreír el ajo en aceite de oliva',
      'Agregar los tomates triturados y cocinar 15 minutos',
      'Mezclar la pasta con la salsa y servir con queso rallado'
    ],
    main_ingredients: ['pasta', 'tomate', 'ajo'],
    tags: ['Pasta', 'Italiana', 'Vegetariana'],
    ingredients: [
      { id: 'ri-3-1', recipe_id: '3', ingredient_id: null, ingredient_name: 'Pasta', quantity: 400, unit: 'g' , notes: 'Cocinar al dente'},
      { id: 'ri-3-2', recipe_id: '3', ingredient_id: null, ingredient_name: 'Tomates triturados', quantity: 800, unit: 'g' , notes: 'Reducir hasta espesar'},
      { id: 'ri-3-3', recipe_id: '3', ingredient_id: null, ingredient_name: 'Ajo', quantity: 2, unit: 'dientes' , notes: 'Sofreír sin dorar'},
      { id: 'ri-3-4', recipe_id: '3', ingredient_id: null, ingredient_name: 'Aceite de oliva', quantity: 3, unit: 'cucharadas' , notes: 'Usar extra virgen'},
      { id: 'ri-3-5', recipe_id: '3', ingredient_id: null, ingredient_name: 'Sal', quantity: 1, unit: 'pizca' , notes: 'Ajustar al final'},
      { id: 'ri-3-6', recipe_id: '3', ingredient_id: null, ingredient_name: 'Queso parmesano', quantity: 50, unit: 'g' , notes: 'Servir recién rallado'}
    ],
    user_id: 'mock-user-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    difficulty_level: 'simple',
    cuisine_type: ['italiana'],
    estimated_time: 30,
    nutritional_info: undefined,
    seasonal_flags: undefined,
    equipment_needed: ['Olla', 'Sartén', 'Colador'],
    cooking_methods: ['hervir', 'saltear']
  }
];

export const MOCK_PANTRY_ITEMS = [
  {
    id: '1',
    user_id: 'mock-user-id',
    ingredient_id: '1',
    quantity: 2,
    unit: 'kg',
    category_id: '1',
    expiry_date: null,
    notes: 'Comprado en el mercado local',
    is_favorite: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ingredient: {
      id: '1',
      name: 'Tomates',
      image_url: null
    },
    category: {
      id: '1',
      name: 'Verduras',
      color: '#22c55e',
      icon: '🥬',
      icon_name: 'Leaf',
      is_default: true,
      is_common: true,
      order: 1,
      user_id: null
    }
  },
  {
    id: '2',
    user_id: 'mock-user-id',
    ingredient_id: '2',
    quantity: 1,
    unit: 'kg',
    category_id: '2',
    expiry_date: null,
    notes: null,
    is_favorite: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ingredient: {
      id: '2',
      name: 'Cebollas',
      image_url: null
    },
    category: {
      id: '2',
      name: 'Verduras',
      color: '#22c55e',
      icon: '🥬',
      icon_name: 'Leaf',
      is_default: true,
      is_common: true,
      order: 1,
      user_id: null
    }
  },
  {
    id: '3',
    user_id: 'mock-user-id',
    ingredient_id: '3',
    quantity: 500,
    unit: 'g',
    category_id: '3',
    expiry_date: null,
    notes: 'Para cocinar',
    is_favorite: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ingredient: {
      id: '3',
      name: 'Arroz',
      image_url: null
    },
    category: {
      id: '3',
      name: 'Granos',
      color: '#eab308',
      icon: '🌾',
      icon_name: 'Wheat',
      is_default: true,
      is_common: true,
      order: 2,
      user_id: null
    }
  }
];

export const MOCK_SHOPPING_LIST_ITEMS = [
  {
    id: '1',
    name: 'Leche',
    quantity: 1,
    unit: 'l',
    is_purchased: false,
    user_id: 'mock-user-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Pan',
    quantity: 1,
    unit: 'barra',
    is_purchased: false,
    user_id: 'mock-user-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Huevos',
    quantity: 12,
    unit: 'unidad',
    is_purchased: true,
    user_id: 'mock-user-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const MOCK_PLANNED_MEALS = [
  {
    id: '1',
    user_id: 'mock-user-id',
    plan_date: new Date().toISOString().split('T')[0],
    meal_type: 'Desayuno',
    recipe_id: '1',
    notes: 'Desayuno rápido',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    recipes: MOCK_RECIPES[0]
  },
  {
    id: '2',
    user_id: 'mock-user-id',
    plan_date: new Date().toISOString().split('T')[0],
    meal_type: 'Almuerzo',
    recipe_id: '2',
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    recipes: MOCK_RECIPES[1]
  }
];
