import React from 'react';
import { EventBusDemo } from '../../example/EventBusDemo';

const DemoEventBusPage: React.FC = () => (
  <div style={{ padding: 40 }}>
    <h2>Demo: Event Bus Centralizado</h2>
    <EventBusDemo />
    <div style={{marginTop: 24, fontSize: 13, color: '#888'}}>
      Esta página es solo para pruebas del event bus. Puedes generar recetas demo y ver cómo otros módulos reaccionan automáticamente.<br/>
      Cuando termines de probar, puedes quitar esta ruta sin riesgo.
    </div>
  </div>
);

export default DemoEventBusPage;
