# Auditoría de Integración – Planificador Semanal

## 1. Diagrama de Arquitectura Actual

```mermaid
graph TD
    Perfil((Perfil Usuario))
    Recetas((Recetas))
    Despensa((Despensa))
    Compras((Lista de Compras))
    Planificador((Planificador Semanal))
    IA((IA Sugerencias))

    Perfil -- solo consulta --> Planificador
    Recetas -- consulta y selección --> Planificador
    Planificador -- consulta --> Recetas
    Planificador -- consulta --> Perfil
    Planificador -- manual --> Compras
    Planificador -- manual --> Despensa
    Planificador -- manual --> IA
    IA -- sugerencias --> Planificador
    Despensa -- sin integración --> Planificador
    Compras -- sin integración --> Planificador
```

## 2. Diagrama de Arquitectura Propuesta (Holística)

```mermaid
graph TD
    StoreCentral((Store Central / Event Bus))
    Perfil((Perfil Usuario))
    Recetas((Recetas))
    Despensa((Despensa))
    Compras((Lista de Compras))
    Planificador((Planificador Semanal))
    IA((IA Sugerencias))

    Perfil -- actualiza y escucha --> StoreCentral
    Recetas -- actualiza y escucha --> StoreCentral
    Despensa -- actualiza y escucha --> StoreCentral
    Compras -- actualiza y escucha --> StoreCentral
    Planificador -- actualiza y escucha --> StoreCentral
    IA -- consulta/actualiza --> StoreCentral
    StoreCentral -- sincroniza --> Perfil
    StoreCentral -- sincroniza --> Recetas
    StoreCentral -- sincroniza --> Despensa
    StoreCentral -- sincroniza --> Compras
    StoreCentral -- sincroniza --> Planificador
    StoreCentral -- sincroniza --> IA
```

---

## 3. Flujo de Planificación Holística (Ejemplo)

```mermaid
sequenceDiagram
    participant U as Usuario
    participant P as Planificador
    participant S as StoreCentral
    participant I as IA
    participant D as Despensa
    participant C as Compras
    participant R as Recetas
    participant F as Perfil

    U->>P: Elige "Planificar semana"
    P->>S: Solicita estado actual (perfil, recetas, despensa)
    S->>F: Obtiene perfil
    S->>R: Obtiene recetas
    S->>D: Obtiene despensa
    P->>I: Solicita menú semanal (con perfil y despensa)
    I->>P: Devuelve menú sugerido
    P->>S: Actualiza planificación semanal
    S->>C: Agrega ingredientes faltantes a compras
    S->>D: Reserva ingredientes usados
    U->>P: Ajusta menú (opcional)
    P->>S: Actualiza cambios
    S->>C: Actualiza compras
    S->>D: Actualiza despensa
```

---

## 4. Prompt tipo para IA (Gemini API gratuita)

```text
Eres un asistente culinario inteligente. El usuario tiene el siguiente perfil:
- Dieta: {dieta}
- Restricciones: {restricciones}
- Electrodomésticos: {electrodomesticos}
- Preferencias: {preferencias}

Su despensa contiene: {ingredientes_despensa}

Sugiere un menú semanal para los siguientes días y horarios:
{dias_y_horarios}

Ten en cuenta:
- No repitas platos a menos que el usuario lo prefiera.
- Solo sugiere recetas que pueda preparar con sus electrodomésticos.
- Explica brevemente por qué sugieres cada receta.
- Si falta algún ingrediente, indícalo.

Formato de respuesta:
Día - Horario: Receta sugerida (explicación breve, ingredientes faltantes si aplica)
```

---

## 5. Resumen visual de integración

- Todos los módulos se sincronizan y reaccionan a cambios a través del store/event bus central.
- La IA utiliza siempre el perfil y la despensa actual.
- El usuario puede ajustar y la app se adapta en tiempo real.

---

**¿Quieres que agregue ejemplos de respuestas de la IA o diagramas de flujos alternativos según el modo (manual vs. autopiloto)?**
