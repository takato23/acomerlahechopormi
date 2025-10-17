import React from 'react';
import { ImmersiveWelcome } from '@/components/ui/ImmersiveExperience';

export function ImmersiveDemo() {
  const [currentTheme, setCurrentTheme] = React.useState<'cosmic' | 'ocean' | 'forest' | 'sunset' | 'aurora'>('cosmic');

  return (
    <ImmersiveWelcome
      title="Experiencia Ultra-Inmersiva"
      subtitle="Bienvenido al futuro del diseño web con efectos visuales de próxima generación"
      theme={currentTheme}
      actions={
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Selector de temas */}
          <div className="flex flex-wrap gap-2 justify-center">
            {(['cosmic', 'ocean', 'forest', 'sunset', 'aurora'] as const).map((theme) => (
              <button
                key={theme}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  currentTheme === theme
                    ? 'bg-primary text-primary-foreground shadow-glow'
                    : 'bg-card/80 backdrop-blur-glass text-muted-foreground hover:bg-card'
                }`}
                onClick={() => setCurrentTheme(theme)}
              >
                {theme.charAt(0).toUpperCase() + theme.slice(1)}
              </button>
            ))}
          </div>
        </div>
      }
    />
  );
}
