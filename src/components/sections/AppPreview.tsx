const AppPreview = () => {
  return (
    <section className="w-full py-16 md:py-24 lg:py-32 bg-muted overflow-hidden"> {/* Fondo gris claro y overflow hidden */}
      <div className="container px-4 md:px-6 text-center">
        <h2 className="text-3xl font-bold tracking-tighter mb-12 sm:text-4xl md:text-5xl text-foreground">
          Así se ve A Comerla
        </h2>
        <div className="relative mx-auto max-w-6xl">
          {/* Mockup de fondo (simula un dispositivo) */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/10 via-transparent to-transparent -rotate-3 scale-105 opacity-50 blur-lg" />

          {/* Contenido del Mockup (SVG Placeholder) */}
          <div className="relative rounded-xl shadow-2xl bg-card p-2">
            <svg viewBox="0 0 800 600" className="w-full h-auto rounded-lg bg-background">
              {/* Barra superior simulada */}
              <rect width="800" height="40" fill="hsl(var(--muted))" />
              <circle cx="30" cy="20" r="6" fill="hsl(var(--destructive))" />
              <circle cx="55" cy="20" r="6" fill="hsl(var(--primary))" />
              <circle cx="80" cy="20" r="6" fill="hsl(var(--secondary-foreground))" />

              {/* Contenido simulado */}
              <rect x="50" y="80" width="200" height="450" rx="8" fill="hsl(var(--muted))" />
              <rect x="280" y="80" width="470" height="200" rx="8" fill="hsl(var(--muted))" />
              <rect x="280" y="310" width="470" height="220" rx="8" fill="hsl(var(--muted))" />

              {/* Líneas de texto simuladas */}
              <rect x="60" y="95" width="180" height="10" rx="3" fill="hsl(var(--muted-foreground))" opacity="0.5" />
              <rect x="60" y="120" width="160" height="8" rx="3" fill="hsl(var(--muted-foreground))" opacity="0.3" />
              <rect x="60" y="135" width="170" height="8" rx="3" fill="hsl(var(--muted-foreground))" opacity="0.3" />
              {/* ... más líneas ... */}

              <rect x="290" y="95" width="450" height="10" rx="3" fill="hsl(var(--muted-foreground))" opacity="0.5" />
              <rect x="290" y="120" width="400" height="8" rx="3" fill="hsl(var(--muted-foreground))" opacity="0.3" />
              {/* ... más líneas ... */}
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppPreview;