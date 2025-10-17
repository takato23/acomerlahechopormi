import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, PlayCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const DESCRIPTORS = [
  "colecciones editoriales",
  "experiencias de degustación",
  "operaciones gastronómicas",
  "activaciones omnicanal",
];

const HERO_METRICS = [
  { value: "12h", label: "mise en place ahorradas por semana", note: "Hipótesis pendiente de validación" },
  { value: "3x", label: "curadurías generadas por brief", note: "Hipótesis pendiente de validación" },
  { value: "92%", label: "retención clientes premium", note: "Hipótesis pendiente de validación" },
];

const scrollToSection = (id: string) => {
  const section = document.getElementById(id.substring(1));
  section?.scrollIntoView({ behavior: "smooth" });
};

const Hero = () => {
  const [descriptorIndex, setDescriptorIndex] = useState(0);
  const currentDescriptor = DESCRIPTORS[descriptorIndex];

  useEffect(() => {
    const interval = window.setInterval(() => {
      setDescriptorIndex((prev) => (prev + 1) % DESCRIPTORS.length);
    }, 3200);
    return () => window.clearInterval(interval);
  }, []);

  const gradientOverlay = useMemo(
    () => ({
      background:
        "linear-gradient(152deg, rgba(46,27,23,0.65) 0%, rgba(93,42,66,0.35) 58%, rgba(254,248,243,0.1) 100%)",
    }),
    []
  );

  return (
    <section id="hero" className="relative overflow-hidden bg-gradient-primary/40">
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute -left-24 top-12 h-64 w-64 rounded-full bg-studio-miel/30 blur-3xl"
          animate={{ y: [0, 30, -20], opacity: [0.45, 0.7, 0.45] }}
          transition={{ repeat: Infinity, duration: 14, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-[-5%] top-1/3 h-72 w-72 rounded-full bg-studio-salvia/30 blur-3xl"
          animate={{ y: [0, -40, 40], opacity: [0.6, 0.35, 0.6] }}
          transition={{ repeat: Infinity, duration: 18, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-16 px-4 py-24 sm:px-6 lg:flex-row lg:items-center lg:py-32">
        <div className="max-w-2xl space-y-8 text-pretty">
          <span className="inline-flex items-center gap-2 rounded-full border border-studio-neblina/60 bg-studio-crudo/60 px-4 py-2 text-sm font-medium text-studio-trufa shadow-sm backdrop-blur">
            Food studio-as-a-service
          </span>
          <h1 className="font-display text-4xl leading-[1.05] text-studio-trufa sm:text-5xl lg:text-6xl">
            Curamos{" "}
            <span className="relative inline-block text-transparent">
              <AnimatePresence mode="wait">
                <motion.span
                  key={currentDescriptor}
                  className="bg-gradient-to-r from-studio-paprika via-studio-miel to-studio-merlot bg-clip-text text-transparent"
                  initial={{ y: "100%", opacity: 0 }}
                  animate={{ y: "0%", opacity: 1 }}
                  exit={{ y: "-120%", opacity: 0 }}
                  transition={{ duration: 0.75, ease: "easeOut" }}
                >
                  {currentDescriptor}
                </motion.span>
              </AnimatePresence>
            </span>
            {" "}listas para cautivar a tus clientes.
          </h1>
          <p className="text-lg text-studio-trufa/80 sm:text-xl">
            A Comerla evoluciona a estudio gastronómico digital: diseño de colecciones, operación con IA y analítica accionable, todo en un solo SaaS.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              size="lg"
              variant="studio"
              onClick={() => scrollToSection("#demo")}
              className="min-w-[220px]"
            >
              Solicitar degustación guiada
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="glass"
              className="min-w-[220px] border-studio-neblina/70 text-studio-trufa hover:bg-studio-crudo/60"
              onClick={() => scrollToSection("#demo")}
            >
              Recorrer demo interactiva
              <PlayCircle className="h-5 w-5" />
            </Button>
          </div>
          <div className="grid gap-6 pt-6 sm:grid-cols-3">
            {HERO_METRICS.map((metric) => (
              <div key={metric.label} className="rounded-[18px] border border-studio-neblina/70 bg-studio-crudo/70 p-4 shadow-sm backdrop-blur">
                <div className="text-3xl font-semibold text-studio-merlot">{metric.value}</div>
                <p className="mt-2 text-sm font-medium text-studio-trufa/80">{metric.label}</p>
                <p className="mt-1 text-xs text-studio-trufa/60">{metric.note}</p>
              </div>
            ))}
          </div>
        </div>

        <motion.div
          className="relative w-full max-w-xl self-center rounded-[24px] shadow-[0_32px_90px_rgba(45,27,23,0.28)]"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.4 }}
        >
          <div className="relative overflow-hidden rounded-[24px] border border-studio-neblina/70 bg-studio-trufa/10">
            <img
              src="/branding/hero-chef-aurora.webp"
              alt="Chef Aurora Food Studio"
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0" style={gradientOverlay} />
            <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/20 bg-white/12 p-4 text-white backdrop-blur-xl">
              <span className="text-xs uppercase tracking-[0.2em] text-white/70">Chef Aurora Studio</span>
              <p className="mt-2 font-display text-xl leading-tight">
                Curaduría fotográfica + IA de operaciones para marcas gastronómicas premium.
              </p>
              <div className="mt-3 flex items-center justify-between text-sm text-white/80">
                <span>Set editorial otoño</span>
                <span>Hipótesis de impacto 3.2x</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
