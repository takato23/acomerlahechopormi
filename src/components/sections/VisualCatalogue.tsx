import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CollectionCard {
  name: string;
  description: string;
  asset: string;
  tags: string[];
  hypothesis: string;
}

const collections: CollectionCard[] = [
  {
    name: "Colección Brunch Botánico",
    description: "Mesa editorial con focaccia fermentada en frío, crudités vibrantes y mocktails infusionados.",
    asset: "/branding/catalog-curated-menu.png",
    tags: ["Editorial", "Temporada", "Food Styling"],
    hypothesis: "Hipótesis: +2.4x en tasa de reservas premium",
  },
  {
    name: "Serie Mise en Place Automatizada",
    description: "Workflow visual que combina IA y analítica para planificar producción en hoteles boutique.",
    asset: "/branding/texture-mise-en-place.png",
    tags: ["Operaciones", "IA", "Playbook"],
    hypothesis: "Hipótesis: -18% desperdicio semanal",
  },
  {
    name: "Colección Degustación Chef Aurora",
    description: "Seis pases maridados con storytelling inmersivo y métricas de experiencia en vivo.",
    asset: "/branding/testimonial-collage.webp",
    tags: ["Experiencia", "Live Analytics", "Hospitality"],
    hypothesis: "Hipótesis: NPS 9.4 en degustaciones",
  },
];

const VisualCatalogue = () => {
  return (
    <section id="catalogo" className="bg-studio-crudo py-20 sm:py-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-14 px-4 sm:px-6">
        <header className="max-w-3xl space-y-4">
          <Badge variant="secondary" className="border-studio-neblina/70 bg-studio-crudo/80 text-studio-trufa">
            Curaduría Visual
          </Badge>
          <h2 className="font-display text-3xl text-studio-trufa sm:text-4xl">
            Catálogo editoral listo para enamorar a tus clientes más exigentes
          </h2>
          <p className="text-base text-studio-trufa/70 sm:text-lg">
            Selecciona colecciones, personaliza la narrativa y obtén entregables en minutos. Todo dentro del nuevo estudio gastronómico digital.
          </p>
        </header>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection, index) => (
            <motion.article
              key={collection.name}
              className="group relative overflow-hidden rounded-[22px] border border-studio-neblina/70 bg-white shadow-[0_24px_60px_rgba(45,27,23,0.14)]"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6, ease: "easeOut" }}
              viewport={{ once: true, amount: 0.4 }}
            >
              <div className="relative h-64 overflow-hidden">
                <img
                  src={collection.asset}
                  alt={collection.name}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-studio-trufa/75 via-studio-trufa/20 to-transparent" />
                <div className="absolute left-5 top-5 flex flex-wrap gap-2">
                  {collection.tags.map((tag) => (
                    <Badge key={tag} className="border-white/30 bg-white/20 text-white">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="absolute bottom-4 right-4 rounded-full bg-white/80 px-4 py-2 text-xs font-medium text-studio-trufa shadow">
                  {collection.hypothesis}
                </div>
              </div>

              <div className="space-y-4 p-6">
                <h3 className="font-display text-2xl text-studio-trufa">{collection.name}</h3>
                <p className="text-sm text-studio-trufa/80">{collection.description}</p>
                <Button variant="glass" className="border-studio-neblina/60 text-studio-trufa hover:bg-studio-crudo/70">
                  Ver set curado
                </Button>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default VisualCatalogue;
