import { lazy } from 'react';

export const LazyFeatures = {
  DashboardPage: lazy(() => import('@/features/dashboard/DashboardPage')),
  UserProfilePage: lazy(() => import('@/features/user/UserProfilePage')),
  SimpleShoppingPage: lazy(() => import('@/features/shopping-list/SimpleShoppingPage')),
  ImportRecipePage: lazy(() => import('@/features/recipes/pages/ImportRecipePage')),
  PlanningPage: lazy(() => import('@/features/planning/PlanningPage')),
  PantryPage: lazy(() => import('@/features/pantry/PantryPage')),
  ShoppingListPage: lazy(() => import('@/features/shopping-list/ShoppingListPage')),
  RecipeListPage: lazy(() => import('@/features/recipes/pages/RecipeListPage')),
  AddEditRecipePage: lazy(() => import('@/features/recipes/pages/AddEditRecipePage')),
  RecipeDetailPage: lazy(() => import('@/features/recipes/pages/RecipeDetailPage'))
};

export const LazyLandingComponents = {};
export const LazyAuth = {
  Login: lazy(() => import('@/features/auth/Login')),
  Signup: lazy(() => import('@/features/auth/Signup')),
};