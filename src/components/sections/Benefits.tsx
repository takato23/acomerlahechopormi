import { DollarSign, Smile, ChefHat, Sparkles, Leaf, Heart } from "lucide-react";

const benefits = [
  {
    icon: <DollarSign className="h-10 w-10 text-primary" />,
    title: "Ahorra Dinero",
    description: "Optimiza tus compras y reduce el desperdicio de alimentos usando lo que ya tienes.",
  },
  {
    icon: <Smile className="h-10 w-10 text-primary" />,
    title: "Cocina Sin Estrés",
    description: "Olvida la pregunta diaria de '¿qué cocino?' con sugerencias inteligentes y personalizadas.",
  },
  {
    icon: <ChefHat className="h-10 w-10 text-primary" />,
    title: "Recetas a tu Medida",
    description: "Platos fáciles y rápidos adaptados a tus ingredientes, gustos y presupuesto.",
  },
  {
    icon: <Leaf className="h-10 w-10 text-primary" />,
    title: "Menos Desperdicio",
    description: "Contribuye al planeta aprovechando al máximo tus alimentos antes de que caduquen.",
  },
  {
    icon: <Heart className="h-10 w-10 text-primary" />,
    title: "Come Más Variado",
    description: "Descubre nuevas ideas, sabores y combinaciones que quizás no habías considerado.",
  },
  {
    icon: <Sparkles className="h-10 w-10 text-primary" />,
    title: "Planificación Fácil",
    description: "Genera listas de compras automáticas basadas en tu plan de comidas semanal.",
  },
];

const Benefits = () => {
  return (
    <section className="w-full py-16 md:py-24 lg:py-32 bg-background">
      <div className="container px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-foreground">
            ¿Por qué te encantará A Comerla?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Más que un recetario, tu asistente personal de cocina.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit, index) => (
            // Añadir grupo y clases hover
            <div key={index} className="group flex items-start space-x-4 p-4 rounded-lg transition-colors duration-200 hover:bg-muted/50">
              {/* Añadir transición al icono */}
              <div className="flex-shrink-0 mt-1 transition-transform duration-300 ease-in-out group-hover:translate-x-1">
                {benefit.icon}
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1 text-foreground">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Benefits;