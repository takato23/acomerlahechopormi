import { lazy } from 'react';

// Autenticación
export const Login = lazy(() => import('@/features/auth/components/Login'));
export const Register = lazy(() => import('@/features/auth/components/Register'));
export const ForgotPassword = lazy(() => import('@/features/auth/components/ForgotPassword'));
export const ResetPassword = lazy(() => import('@/features/auth/components/ResetPassword'));

// Planificador
export const Planning = lazy(() => import('@/features/planning/pages/PlanningPage'));
export const WeeklyPlanner = lazy(() => import('@/features/planning/components/WeeklyPlanner'));
export const PlannerCalendar = lazy(() => import('@/features/planning/components/PlannerCalendar'));

// Recetas
export const Recipes = lazy(() => import('@/features/recipes/pages/RecipesPage'));
export const RecipeDetails = lazy(() => import('@/features/recipes/components/RecipeDetails'));
export const RecipeForm = lazy(() => import('@/features/recipes/components/RecipeForm'));

// Despensa
export const Pantry = lazy(() => import('@/features/pantry/pages/PantryPage'));
export const PantryItemForm = lazy(() => import('@/features/pantry/components/PantryItemForm'));

// Lista de compras
export const ShoppingList = lazy(() => import('@/features/shopping-list/pages/ShoppingListPage'));

// Configuración
export const Settings = lazy(() => import('@/features/settings/pages/SettingsPage'));
export const Profile = lazy(() => import('@/features/user/pages/ProfilePage'));

// Dashboard
export const Dashboard = lazy(() => import('@/features/dashboard/pages/DashboardPage'));