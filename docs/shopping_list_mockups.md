# Mockups: Nueva Interfaz Lista de Compras

## 1. Vista Desktop (>1200px)

```
+-------------------------------------------------------------------------+
|                           HEADER / NAV                                   |
+----------------+---------------------------+----------------------------+-+
|  BÚSQUEDA     |      LISTA COMPRAS       |           MAPA            | |
|  =========    |      =============        |          =====            | |
|               |                           |                           | |
| [Input Search]| + Añadir Item            |     [Maps Controls]       | |
| [🔍]         | [________________] [Add]  |     [📍Mi Ubicación]     | |
|               |                           |                           | |
|  Quick Add:   | Items Pendientes (3)      |                           | |
| [Leche] [Pan] | ⚪ Leche 1L              |      [Google Maps]        | |
| [Huevos]     | ⚪ Pan                    |                           | |
|               | ⚪ Huevos x12            |      Con markers de       | |
| Resultados:   |                           |      supermercados       | |
| ┌──────────┐  | Items Comprados (2)       |                           | |
| │ Leche    │  | ⚫ Café                  |      y rutas             | |
| │ $500     │  | ⚫ Azúcar               |                           | |
| │ Tienda A │  |                           |                           | |
| └──────────┘  |                           |                           | |
|               |                           |                           | |
| ┌──────────┐  |                           | [Panel Info Tienda]       | |
| │ Leche    │  |                           | ┌─────────────────┐       | |
| │ $520     │  |                           | │ Tienda A        │       | |
| │ Tienda B │  |                           | │ 📍 A 500m      │       | |
| └──────────┘  |                           | │ ⭐ Favorita    │       | |
|               |                           | └─────────────────┘       | |
+----------------+---------------------------+---------------------------+-+
```

## 2. Vista Tablet (768px - 1199px)

```
+--------------------------------------------------------+
|                      HEADER / NAV                        |
+--------------------------------------------------------+
|  [Search Bar]  [🔍]        [📍]  [Filtros Tiendas]    |
+------------------------+-------------------------------+
|    LISTA + BÚSQUEDA   |             MAPA            |
|    ===============    |            ====            |
| Quick Add:            |                            |
| [Leche][Pan][Huevos] |                            |
|                       |                            |
| + Añadir Item        |         [Google Maps]      |
| [_______________]     |                            |
|                       |          markers +         |
| Pendientes (3)        |          info panel       |
| ⚪ Leche 1L          |                            |
| ⚪ Pan               |                            |
| ⚪ Huevos           |                            |
|                       |                            |
| Comprados (2)         |     [Bottom Sheet Info]    |
| ⚫ Café             |     cuando selecciona      |
| ⚫ Azúcar           |        una tienda          |
+------------------------+-------------------------------+
```

## 3. Vista Móvil (<768px)

Vista Principal:
```
+----------------------------------+
|           HEADER / NAV           |
+----------------------------------+
|  [Search Bar]     [📍] [Filter] |
+----------------------------------+
| Quick Add:                       |
| [Leche] [Pan] [Huevos]          |
|                                  |
| + Añadir Item                    |
| [_________________]              |
|                                  |
| Pendientes (3)                   |
| ⚪ Leche 1L                     |
| ⚪ Pan                          |
| ⚪ Huevos                       |
|                                  |
| Comprados (2)                    |
| ⚫ Café                        |
| ⚫ Azúcar                      |
+----------------------------------+
|     [Ver Mapa] (Expandible)      |
+----------------------------------+
```

Bottom Sheet Mapa (expandido):
```
+----------------------------------+
|     ========= ^ ==========       |
|                                  |
|           [Google Maps]          |
|                                  |
|      [Panel Info Tienda]         |
|      cuando selecciona           |
|                                  |
|   [Botones Acción Tienda]       |
|   [⭐] [🗺️] [💰]              |
+----------------------------------+
```

## 4. Detalles de Interacción

### 4.1 Panel de Búsqueda
- Input con autocompletado
- Resultados muestran:
  * Nombre producto
  * Precio
  * Tienda
  * Distancia a usuario
  * Tag si está en tienda favorita

### 4.2 Quick Add
- Botones con items frecuentes
- Scrolleable horizontalmente en móvil
- Muestra máximo 6 en desktop
- Badge con precio más bajo encontrado

### 4.3 Lista de Compras
- Swipe actions en móvil:
  * Izquierda: Marcar/Desmarcar
  * Derecha: Eliminar
- Hover actions en desktop:
  * Checkbox
  * Buscar precios
  * Eliminar
- Drag & Drop para reordenar

### 4.4 Mapa
- Controles:
  * Mi ubicación
  * Filtrar tiendas
  * Toggle tiendas favoritas
- Markers:
  * Color por cadena
  * Tamaño según relevancia
  * Badge si tiene ofertas
- Info Window:
  * Nombre tienda
  * Dirección
  * Distancia
  * Horario
  * Productos encontrados
  * Botón "Como llegar"

## 5. Estados Especiales

### 5.1 Cargando
```
+------------------+
|   ⏳ Cargando   |
|    datos...     |
+------------------+
```

### 5.2 Error
```
+------------------+
|    ❌ Error     |
| [Reintentar 🔄] |
+------------------+
```

### 5.3 Sin Resultados
```
+------------------+
|   🔍 No hay     |
|   resultados    |
+------------------+
```

## 6. Tema y Colores

- Fondo: Background neutro
- Cards: Blanco/Oscuro según tema
- Acentos:
  * Primary: Acciones principales
  * Success: Items completados
  * Warning: Ofertas/Destacados
  * Error: Alertas/Eliminar

## 7. Iconografía

- 🔍 Buscar
- 📍 Ubicación
- ⭐ Favorito
- 🗺️ Cómo llegar
- 💰 Ver precios
- ✅ Completado
- ❌ Eliminar
- ⏳ Cargando
- 🔄 Reintentar