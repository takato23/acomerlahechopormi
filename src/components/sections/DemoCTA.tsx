import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles, Workflow } from "lucide-react";

interface DemoPlan {
  id: string;
  label: string;
  description: string;
  headline: string;
  hypothesis: string;
  focus: string[];
}

const demoPlans: DemoPlan[] = [
  {
    id: "studio",
    label: "Estudio gastronómico",
    description: "Ideal para estudios creativos que producen colecciones editoriales y experiencias pop-up.",
    headline: "Dashboard curado + shooting plan AI",
    hypothesis: "Hipótesis: ROI creativo medido en 72h",
    focus: ["Moodboard automatizado", "Checklist mise en place", "Medición degustaciones"],
  },
  {
    id: "hospitality",
    label: "Hospitality premium",
    description: "Pensado para hoteles boutique y restaurantes fine dining con múltiples locales.",
    headline: "Orquestación operativa multi-sede",
    hypothesis: "Hipótesis: -20% merma consolidada",
    focus: ["Plan de producción IA", "Mapa proveedores", "Alertas en vivo"],
  },
  {
    id: "retail",
    label: "Retail gourmet",
    description: "Para e-commerce y clubes gastronómicos que necesitan storytelling consistente.",
    headline: "Curaduría omnicanal + pauta",
    hypothesis: "Hipótesis: +18% ticket promedio",
    focus: ["Calendario campañas", "Content engine", "Eventos PostHog"],
  },
];

const DemoCTA = () => {
  const [selected, setSelected] = useState<DemoPlan>(demoPlans[0]);

  const previewData = useMemo(
    () => ({
      headline: selected.headline,
      checklist: selected.focus,
      hypothesis: selected.hypothesis,
    }),
    [selected]
  );

  return (
    <section id="demo" className="bg-studio-crudo/60 py-20 sm:py-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 sm:px-6 lg:flex-row">
        <div className="max-w-xl space-y-5">
          <Badge variant="secondary" className="border-studio-neblina/70 bg-studio-crudo/70 text-studio-trufa">
            Demo interactiva
          </Badge>
          <h2 className="font-display text-3xl text-studio-trufa sm:text-4xl">
            Prueba el flujo Food Studio sin crear cuenta
          </h2>
          <p className="text-base text-studio-trufa/75">
            Selecciona tu arquetipo y visualiza cómo la plataforma adapta colecciones, métricas y operaciones en segundos.
          </p>
          <div className="flex flex-col gap-3 pt-3">
            {demoPlans.map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelected(plan)}
                className={`rounded-[18px] border px-5 py-4 text-left transition-all duration-300 ${
                  plan.id === selected.id
                    ? "border-studio-paprika bg-white shadow-[0_20px_40px_rgba(93,42,66,0.18)]"
                    : "border-studio-neblina/70 bg-white/70 hover:border-studio-paprika/60"
                }`}
              >
                <div className="flex items-center justify-between text-sm font-semibold text-studio-trufa">
                  <span>{plan.label}</span>
                  {plan.id === selected.id ? (
                    <Sparkles className="h-4 w-4 text-studio-paprika" />
                  ) : (
                    <Workflow className="h-4 w-4 text-studio-trufa/50" />
                  )}
                </div>
                <p className="mt-2 text-sm text-studio-trufa/70">{plan.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1">
          <motion.div
            key={previewData.headline}
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative h-full rounded-[26px] border border-studio-neblina/60 bg-white p-8 shadow-[0_32px_90px_rgba(45,27,23,0.16)]"
          >
            <div className="rounded-full border border-studio-neblina/50 bg-studio-crudo/70 px-4 py-1 text-xs uppercase tracking-[0.18em] text-studio-trufa">
              Vista previa sin login
            </div>
            <h3 className="mt-6 font-display text-2xl text-studio-trufa">{previewData.headline}</h3>
            <p className="mt-2 text-sm text-studio-trufa/70">{previewData.hypothesis}</p>

            <div className="mt-6 space-y-3">
              {previewData.checklist.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-2xl border border-studio-neblina/50 bg-studio-crudo/80 px-5 py-3 text-sm text-studio-trufa"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-studio-paprika/15 text-studio-paprika">
                    •
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button variant="studio" className="flex-1">
                Activar demo ahora
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="ghost" className="flex-1 text-studio-trufa hover:bg-studio-crudo/60">
                Agendar sesión con producto
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default DemoCTA;
