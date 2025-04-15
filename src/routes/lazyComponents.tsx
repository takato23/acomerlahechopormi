import { lazy } from 'react';

export const LazyLandingComponents = {
  Hero: lazy(() => import('@/features/landing/Hero')),
  HowItWorks: lazy(() => import('@/features/landing/HowItWorks')),
  Benefits: lazy(() => import('@/features/landing/Benefits')),
  AppPreview: lazy(() => import('@/features/landing/AppPreview')),
  FAQ: lazy(() => import('@/features/landing/FAQ'))
};

export const LazyAuth = {
  Login: lazy(() => import('@/features/auth/Login')),
  Register: lazy(() => import('@/features/auth/Register')),
  ForgotPassword: lazy(() => import('@/features/auth/ForgotPassword')),
  ResetPassword: lazy(() => import('@/features/auth/ResetPassword'))
};

export const LazyFeatures = {
  Dashboard: lazy(() => import('@/features/dashboard/DashboardPage')),
  PlanningPage: lazy(() => import('@/features/planning/PlanningPage')),
  PantryPage: lazy(() => import('@/features/pantry/PantryPage')),
  ShoppingListPage: lazy(() => import('@/features/shopping-list/ShoppingListPage')),
  SimpleShoppingPage: lazy(() => import('@/features/shopping-list/SimpleShoppingPage')),
  RecipeListPage: lazy(() => import('@/features/recipes/pages/RecipeListPage')),
  AddEditRecipePage: lazy(() => import('@/features/recipes/pages/AddEditRecipePage')),
  RecipeDetailPage: lazy(() => import('@/features/recipes/pages/RecipeDetailPage')),
  ImportRecipePage: lazy(() => import('@/features/recipes/pages/ImportRecipePage'))
};