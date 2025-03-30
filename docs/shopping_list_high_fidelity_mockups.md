# Prototipos de Alta Fidelidad: Lista de Compras

## 1. Vista Desktop (>1200px)

### 1.1 Layout Principal
```
┌──────────────────────────────────────────────────────────────┐
│ 🔍 Barra de Búsqueda Global                            👤 🔔 │
├──────────────┬─────────────────────┬───────────────────────┤
│   BÚSQUEDA   │    LISTA COMPRAS    │         MAPA          │
│   ========   │    ============     │        =====         │
│              │                     │                       │
│ 🔍 Buscar    │ ➕ Añadir Item      │   [Controles Mapa]    │
│ [________]   │ [_______________]   │   📍 Mi Ubicación     │
│              │                     │   🏪 Ver Tiendas      │
│ Filtros:     │ Items (3)           │                       │
│ ☐ Ofertas    │ ⭕️ Leche 1L         │      [Google Maps]    │
│ ☐ Favoritos  │   $500 - Tienda A   │                       │
│ ☐ Cercanos   │ ⭕️ Pan              │      Con markers:     │
│              │   $200 - Tienda B   │      🔵 Regular       │
│ Resultados:  │ ⭕️ Huevos           │      🟡 Oferta        │
│ ┌──────────┐ │   $450 - Tienda A   │      ⭐️ Favorito      │
│ │ Leche    │ │                     │                       │
│ │ $500     │ │ Comprados (2)       │   [Info Tienda]      │
│ │ Tienda A │ │ ⚫️ Café             │   ┌─────────────┐     │
│ │ 📍 500m  │ │ ⚫️ Azúcar           │   │ Tienda A    │     │
│ └──────────┘ │                     │   │ 📍 500m     │     │
│              │                     │   │ ⭐️ Favorita │     │
│ ┌──────────┐ │ [Stats]            │   │ ⏰ Abierto   │     │
│ │ Leche    │ │ Total: $1150       │   └─────────────┘     │
│ │ $520     │ │ Ahorro: $100       │                       │
│ │ Tienda B │ │                     │                       │
│ │ 📍 1.2km │ │                     │                       │
│ └──────────┘ │                     │                       │
└──────────────┴─────────────────────┴───────────────────────┘
```

### 1.2 Panel de Búsqueda (Expandido)
```
┌─────────────────────┐
│ 🔍 Buscar Productos │
│ [________________] │
│                     │
│ Sugerencias:        │
│ • Leche 🔥          │
│ • Pan reciente      │
│ • Huevos frecuente  │
│                     │
│ Filtros Activos:    │
│ 🏷️ Ofertas          │
│ 📍 < 1km            │
│ ⭐️ Favoritos        │
└─────────────────────┘
```

### 1.3 Info Window del Mapa
```
┌─────────────────────────┐
│ 🏪 Supermercado A      │
│ 📍 Av. Example 123     │
│ ⏰ Abierto hasta 22:00 │
│                         │
│ Productos encontrados:  │
│ • Leche 1L   $500 💰   │
│ • Huevos     $450      │
│                         │
│ ⭐️ Marcar Favorito     │
│ 🗺️ Cómo llegar         │
└─────────────────────────┘
```

## 2. Vista Tablet (768px - 1199px)

### 2.1 Layout Principal
```
┌────────────────────────────────────────┐
│ 🔍 [Búsqueda] 📍 [Mi Ubicación]  👤   │
├────────────────────┬─────────────────┤
│   LISTA + BÚSQUEDA │      MAPA       │
│   ===============  │     =====      │
│                    │                 │
│ Quick Add:         │   [GoogleMaps]  │
│ [🥛][🍞][🥚]      │                 │
│                    │    Con markers   │
│ + Nuevo Item       │    y clusters   │
│ [_____________]    │                 │
│                    │    [Bottom      │
│ Items (3)          │     Sheet]      │
│ ⭕️ Leche          │                 │
│ ⭕️ Pan            │                 │
│ ⭕️ Huevos         │                 │
└────────────────────┴─────────────────┘
```

### 2.2 Bottom Sheet (Expandido)
```
┌────────────────────────────────────────┐
│ ═══════════ ^ ═══════════              │
│                                        │
│ 🏪 Supermercado A                      │
│ 📍 500m | ⭐️ Favorito | ⏰ Abierto     │
│                                        │
│ Productos en tu lista:                 │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐│
│ │ Leche 1L │ │ Pan      │ │ Huevos   ││
│ │ $500     │ │ $200     │ │ $450     ││
│ └──────────┘ └──────────┘ └──────────┘│
│                                        │
│ 🗺️ Cómo llegar | 📱 Llamar | 💾 Guardar│
└────────────────────────────────────────┘
```

## 3. Vista Móvil (<768px)

### 3.1 Vista Principal
```
┌───────────────────┐
│ 🔍 [Búsqueda]    │
│                   │
│ Quick Add:        │
│ [🥛][🍞][🥚]     │
│                   │
│ + Nuevo Item      │
│ [_____________]   │
│                   │
│ Items (3)         │
│ ⭕️ Leche         │
│   $500 Tienda A   │
│ ⭕️ Pan           │
│   $200 Tienda B   │
│ ⭕️ Huevos        │
│   $450 Tienda A   │
│                   │
│ [Ver Mapa ▲]     │
└───────────────────┘
```

### 3.2 Mapa Expandido
```
┌───────────────────┐
│ ═════ ▼ ═════    │
│                   │
│    [GoogleMaps]   │
│                   │
│  [Marcador Info]  │
│  ┌─────────────┐  │
│  │ Tienda A    │  │
│  │ 📍 500m     │  │
│  │ ⭐️ Favorita │  │
│  └─────────────┘  │
│                   │
│ [Acciones Rápidas]│
│ ⭐️ │ 🗺️ │ 📱 │ ℹ️ │
└───────────────────┘
```

## 4. Componentes y Estados

### 4.1 Item de Lista
```
Normal:
┌─────────────────────────────┐
│ ⭕️ Leche 1L                │
│    $500 - Tienda A (500m)   │
└─────────────────────────────┘

Seleccionado:
┌─────────────────────────────┐
│ 🔵 Leche 1L                │
│    $500 - Tienda A (500m)   │
│    [Ver en Mapa] [Comprar]  │
└─────────────────────────────┘

Comprado:
┌─────────────────────────────┐
│ ✅ Leche 1L                │
│    $500 - Tienda A          │
└─────────────────────────────┘
```

### 4.2 Marcador en Mapa
```
Normal:      🔵
Oferta:      🟡
Favorito:    ⭐️
Seleccionado: 🎯
```

### 4.3 Estados de Carga
```
Loading:
┌─────────────┐
│   ⏳        │
│ Cargando... │
└─────────────┘

Error:
┌─────────────┐
│    ❌       │
│   Error     │
│ [Reintentar]│
└─────────────┘

Sin Resultados:
┌─────────────┐
│    🔍       │
│ No hallado  │
└─────────────┘
```

## 5. Interacciones y Gestos

### 5.1 Mobile Gestos
```
← Swipe Izquierda: Marcar/Desmarcar
→ Swipe Derecha:   Eliminar
↑ Pull Up:         Expandir Mapa
↓ Pull Down:       Contraer Mapa
```

### 5.2 Desktop Hover
```
Ítem Lista:
┌─────────────────────┐
│ Item               │
│ [✓][🗑️][🔍][⭐️]   │
└─────────────────────┘

Marcador Mapa:
┌─────────────────────┐
│ Tienda A           │
│ 3 productos        │
│ Min: $200          │
└─────────────────────┘
```

## 6. Tema Oscuro

### 6.1 Paleta de Colores
```
Fondo:    #121212
Card:     #1E1E1E
Texto:    #FFFFFF
Primario: #BB86FC
Error:    #CF6679
```

### 6.2 Preview
```
┌──────────────────────┐
│ 🌙 Modo Oscuro      │
│                      │
│ [Card Oscura]        │
│  Contenido...        │
│                      │
│ [Mapa Nocturno]     │
│  Markers...          │
└──────────────────────┘
```

## 7. Animaciones

### 7.1 Transiciones
```
Lista ↔ Mapa:
┌────┐    ┌────┐
│List│ ↔  │Map │
└────┘    └────┘
   Slide/Fade

Bottom Sheet:
    ┌────┐
    │Info│  ↕ Slide Up/Down
┌───┴────┴───┐
│   Content   │
└────────────┘
```

### 7.2 Micro-interacciones
```
Checkbox: ⭕️ → ✓ (bounce)
Favorito: ☆ → ⭐️ (pulse)
Loading:  ⏳ (rotate)
```

Los prototipos muestran la interfaz con un alto nivel de detalle, incluyendo:
- Estados de componentes
- Interacciones y gestos
- Animaciones y transiciones
- Temas claro/oscuro
- Responsividad
- Micro-interacciones

Cada vista está optimizada para su resolución objetivo mientras mantiene consistencia en la experiencia de usuario.