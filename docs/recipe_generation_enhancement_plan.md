# Plan de Mejora del Generador de Recetas: Sistema Híbrido

## Contexto y Objetivos

El sistema actual de generación de recetas presenta limitaciones en términos de calidad y relevancia de las sugerencias. Este plan define la implementación de un sistema híbrido que combina reglas estructuradas con LLM para mejorar significativamente la calidad de las recomendaciones.

## Fase 1: Modelado de Contexto Enriquecido

### 1. Modificaciones a la Base de Datos

#### 1.1 Preferencias de Usuario (`profile_preferences`)

```sql
CREATE TYPE complexity_level AS ENUM ('simple', 'medium', 'complex');
CREATE TYPE meal_type AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');

ALTER TABLE public.profiles
ADD COLUMN cuisine_preferences TEXT[] DEFAULT '{}',
ADD COLUMN disliked_ingredients TEXT[] DEFAULT '{}',
ADD COLUMN complexity_preference complexity_level DEFAULT 'medium',
ADD COLUMN preferred_meal_times JSONB DEFAULT '{}',
ADD COLUMN dietary_restrictions TEXT[] DEFAULT '{}';

COMMENT ON COLUMN profiles.cuisine_preferences IS 'Tipos de cocina preferidos por el usuario';
COMMENT ON COLUMN profiles.disliked_ingredients IS 'Ingredientes que el usuario prefiere evitar';
COMMENT ON COLUMN profiles.complexity_preference IS 'Nivel de complejidad preferido para las recetas';
COMMENT ON COLUMN profiles.preferred_meal_times IS 'Horarios preferidos para cada tipo de comida';
COMMENT ON COLUMN profiles.dietary_restrictions IS 'Restricciones dietéticas (ej: sin gluten, vegano)';
```

#### 1.2 Historial de Recetas (`recipe_history`)

```sql
CREATE TABLE public.recipe_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    recipe_id UUID REFERENCES recipes(id),
    planned_date TIMESTAMP WITH TIME ZONE,
    meal_type meal_type,
    was_cooked BOOLEAN DEFAULT false,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    CONSTRAINT valid_rating CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5))
);

CREATE INDEX idx_recipe_history_user_date ON recipe_history(user_id, planned_date);
```

#### 1.3 Métricas de Variedad (`variety_metrics`)

```sql
CREATE TYPE metric_type AS ENUM ('protein_rotation', 'cuisine_variety', 'cooking_method');

CREATE TABLE public.variety_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    metric_type metric_type,
    last_used JSONB,
    frequency_count JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    UNIQUE(user_id, metric_type)
);

CREATE INDEX idx_variety_metrics_user ON variety_metrics(user_id);
```

#### 1.4 Expansión de Recetas

```sql
ALTER TABLE public.recipes
ADD COLUMN cooking_methods TEXT[] DEFAULT '{}',
ADD COLUMN difficulty_level complexity_level DEFAULT 'medium',
ADD COLUMN cuisine_type TEXT[] DEFAULT '{}';

CREATE INDEX idx_recipes_difficulty ON recipes(difficulty_level);
CREATE INDEX idx_recipes_cuisine_gin ON recipes USING GIN (cuisine_type);
```

### 2. Modificaciones al Código

#### 2.1 Nuevos Tipos TypeScript

```typescript
// src/types/userPreferences.ts
export interface UserPreferences {
  cuisinePreferences: string[];
  dislikedIngredients: string[];
  complexityPreference: 'simple' | 'medium' | 'complex';
  preferredMealTimes: {
    breakfast?: string;
    lunch?: string;
    dinner?: string;
    snack?: string;
  };
  dietaryRestrictions: string[];
}

// src/types/recipeHistory.ts
export interface RecipeHistoryEntry {
  id: string;
  userId: string;
  recipeId: string;
  plannedDate: Date;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  wasCooked: boolean;
  rating?: number;
  notes?: string;
}

// src/types/varietyMetrics.ts
export interface VarietyMetric {
  id: string;
  userId: string;
  metricType: 'protein_rotation' | 'cuisine_variety' | 'cooking_method';
  lastUsed: Record<string, string>; // { itemId: timestamp }
  frequencyCount: Record<string, number>; // { itemId: count }
}
```

#### 2.2 Servicios Requeridos

1. **PreferencesService**: Gestión de preferencias de usuario
2. **RecipeHistoryService**: Registro y consulta de historial
3. **VarietyMetricsService**: Cálculo y actualización de métricas
4. **RecipeFilterService**: Aplicación de filtros basados en contexto

### 3. Plan de Implementación

1. **Sprint 1: Fundación (Semana 1)**
   - Ejecutar migraciones de base de datos
   - Implementar tipos TypeScript
   - Crear servicios base con operaciones CRUD

2. **Sprint 2: UI para Preferencias (Semana 2)**
   - Desarrollar interfaz de preferencias de usuario
   - Implementar selección de cocinas favoritas
   - Añadir gestión de ingredientes no deseados

3. **Sprint 3: Sistema de Historial (Semana 2-3)**
   - Implementar registro automático de planes
   - Añadir UI para feedback/rating
   - Desarrollar visualización de historial

4. **Sprint 4: Motor de Variedad (Semana 3-4)**
   - Implementar cálculo de métricas
   - Crear lógica de rotación
   - Integrar con generación de recetas

### 4. Impacto en Generación de Recetas

El nuevo flujo de generación:

```mermaid
graph TD
    A[Solicitud de Plan] --> B{Recolectar Contexto}
    B --> C[Preferencias Usuario]
    B --> D[Estado Despensa]
    B --> E[Historial Recetas]
    B --> F[Métricas Variedad]
    
    C & D & E & F --> G[Motor de Filtrado]
    G --> H[LLM: Generación/Adaptación]
    H --> I[Validación Final]
    I --> J[Guardar Plan]
    J --> K[Actualizar Métricas]
</mermaid>

### 5. KPIs y Métricas de Éxito

1. **Calidad de Recomendaciones**
   - % de recetas aceptadas sin modificación
   - Puntuación promedio de recetas
   - Tasa de recetas efectivamente cocinadas

2. **Variedad**
   - Índice de repetición de ingredientes principales
   - Diversidad de tipos de cocina por semana
   - Rotación de métodos de cocción

3. **Satisfacción de Usuario**
   - Tiempo promedio para generar plan semanal
   - Tasa de modificación manual de planes
   - NPS de la funcionalidad

### 6. Riesgos y Mitigaciones

1. **Complejidad de Datos**
   - Riesgo: Inconsistencia en preferencias/métricas
   - Mitigación: Validación estricta, valores por defecto seguros

2. **Rendimiento**
   - Riesgo: Cálculos de métricas costosos
   - Mitigación: Caching, actualización incremental

3. **Experiencia de Usuario**
   - Riesgo: Sobrecarga de opciones
   - Mitigación: UI progresiva, valores predeterminados inteligentes

### 7. Próximos Pasos

1. Revisar y aprobar esquema de base de datos
2. Configurar ambiente de desarrollo
3. Comenzar con Sprint 1 (Fundación)

## Aprobaciones Requeridas

- [ ] Esquema de Base de Datos
- [ ] Plan de Implementación
- [ ] Diseño de UI
- [ ] Plan de Pruebas