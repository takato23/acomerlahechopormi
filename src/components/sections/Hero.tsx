import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

// Función helper para scroll suave (duplicada aquí por simplicidad, idealmente iría en utils)
const scrollToSection = (id: string) => {
  const section = document.getElementById(id.substring(1)); // Quita el '#'
  section?.scrollIntoView({ behavior: 'smooth' });
};

const Hero = () => {
  return (
    <div className="relative isolate">
      {/* Fondo con gradiente */}
      <div className="absolute inset-x-0 top-0 -z-10 h-[500px] bg-gradient-to-b from-muted/50 via-muted/20 to-background/0" />

      <div className="container mx-auto px-4 py-24 sm:py-32">
        <div className="grid grid-cols-1 gap-8 lg:gap-16 items-center">
          {/* Contenido textual */}
          <div className="max-w-3xl mx-auto text-center lg:col-span-2">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl text-foreground">
              ¿Qué comemos{" "}
              <span className="text-primary">hoy</span>?
            </h1>
            <p className="mt-6 text-lg md:text-xl lg:text-2xl text-muted-foreground">
              Deja que 'A Comerla' use inteligencia artificial para sugerirte recetas deliciosas según lo que tienes en la nevera y tu presupuesto.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              {/* Quitar asChild, usar onClick */}
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground transition-transform duration-200 hover:scale-105" // Añadir efecto hover
                onClick={() => scrollToSection('#footer')}
              >
                Probar gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="transition-transform duration-200 hover:scale-105" // Añadir efecto hover
                onClick={() => scrollToSection('#preview')}
              >
                Ver demo
              </Button>
            </div>

            <dl className="mt-16 grid grid-cols-2 gap-8 sm:grid-cols-4 text-center">
              {[
                ["1000+", "Recetas"],
                ["IA", "Sugerencias"],
                ["0€", "Para Empezar"],
                ["24/7", "Disponible"],
              ].map(([stat, label]) => (
                <div key={label}>
                  <dt className="text-base text-muted-foreground">{label}</dt>
                  <dd className="text-2xl font-bold tracking-tight text-foreground">{stat}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Imagen/Ilustración - Comentada temporalmente
          <div className="lg:ml-auto">
            <div className="relative mx-auto w-full max-w-xl lg:max-w-none aspect-square rounded-2xl bg-muted/30 p-4">
              <div className="h-full w-full rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent flex items-center justify-center text-primary/40">
                <span className="text-lg">Imagen Placeholder</span>
              </div>
            </div>
          </div>
           */}
        </div>
      </div>
    </div>
  );
};

export default Hero;