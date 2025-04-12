import {
  Home,
  UtensilsCrossed,
  Soup,
  Salad,
  Pizza,
  Cookie,
  Coffee,
  Croissant,
  ChefHat,
  Drumstick,
  Apple
} from 'lucide-react';
import React from 'react';
import { RecipeCategory } from '@/config/recipeTags';

/**
 * Definición de categorías y tags para las recetas
 */

// Utilidad para mapear íconos a categorías
export const getCategoryIcon = (categoryId: string): JSX.Element => {
  const iconProps = { className: "w-3.5 h-3.5" };
  switch (categoryId) {
    case 'all': return React.createElement(Home, iconProps);
    case 'main': return React.createElement(UtensilsCrossed, iconProps);
    case 'soup': return React.createElement(Soup, iconProps);
    case 'salad': return React.createElement(Salad, iconProps);
    case 'pasta': return React.createElement(Pizza, iconProps);
    case 'dessert': return React.createElement(Cookie, iconProps);
    case 'breakfast': return React.createElement(Coffee, iconProps);
    case 'appetizer': return React.createElement(ChefHat, iconProps);
    case 'sides': return React.createElement(Apple, iconProps);
    case 'snacks': return React.createElement(Drumstick, iconProps);
    default: return React.createElement(UtensilsCrossed, iconProps);
  }
};
export const RECIPE_CATEGORIES = [
  { id: 'all', name: 'Todas', type: 'special' },
  { id: 'main', name: 'Plato Principal', type: 'course' },
  { id: 'soup', name: 'Sopas', type: 'course' },
  { id: 'salad', name: 'Ensaladas', type: 'course' },
  { id: 'pasta', name: 'Pastas', type: 'course' },
  { id: 'dessert', name: 'Postres', type: 'course' },
  { id: 'breakfast', name: 'Desayunos', type: 'course' },
  { id: 'appetizer', name: 'Entradas', type: 'course' },
  { id: 'sides', name: 'Guarniciones', type: 'course' },
  { id: 'snacks', name: 'Bocadillos', type: 'course' }
];

// Tags adicionales para filtrado
export const RECIPE_TAGS = [
  'Rápido',
  'Fácil',
  'Saludable',
  'Vegetariano',
  'Vegano',
  'Sin Gluten',
  'Picante',
  'Tradicional'
];

// Mantener compatibilidad con código existente
export const PREDEFINED_RECIPE_TAGS: string[] = [
  ...RECIPE_CATEGORIES.map(c => c.name),
  ...RECIPE_TAGS
];

// Tipos para TypeScript
export type RecipeCategory = typeof RECIPE_CATEGORIES[number];
export type RecipeTag = typeof RECIPE_TAGS[number];

/**
 * Determines the category of a recipe based on its attributes or tags.
 * @param recipe - The recipe object containing title, ingredients, and tags.
 * @returns The normalized category ID.
 */
export function determineRecipeCategory(recipe: {
  title: string;
  ingredients: string[];
  tags: string[];
}): string {
  const lowerCaseTags = recipe.tags.map(tag => tag.toLowerCase());

  if (lowerCaseTags.includes('sopa') || lowerCaseTags.includes('caldo')) {
    return 'soup';
  }
  if (lowerCaseTags.includes('ensalada') || lowerCaseTags.includes('vegetariano')) {
    return 'salad';
  }
  if (lowerCaseTags.includes('pasta') || lowerCaseTags.includes('italiano')) {
    return 'pasta';
  }
  if (lowerCaseTags.includes('postre') || lowerCaseTags.includes('dulce')) {
    return 'dessert';
  }
  if (lowerCaseTags.includes('desayuno') || lowerCaseTags.includes('mañana')) {
    return 'breakfast';
  }
  if (lowerCaseTags.includes('entrada') || lowerCaseTags.includes('aperitivo')) {
    return 'appetizer';
  }
  if (lowerCaseTags.includes('guarnición') || lowerCaseTags.includes('acompañamiento')) {
    return 'sides';
  }
  if (lowerCaseTags.includes('bocadillo') || lowerCaseTags.includes('snack')) {
    return 'snacks';
  }

  // Default to 'main' if no specific category matches
  return 'main';
}