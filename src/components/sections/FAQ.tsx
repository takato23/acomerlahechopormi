import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"; // Importar Accordion de Shadcn

const faqItems = [
  {
    question: "¿Usar 'A Comerla' tiene algún costo?",
    answer: "Actualmente ofrecemos un plan gratuito con funciones básicas. Próximamente tendremos opciones premium con características avanzadas.",
  },
  {
    question: "¿Qué tecnología de inteligencia artificial utilizan?",
    answer: "Utilizamos modelos avanzados de IA, como los proporcionados por Google (Gemini), especializados en procesamiento de lenguaje natural y recomendación de recetas para ofrecerte sugerencias personalizadas.",
  },
  {
    question: "¿Puedo indicar ingredientes de cualquier supermercado o tienda?",
    answer: "¡Sí! Puedes añadir manualmente cualquier ingrediente que tengas en tu despensa, sin importar dónde lo compraste. La aplicación se basa en lo que *tienes*, no en dónde lo adquiriste.",
  },
  {
    question: "¿Cómo maneja la aplicación las preferencias dietéticas o alergias?",
    answer: "En futuras versiones, podrás configurar tu perfil con restricciones dietéticas (vegetariano, vegano, sin gluten, etc.) y alergias. La IA tomará esto en cuenta al generar sugerencias.",
  },
];

const FAQ = () => {
  return (
    <section className="w-full py-16 md:py-24 lg:py-32 bg-background"> {/* Fondo base */}
      <div className="container px-4 md:px-6 max-w-3xl mx-auto"> {/* Centrado y con ancho máximo */}
        <h2 className="text-3xl font-bold tracking-tighter text-center mb-10 sm:text-4xl md:text-5xl text-foreground">
          Preguntas Frecuentes
        </h2>
        <Accordion type="single" collapsible className="w-full">
          {faqItems.map((item, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left font-medium text-lg"> {/* Ajustar tamaño y alineación */}
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQ;