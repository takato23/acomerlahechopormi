import type { Meta, StoryObj } from '@storybook/react';
import { Layers, Settings } from 'lucide-react';
import { PageSection } from '../ui/PageSection';
import { Button } from '../ui/button';

const meta: Meta<typeof PageSection> = {
  title: 'Layout/PageSection',
  component: PageSection,
  args: {
    children: <div className="text-sm text-muted-foreground">Contenido de ejemplo</div>,
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof PageSection>;

export const Default: Story = {
  args: {
    title: 'Sección informativa',
    description: 'Agrupa información relacionada dentro de un contenedor con borde.',
    icon: <Layers className="h-5 w-5" />,
    actions: <Button size="sm">Acción principal</Button>,
  },
};

export const Compact: Story = {
  args: {
    padded: false,
    title: 'Encabezado compacto',
    icon: <Settings className="h-5 w-5" />,
    actions: (
      <div className="flex gap-section-sm">
        <Button variant="outline" size="sm">Cancelar</Button>
        <Button size="sm">Guardar</Button>
      </div>
    ),
    contentClassName: 'p-section',
    children: (
      <div className="rounded-lg border border-dashed border-muted/60 p-section-sm text-sm text-muted-foreground">
        Este modo resulta útil cuando un componente hijo controla el espaciado interno.
      </div>
    ),
  },
};

export const WithoutHeader: Story = {
  args: {
    children: (
      <div className="space-y-section-sm text-sm text-muted-foreground">
        <p>No se proporciona título, por lo que el contenedor actúa como bloque neutro.</p>
        <p>Ideal para agrupar controles secundarios o tablas responsivas.</p>
      </div>
    ),
  },
};
