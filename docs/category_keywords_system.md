# Sistema de Auto-categorización: Palabras Clave

## 1. Estructura del Sistema

### 1.1 Diccionario Base
```typescript
interface CategoryKeywords {
  [categoryId: string]: {
    exactMatch: string[];      // Coincidencia exacta
    partialMatch: string[];    // Coincidencia parcial
    fuzzyMatch: string[];      // Coincidencia aproximada
    priority: number;          // Prioridad en caso de múltiples matches
  }
}
```

## 2. Palabras Clave por Categoría

### 2.1 Verduras y Frutas
```json
{
  "exactMatch": [
    "manzana", "banana", "tomate", "lechuga", "zanahoria",
    "cebolla", "papa", "pera", "naranja", "limón"
  ],
  "partialMatch": [
    "fruta", "verdura", "hortaliza", "vegetal"
  ],
  "fuzzyMatch": [
    "verde", "fresco", "orgánico"
  ],
  "priority": 1
}
```

### 2.2 Lácteos
```json
{
  "exactMatch": [
    "leche", "yogur", "queso", "manteca", "crema",
    "ricota", "yogurt", "dulce de leche"
  ],
  "partialMatch": [
    "lácteo", "descremado", "light"
  ],
  "fuzzyMatch": [
    "sachet", "untable"
  ],
  "priority": 2
}
```

### 2.3 Carnes
```json
{
  "exactMatch": [
    "carne", "pollo", "pescado", "cerdo", "bife",
    "milanesa", "hamburguesa", "chorizo", "jamón"
  ],
  "partialMatch": [
    "pechuga", "molida", "cortada"
  ],
  "fuzzyMatch": [
    "fresco", "kg"
  ],
  "priority": 3
}
```

### 2.4 Limpieza
```json
{
  "exactMatch": [
    "detergente", "jabón", "lavandina", "desodorante",
    "papel higiénico", "esponja", "trapo"
  ],
  "partialMatch": [
    "limpia", "limpiador", "desinfectante"
  ],
  "fuzzyMatch": [
    "anti", "aroma"
  ],
  "priority": 4
}
```

### 2.5 Bebidas
```json
{
  "exactMatch": [
    "agua", "gaseosa", "cerveza", "vino", "jugo",
    "coca", "sprite", "fanta"
  ],
  "partialMatch": [
    "bebida", "refresco", "botella"
  ],
  "fuzzyMatch": [
    "lt", "litro", "ml"
  ],
  "priority": 5
}
```

## 3. Algoritmo de Matching

### 3.1 Proceso de Coincidencia
1. **Normalización**
   ```typescript
   function normalizeText(text: string): string {
     return text.toLowerCase()
               .normalize('NFD')
               .replace(/[\u0300-\u036f]/g, '')
               .trim();
   }
   ```

2. **Orden de Verificación**
   - Exacto → Parcial → Fuzzy
   - Prioridad por categoría en caso de múltiples matches

3. **Puntaje de Coincidencia**
   ```typescript
   interface MatchScore {
     categoryId: string;
     score: number;  // 0-100
     matchType: 'exact' | 'partial' | 'fuzzy';
   }
   ```

### 3.2 Reglas de Puntuación
- Coincidencia Exacta: 100 puntos
- Coincidencia Parcial: 60-90 puntos (según longitud)
- Coincidencia Fuzzy: 30-50 puntos (según similitud)
- Ajuste por prioridad de categoría

## 4. Preparación para ML

### 4.1 Recolección de Datos
- Registro de categorizaciones manuales
- Feedback de correcciones de usuario
- Patrones de compra frecuentes

### 4.2 Estructura de Entrenamiento
```typescript
interface TrainingData {
  input: string;        // Nombre del item
  category: string;     // Categoría asignada
  confidence: number;   // Confianza (0-1)
  wasCorrect: boolean;  // Feedback del usuario
  timestamp: string;    // Fecha de categorización
}
```

## 5. Integración con UI

### 5.1 Sugerencias en Tiempo Real
```typescript
interface CategorySuggestion {
  categoryId: string;
  confidence: number;
  source: 'keywords' | 'ml' | 'history';
  alternatives: Array<{
    categoryId: string;
    confidence: number;
  }>;
}
```

### 5.2 Feedback Loop
- Tracking de aceptación/rechazo de sugerencias
- Actualización de pesos de keywords
- Reentrenamiento periódico del modelo

## 6. Métricas de Rendimiento

### 6.1 Precisión
- % de sugerencias aceptadas
- % de sugerencias corregidas
- Tiempo hasta corrección

### 6.2 Performance
- Tiempo de respuesta < 100ms
- Uso de memoria < 1MB
- Cache hit ratio > 90%

### 6.3 Cobertura
- % de items con sugerencia
- % de categorías utilizadas
- Distribución de confidence scores