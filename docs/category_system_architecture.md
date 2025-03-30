# Arquitectura del Sistema de Categorías

## Diagrama de Flujo
```mermaid
graph TB
    subgraph UI
        AF[Formulario Añadir Item] --> CS[Selector Categorías]
        LV[Vista Lista] --> CG[Grupos Categorías]
        CG --> CI[Items Categorizados]
        CM[Gestor Categorías] --> CD[DragDrop Categorías]
        CM --> CF[Form Nueva Categoría]
    end

    subgraph Logic
        CS --> CAT[CategoryStore]
        CG --> CAT
        CD --> CAT
        CF --> CAT
        CAT --> CS[CategoryService]
        CS --> DB[(Supabase DB)]
        
        subgraph AutoCat[Auto-Categorización]
            AT[TextAnalyzer]
            CS --> AT
            AT --> ML[ML Model]
            ML --> PS[PredictionService]
        end
    end

    subgraph Integration
        CAT --> RS[RecipeService]
        CAT --> PS[PantryService]
        CAT --> AS[AnalyticsService]
    end
```

## Estructura de Archivos

```
src/features/shopping-list/
├── components/
│   ├── categories/
│   │   ├── CategorySelector.tsx       # Selector de categorías
│   │   ├── CategoryGroup.tsx         # Grupo de items por categoría
│   │   ├── CategoryManager.tsx       # Modal gestión de categorías
│   │   ├── CategoryForm.tsx          # Formulario nueva categoría
│   │   ├── CategoryIcon.tsx          # Componente icono de categoría
│   │   └── CategoryDragList.tsx      # Lista ordenable de categorías
│   └── items/
│       ├── ItemCard.tsx              # Card de item con categoría
│       └── ItemList.tsx              # Lista de items categorizada
├── services/
│   ├── categoryService.ts            # CRUD categorías
│   ├── autoCategorizer.ts           # Auto-categorización
│   └── categoryAnalytics.ts         # Análisis y estadísticas
├── stores/
│   └── categoryStore.ts             # Estado global categorías
└── types/
    └── categoryTypes.ts             # Tipos y interfaces

src/lib/
└── ml/
    ├── textClassifier.ts            # Clasificador de texto
    └── models/
        └── category-predictor.json   # Modelo entrenado
```

## Flujos de Datos

### 1. Añadir Item con Categoría
```mermaid
sequenceDiagram
    Actor U as Usuario
    participant F as AddItemForm
    participant S as CategorySelector
    participant C as CategoryService
    participant DB as Supabase

    U->>F: Ingresa item
    F->>S: Abre selector
    S->>C: Obtiene categorías
    C->>DB: Query categorías
    DB-->>C: Lista categorías
    C-->>S: Muestra opciones
    U->>S: Selecciona categoría
    S->>F: Actualiza form
    F->>DB: Guarda item + categoría
```

### 2. Auto-categorización
```mermaid
sequenceDiagram
    participant F as AddItemForm
    participant A as AutoCategorizer
    participant M as MLModel
    participant C as CategoryService

    F->>A: Texto item
    A->>M: Analiza texto
    M-->>A: Predicción
    A->>C: Sugerencia categoría
    C-->>F: Actualiza categoría
```

## Estados y Store

```typescript
interface CategoryState {
  categories: Category[];
  userCategories: Category[];
  defaultCategories: Category[];
  selectedCategory: string | null;
  loading: boolean;
  error: string | null;
}

interface CategoryActions {
  addCategory: (category: NewCategory) => Promise<void>;
  updateCategory: (id: string, changes: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  reorderCategories: (orderedIds: string[]) => Promise<void>;
  predictCategory: (itemName: string) => Promise<string>;
  mergeDuplicates: () => Promise<void>;
}
```

## Integración con Otros Sistemas

### 1. Recetas
- Categorías compartidas entre recetas e items
- Sincronización bidireccional
- Sugerencias basadas en ingredientes

### 2. Despensa
- Categorías consistentes
- Auto-fill de categoría al añadir desde despensa
- Estadísticas cruzadas

### 3. Analytics
- Tracking de uso de categorías
- Análisis de patrones
- Reportes de eficiencia

## Cache y Offline

```typescript
interface CategoryCache {
  timestamp: number;
  categories: Category[];
  version: number;
}

interface OfflineQueue {
  actions: Array<{
    type: 'add' | 'update' | 'delete' | 'reorder';
    payload: any;
    timestamp: number;
  }>;
}
```

## Seguridad y Validación

```typescript
interface CategoryValidation {
  name: {
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9\s\-_]+$/
  },
  color: {
    pattern: /^#[0-9A-F]{6}$/i
  },
  icon: string[]; // Lista blanca de iconos permitidos
}
```

## Métricas de Rendimiento

- Tiempo de carga inicial: < 500ms
- Tiempo de categorización: < 100ms
- Memoria máxima: < 5MB
- Cache hit ratio: > 90%
- Precisión auto-categorización: > 85%