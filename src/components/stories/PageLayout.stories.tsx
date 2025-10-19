import type { Meta, StoryObj } from '@storybook/react';
import { ShoppingBasket, CalendarDays } from 'lucide-react';
import { PageLayout } from '../layout/PageLayout';
import { PageSection } from '../ui/PageSection';
import { Button } from '../ui/button';

const meta: Meta<typeof PageLayout> = {
  title: 'Layout/PageLayout',
  component: PageLayout,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof PageLayout>;

export const Default: Story = {
  render: () => (
    <PageLayout
      title="Mi Despensa"
      description="Gestiona tus ingredientes y favoritos desde un único lugar."
      icon={<ShoppingBasket className="h-6 w-6" />}
      actions={<Button size="sm">Añadir ítem</Button>}
    >
      <PageSection title="Resumen" description="Estado general de la semana">
        <div className="grid gap-section sm:grid-cols-2">
          <div className="rounded-xl border border-dashed border-muted/60 p-section text-sm text-muted-foreground">
            Contenido de ejemplo A
          </div>
          <div className="rounded-xl border border-dashed border-muted/60 p-section text-sm text-muted-foreground">
            Contenido de ejemplo B
          </div>
        </div>
      </PageSection>
      <PageSection
        title="Actividades recientes"
        description="Últimas acciones registradas en la lista"
        actions={
          <Button variant="outline" size="sm">
            Ver historial
          </Button>
        }
      >
        <ul className="space-y-section-sm text-sm text-muted-foreground">
          <li>Se añadió "Tomates" a la despensa hace 2 horas.</li>
          <li>Se marcó "Pasta" como agotado hace 5 horas.</li>
          <li>Se actualizó el plan semanal ayer.</li>
        </ul>
      </PageSection>
    </PageLayout>
  ),
};

export const FullWidth: Story = {
  render: () => (
    <PageLayout
      title="Planificación semanal"
      description="Visualiza las comidas del lunes al domingo."
      icon={<CalendarDays className="h-6 w-6" />}
      actions={
        <div className="flex gap-section-sm">
          <Button variant="outline" size="sm">
            Autocompletar
          </Button>
          <Button size="sm">Generar lista</Button>
        </div>
      }
      maxWidth="full"
    >
      <PageSection padded={false} className="overflow-hidden" contentClassName="p-0">
        <div className="grid gap-section-sm md:grid-cols-7">
          {[...Array(7)].map((_, index) => (
            <div
              key={index}
              className="rounded-xl border border-dashed border-muted/60 p-section text-sm text-muted-foreground"
            >
              Día {index + 1}
            </div>
          ))}
        </div>
      </PageSection>
    </PageLayout>
  ),
};
