import { supabase } from '@/lib/supabaseClient';
import { PlanningTemplate, SaveTemplateData, TemplateMeal } from './types';

/**
 * Obtiene todas las plantillas del usuario actual
 */
export const getPlanningTemplates = async (): Promise<PlanningTemplate[]> => {
  const { data: templates, error } = await supabase
    .from('planning_templates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error al obtener las plantillas:', error);
    throw new Error('No se pudieron obtener las plantillas');
  }

  return templates;
};

/**
 * Guarda una nueva plantilla de planificación
 */
export const savePlanningTemplate = async (templateData: SaveTemplateData): Promise<PlanningTemplate> => {
  // Convertir las comidas planificadas al formato de plantilla
  const templateMeals: TemplateMeal[] = templateData.meals.map(meal => ({
    day_index: new Date(meal.plan_date).getDay() - 1, // -1 porque getDay() retorna 0 para Domingo
    meal_type: meal.meal_type,
    recipe_id: meal.recipe_id,
    custom_meal_name: meal.custom_meal_name
  }));

  const { data: template, error } = await supabase
    .from('planning_templates')
    .insert([{
      name: templateData.name,
      template_data: { meals: templateMeals }
    }])
    .select()
    .single();

  if (error) {
    console.error('Error al guardar la plantilla:', error);
    throw new Error('No se pudo guardar la plantilla');
  }

  return template;
};

/**
 * Obtiene una plantilla específica por su ID
 */
export const loadPlanningTemplate = async (templateId: string): Promise<PlanningTemplate> => {
  const { data: template, error } = await supabase
    .from('planning_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (error) {
    console.error('Error al cargar la plantilla:', error);
    throw new Error('No se pudo cargar la plantilla');
  }

  return template;
};

/**
 * Elimina una plantilla específica
 */
export const deletePlanningTemplate = async (templateId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('planning_templates')
    .delete()
    .eq('id', templateId);

  if (error) {
    console.error('Error al eliminar la plantilla:', error);
    throw new Error('No se pudo eliminar la plantilla');
  }

  return true;
};