import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Quote } from "lucide-react";

interface Testimonial {
  name: string;
  role: string;
  quote: string;
  impact: string;
}

const testimonials: Testimonial[] = [
  {
    name: "Isidora Valdés",
    role: "Directora Creativa, Casa Sazón",
    quote:
      "La narrativa editorial preconstruida nos permitió lanzar una nueva carta en 7 días. Los tableros de analítica están listos para presentar al cliente sin ajustes.",
    impact: "Hipótesis: +28% conversión degustaciones",
  },
  {
    name: "Mateo Rocca",
    role: "Head of F&B, Hotel Aurora",
    quote:
      "Pasamos de planificar mise en place en hojas de cálculo a un flujo orquestado con IA. Las alertas de operación nos salvaron el festival de otoño.",
    impact: "Hipótesis: -15% merma operativa",
  },
  {
    name: "Camila Bianchi",
    role: "Fundadora, Studio Olluco",
    quote:
      "El demo público sin login nos funciona como showroom vivo. Cada plan curado parece diseñado a medida para nuestros clientes corporativos.",
    impact: "Hipótesis: NPS 9.2 en degustaciones",
  },
];

const Testimonials = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % testimonials.length);
    }, 5600);
    return () => window.clearInterval(timer);
  }, []);

  const activeTestimonial = testimonials[index];

  return (
    <section id="testimonios" className="bg-studio-merlot text-white py-20 sm:py-24">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 text-pretty sm:px-6">
        <header className="space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-1 text-xs uppercase tracking-[0.2em] text-white/80">
            Testimonios verificados (hipótesis)
          </span>
          <h2 className="font-display text-3xl sm:text-4xl">Historias reales desde estudios culinarios premium</h2>
          <p className="text-sm text-white/80 sm:text-base">
            Rotamos continuamente feedback de pilotos para priorizar la hoja de ruta. Las métricas mostradas son hipótesis en validación.
          </p>
        </header>

        <div className="relative overflow-hidden rounded-[24px] border border-white/20 bg-white/10 p-8 shadow-[0_28px_80px_rgba(0,0,0,0.35)] backdrop-blur">
          <Quote className="absolute -left-6 -top-6 h-16 w-16 text-white/20" />
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTestimonial.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="space-y-6"
            >
              <p className="text-lg leading-relaxed md:text-xl">“{activeTestimonial.quote}”</p>
              <div className="flex flex-col gap-2 text-sm font-medium text-white/80 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="font-semibold text-white">{activeTestimonial.name}</div>
                  <div>{activeTestimonial.role}</div>
                </div>
                <div className="rounded-full border border-white/30 bg-white/15 px-4 py-2 text-xs uppercase tracking-[0.18em] text-white">
                  {activeTestimonial.impact}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
          <div className="mt-8 flex items-center gap-3">
            {testimonials.map((testimonial, i) => (
              <button
                key={testimonial.name}
                type="button"
                aria-label={`Ver testimonio de ${testimonial.name}`}
                className={`h-2 w-10 rounded-full transition-all duration-300 ${
                  i === index ? "bg-white" : "bg-white/30 hover:bg-white/60"
                }`}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
