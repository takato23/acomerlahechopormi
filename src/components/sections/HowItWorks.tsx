import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, Calculator, ChefHat, Sparkles } from "lucide-react";

const steps = [
  {
    icon: <ClipboardList className="h-12 w-12 text-primary" />,
    title: "Registra tus Ingredientes",
    description: "Añade fácilmente lo que tienes en tu nevera y despensa. ¡Incluso puedes usar la cámara!",
  },
  {
    icon: <Calculator className="h-12 w-12 text-primary" />,
    title: "Define tu Presupuesto",
    description: "Establece un límite de gasto o calorías para recibir sugerencias que se ajusten a tus necesidades.",
  },
  {
    icon: <ChefHat className="h-12 w-12 text-primary" />,
    title: "Recibe Sugerencias",
    description: "Nuestra IA analiza tus ingredientes y preferencias para crear recetas deliciosas y personalizadas.",
  },
  {
    icon: <Sparkles className="h-12 w-12 text-primary" />,
    title: "¡A Cocinar!",
    description: "Sigue las instrucciones paso a paso y disfruta de comidas caseras sin complicaciones.",
  },
];

const HowItWorks = () => {
  return (
    <section className="w-full py-16 md:py-24 lg:py-32 bg-muted">
      <div className="container px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-foreground">
            Simple como contar hasta 4
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Organiza tu cocina y descubre nuevas recetas en minutos.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            // Añadir clases de transición y hover
            <Card
              key={index}
              className="flex flex-col items-center text-center p-6 bg-card shadow-md transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1" // Efecto hover
            >
              <CardHeader className="pb-4">
                {step.icon}
              </CardHeader>
              <CardContent>
                <CardTitle className="text-xl font-semibold text-card-foreground mb-2">{step.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;