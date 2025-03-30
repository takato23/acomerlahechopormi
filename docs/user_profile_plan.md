# Plan: Implementación Página de Perfil de Usuario (Paso 1)

Este documento detalla el plan incremental para implementar la página de perfil de usuario, comenzando con la estructura base y las preferencias alimenticias.

## Objetivos del Paso 1

*   Crear la estructura básica de archivos y componentes para la página de perfil.
*   Mostrar información básica del usuario (email).
*   Permitir al usuario ver y seleccionar su preferencia alimenticia (Omnívoro, Vegetariano, Vegano).
*   Persistir la preferencia alimenticia en Supabase.
*   Integrar la página en la navegación de la aplicación para usuarios autenticados.

## Plan Detallado

1.  **Crear Estructura de Archivos:**
    *   Crear directorio: `src/features/user/`
    *   Dentro de `src/features/user/`, crear:
        *   `UserProfilePage.tsx`: Componente principal que orquestará las sub-secciones.
        *   `components/`: Directorio para sub-componentes del perfil.
            *   `components/ProfileInfo.tsx`: Para mostrar email y datos básicos.
            *   `components/DietaryPreferences.tsx`: Para mostrar y editar preferencias alimenticias.
        *   `userService.ts`: Para interactuar con Supabase (obtener/actualizar perfil).
        *   `userTypes.ts`: Para definir tipos del perfil (incluyendo preferencias).

2.  **Definir Modelo de Datos (en `userTypes.ts` y Supabase):**
    *   Asegurar que la tabla de perfiles en Supabase (o crearla si no existe, usualmente llamada `profiles` y vinculada a `auth.users`) tenga una columna para `dietary_preference` (ej. tipo `text`). Considerar usar valores específicos como 'omnivore', 'vegetarian', 'vegan'.
    *   Definir la interfaz `UserProfile` en `userTypes.ts`:
      ```typescript
      export interface UserProfile {
        id: string; // Corresponds to auth.users.id
        email?: string; // Puede venir de auth.users
        username?: string | null; // Si se añade en el futuro
        dietary_preference?: 'omnivore' | 'vegetarian' | 'vegan' | null;
        // Otros campos futuros: budget, difficulty_preference, etc.
      }
      ```

3.  **Implementar `userService.ts`:**
    *   Importar `supabaseClient` desde `src/lib/supabaseClient.ts`.
    *   `async function getUserProfile(): Promise<UserProfile | null>`:
        *   Obtener el `user` actual de `supabase.auth.getUser()`.
        *   Si hay usuario, hacer un `select` a la tabla `profiles` filtrando por `id`.
        *   Devolver los datos del perfil o `null`.
        *   Manejar errores.
    *   `async function updateUserProfile(profileData: Partial<UserProfile>): Promise<boolean>`:
        *   Obtener el `user` actual.
        *   Si hay usuario, hacer un `update` a la tabla `profiles` con `profileData` donde el `id` coincida.
        *   Devolver `true` si fue exitoso, `false` en caso contrario.
        *   Manejar errores.

4.  **Implementar Componentes:**
    *   `ProfileInfo.tsx`:
        *   Recibir `email` como prop.
        *   Mostrar el email usando componentes de UI (ej. `Card`, `Label`).
    *   `DietaryPreferences.tsx`:
        *   Recibir `currentPreference` y `onUpdatePreference` como props.
        *   Usar un componente `<select>` (o `RadioGroup` de Shadcn/ui si está disponible) con las opciones ('Omnívoro', 'Vegetariano', 'Vegano') mapeadas a los valores ('omnivore', 'vegetarian', 'vegan').
        *   Mostrar la `currentPreference` seleccionada.
        *   Al cambiar la selección, llamar a `onUpdatePreference` con el nuevo valor.
        *   Manejar estado de carga/actualización si es necesario.
    *   `UserProfilePage.tsx`:
        *   Estado para `profileData: UserProfile | null`, `loading: boolean`, `error: string | null`.
        *   En `useEffect`, llamar a `getUserProfile` y actualizar el estado.
        *   Función `handleUpdatePreference` que llama a `userService.updateUserProfile` y actualiza el estado local si es exitoso.
        *   Renderizar `ProfileInfo` y `DietaryPreferences` pasando los datos y callbacks.
        *   Mostrar indicadores de carga o error.
        *   Usar `Card` u otros componentes de UI para el layout.

5.  **Añadir Ruta y Protección:**
    *   En el archivo de enrutamiento (probablemente `src/App.tsx` o similar):
        *   Importar `UserProfilePage`.
        *   Añadir una ruta como `<Route path="/profile" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />` (asumiendo que existe `ProtectedRoute`). Si no, implementar lógica de redirección si el usuario no está autenticado.

6.  **Añadir Enlace (Opcional):**
    *   En `src/components/sections/Navbar.tsx`:
        *   Obtener el estado de autenticación (ej. desde `AuthContext`).
        *   Si el usuario está autenticado, mostrar un `<Link to="/profile">Perfil</Link>`.

## Diagrama Mermaid (Flujo Paso 1)

```mermaid
graph TD
    subgraph UserProfilePage [/profile]
        direction LR
        A[Carga Datos (userService.getUserProfile)] --> B(Mostrar ProfileInfo);
        A --> C(Mostrar DietaryPreferences);
        C -- Editar --> D{Actualizar Preferencia};
        D --> E[userService.updateUserProfile];
        E --> A;
    end

    subgraph userService.ts
        direction TB
        F[getUserProfile] --> G[Supabase SELECT profiles];
        H[updateUserProfile] --> I[Supabase UPDATE profiles];
    end

    Navbar --> UserProfilePage;
    AuthContext --> UserProfilePage; // Para protección y datos básicos
    ProtectedRoute --> UserProfilePage; // Envuelve la ruta
```

## Próximos Pasos (Post-Implementación Paso 1)

*   Añadir campo para editar `username`.
*   Implementar secciones para presupuesto, dificultad de recetas, etc.
*   Integrar con scraping de gastos.
*   Integrar con seguimiento nutricional.