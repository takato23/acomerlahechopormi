import { lazy } from 'react';

// Landing page components
export const LazyLandingComponents = {
  Hero: lazy(() => import('../components/sections/Hero')),
  HowItWorks: lazy(() => import('../components/sections/HowItWorks')),
  Benefits: lazy(() => import('../components/sections/Benefits')),
  AppPreview: lazy(() => import('../components/sections/AppPreview')),
  FAQ: lazy(() => import('../components/sections/FAQ')),
};

// Auth components
export const LazyAuth = {
  Login: lazy(() => import('../features/auth/Login')),
  Signup: lazy(() => import('../features/auth/Signup')),
};

// App feature components
export const LazyFeatures = {
  // Establecemos el tipo explícitamente para evitar errores de inferencia
  DashboardPage: lazy(() => import('../features/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage }))) as any,
  UserProfilePage: lazy(() => import('../features/user/UserProfilePage').then(m => ({ default: m.UserProfilePage }))) as any,
  PantryPage: lazy(() => import('../features/pantry/PantryPage').then(m => ({ default: m.PantryPage }))) as any,
  PlanningPage: lazy(() => import('../features/planning/PlanningPage').then(module => ({ default: module.default })).catch(error => {
    console.error('Error loading PlanningPage:', error);
    throw error;
  })),
  ShoppingListPage: lazy(() => import('../features/shopping-list/ShoppingListPage').then(m => ({ default: m.ShoppingListPage }))) as any,
  RecipeListPage: lazy(() => import('../features/recipes/pages/RecipeListPage').then(m => ({ default: m.RecipeListPage }))) as any,
  AddEditRecipePage: lazy(() => import('../features/recipes/pages/AddEditRecipePage')),
  RecipeDetailPage: lazy(() => import('../features/recipes/pages/RecipeDetailPage')),
  SimpleShoppingPage: lazy(() => import('../features/shopping-list/SimpleShoppingPage')),
};