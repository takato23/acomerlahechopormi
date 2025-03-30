import { motion, useAnimation, useInView } from "framer-motion";
import { useEffect, useRef } from "react";

interface Props {
  children: React.ReactNode;
  delay?: number; // Retraso opcional en segundos
  className?: string; // Clases CSS opcionales para el contenedor
}

const FadeInWhenVisible: React.FC<Props> = ({ children, delay = 0, className }) => {
  const controls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px 0px -50px 0px" }); // Activar un poco antes/después de entrar

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [controls, isInView]);

  return (
    <motion.div
      ref={ref}
      animate={controls}
      initial="hidden"
      transition={{ duration: 0.5, delay }}
      variants={{
        visible: { opacity: 1, y: 0 },
        hidden: { opacity: 0, y: 20 }, // Empieza ligeramente abajo
      }}
      className={className} // Aplicar clases opcionales
    >
      {children}
    </motion.div>
  );
};

export default FadeInWhenVisible;