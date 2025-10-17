import type { OnboardingStepDefinition } from './types';

export const onboardingSteps: OnboardingStepDefinition[] = [
  {
    id: 'primaryGoal',
    title: 'Tu objetivo principal',
    description: 'Cuéntanos qué quieres lograr para adaptar la experiencia.'
  },
  {
    id: 'dietaryPreferences',
    title: 'Preferencias y restricciones',
    description: 'Selecciona tus preferencias alimentarias, alergias y evita ingredientes no deseados.'
  },
  {
    id: 'habits',
    title: 'Tus hábitos diarios',
    description: 'Configura horarios estimados y complejidad preferida para las comidas.'
  },
  {
    id: 'initialInventory',
    title: 'Inventario inicial',
    description: 'Agrega los ingredientes que ya tienes para personalizar las primeras sugerencias.'
  },
  {
    id: 'quantObjectives',
    title: 'Metas cuantitativas',
    description: 'Define calorías objetivo, presupuesto y tamaño del hogar.'
  },
  {
    id: 'confirmation',
    title: 'Resumen y lanzamiento',
    description: 'Revisa tus datos, confirma y genera tu primer plan semanal.'
  }
];

export const onboardingCopy = {
  ctaNext: 'Continuar',
  ctaBack: 'Atrás',
  ctaFinish: 'Generar primera semana',
  primaryGoalHelper: 'Selecciona una opción para personalizar recomendaciones, puedes modificarlo más adelante.',
  dietaryHelper: 'Añade múltiples entradas separadas por enter o coma. Usa esta lista para guiar sugerencias de recetas.',
  habitsHelper: 'Usamos estos horarios y tiempos para ajustar recordatorios y dificultad de recetas.',
  inventoryHelper: 'Los ingredientes añadidos aquí se fusionarán con tu despensa actual.',
  quantHelper: 'Usamos estos datos para equilibrar calorías y presupuesto semanal.',
  confirmHelper: 'Al confirmar, guardaremos tu perfil, generaremos un plan semanal y la lista de compras automática.'
};
