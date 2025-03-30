import Lottie from "lottie-react";
// Ajusta la ruta si es necesario, asumiendo que logo.json está en la raíz del proyecto
import logoAnimationData from "../../../Main Scene.json"; // Usar el nuevo archivo JSON
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  isCollapsed?: boolean; // Para potencialmente ajustar la animación o estilo
}

export function Logo({ className, isCollapsed }: LogoProps) {
  // Podríamos ajustar props de Lottie según isCollapsed si quisiéramos,
  // por ahora solo ajustamos tamaño con className
  return (
    <div className={cn("relative", className)}>
      <Lottie
        animationData={logoAnimationData}
        loop={false} // Reproducir una vez y detenerse
        autoplay={true}
        // style={{ width: '100%', height: 'auto' }} // Controlar tamaño con className
      />
      {/* Podríamos superponer el texto "AC" si está colapsado */}
      {isCollapsed && (
         <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-primary">
           AC
         </span>
       )}
    </div>
  );
}