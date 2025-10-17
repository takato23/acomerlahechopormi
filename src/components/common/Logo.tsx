import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

// Tipos de logo disponibles
type LogoType = "duck" | "plate" | "ingredients" | "checklist" | "leaf" | "minimal";

interface LogoProps {
  className?: string;
  isCollapsed?: boolean;
  autoplay?: boolean;
  loop?: boolean;
  size?: "sm" | "md" | "lg";
  showControls?: boolean;
  speed?: number;
  type?: LogoType;
}

// Componentes de logo individuales
function DuckLogo({ className, isCollapsed, autoplay = true, loop = true, size = "md", showControls = false, speed = 1 }: LogoProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showParticles, setShowParticles] = useState(true);

  useEffect(() => {
    if (autoplay && !isCollapsed && !isPaused) {
      const timer = setTimeout(() => {
        setIsAnimating(true);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
    }
  }, [autoplay, isCollapsed, isPaused]);

  const toggleAnimation = () => setIsPaused(!isPaused);
  const toggleParticles = () => setShowParticles(!showParticles);
  const resetAnimation = () => { setIsPaused(false); setIsAnimating(true); };

  const sizeClasses = { sm: "w-8 h-8", md: "w-16 h-16", lg: "w-24 h-24" };

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <div className={cn("relative transition-all duration-500 ease-in-out", sizeClasses[size], isCollapsed && "w-10 h-10")}>
        <svg width="100%" height="100%" viewBox="0 0 200 200" className="drop-shadow-lg">
          <ellipse cx="100" cy="120" rx="35" ry="45" fill="#FFD700" className={cn("transition-all duration-1000", isAnimating && "animate-pulse")} />
          <ellipse cx="100" cy="80" rx="25" ry="30" fill="#FFA500" className={cn("transition-all duration-1000", isAnimating && "animate-pulse")} />
          <polygon points="120,75 140,80 120,85" fill="#FF6B35" className={cn("transition-all duration-1000", isAnimating && "animate-pulse")} />
          <circle cx="90" cy="70" r="8" fill="white" /><circle cx="90" cy="70" r="5" fill="black" /><circle cx="92" cy="68" r="2" fill="white" />
          <ellipse cx="70" cy="110" rx="15" ry="25" fill="#FFB347" className={cn("transition-all duration-1000", isAnimating && "animate-pulse")} />
          <ellipse cx="85" cy="160" rx="8" ry="12" fill="#FF8C00" /><ellipse cx="80" cy="170" rx="6" ry="8" fill="#FF8C00" /><ellipse cx="90" cy="170" rx="6" ry="8" fill="#FF8C00" />
          <ellipse cx="115" cy="160" rx="8" ry="12" fill="#FF8C00" /><ellipse cx="110" cy="170" rx="6" ry="8" fill="#FF8C00" /><ellipse cx="120" cy="170" rx="6" ry="8" fill="#FF8C00" />

          <g className={cn("transition-all duration-500 ease-in-out", isAnimating && "animate-bounce")} style={{ transformOrigin: "60px 100px", animationDelay: "0.3s" }}>
            <rect x="45" y="90" width="3" height="25" fill="#C0C0C0" /><rect x="40" y="90" width="3" height="25" fill="#C0C0C0" />
            <rect x="50" y="90" width="3" height="25" fill="#C0C0C0" /><rect x="55" y="90" width="3" height="25" fill="#C0C0C0" />
            <line x1="42" y1="85" x2="58" y2="85" stroke="#C0C0C0" strokeWidth="3" />
          </g>

          <g className={cn("transition-all duration-500 ease-in-out", isAnimating && "animate-bounce")} style={{ transformOrigin: "140px 100px", animationDelay: "0.6s" }}>
            <rect x="135" y="90" width="8" height="25" fill="#C0C0C0" />
            <polygon points="139,85 141,85 140,75" fill="#C0C0C0" />
            <polygon points="135,115 143,115 139,105" fill="#C0C0C0" />
          </g>

          <g className={cn("transition-all duration-500 ease-in-out", isAnimating && "animate-bounce")} style={{ transformOrigin: "100px 140px", animationDelay: "0.9s" }}>
            <ellipse cx="100" cy="150" rx="12" ry="8" fill="#C0C0C0" />
            <rect x="97" y="140" width="6" height="15" fill="#C0C0C0" />
          </g>

          <g className={cn("transition-all duration-700 ease-in-out", isAnimating && "opacity-100")} style={{ transformOrigin: "100px 100px", animation: isAnimating ? "utensilsArrange 3s ease-in-out infinite" : "none" }}>
            <circle cx="60" cy="100" r="3" fill="#FFD700" className="animate-ping opacity-50" />
            <circle cx="140" cy="100" r="3" fill="#FFD700" className="animate-ping opacity-50" style={{ animationDelay: "0.5s" }} />
            <circle cx="100" cy="140" r="3" fill="#FFD700" className="animate-ping opacity-50" style={{ animationDelay: "1s" }} />
            <path d="M 60 100 Q 80 90 100 100 Q 120 110 140 100" fill="none" stroke="rgba(255, 215, 0, 0.4)" strokeWidth="2" strokeDasharray="3,3" className={cn("transition-all duration-1000", isAnimating ? "opacity-100" : "opacity-0")} />
          </g>

          <g className={cn("transition-all duration-1000", (isAnimating && showParticles) ? "opacity-100" : "opacity-0")}>
            <circle cx="70" cy="60" r="2" fill="#FFD700" className="animate-ping" style={{ animationDelay: "1s", animationDuration: `${2 / speed}s` }} />
            <circle cx="130" cy="60" r="2" fill="#FFD700" className="animate-ping" style={{ animationDelay: "1.2s", animationDuration: `${2.2 / speed}s` }} />
            <circle cx="100" cy="50" r="1.5" fill="#FFA500" className="animate-ping" style={{ animationDelay: "1.5s", animationDuration: `${1.8 / speed}s` }} />
            <circle cx="100" cy="170" r="2" fill="#FF8C00" className="animate-ping" style={{ animationDelay: "2s", animationDuration: `${2.5 / speed}s` }} />
          </g>
        </svg>
      </div>

      {isCollapsed && (
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-primary bg-background/80 rounded-full w-10 h-10">
          AC
        </span>
      )}

      {showControls && !isCollapsed && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2">
          <button onClick={toggleAnimation} className="text-xs px-2 py-1 bg-background/80 text-foreground rounded hover:bg-background transition-colors" title={isPaused ? "Reanudar" : "Pausar"}>
            {isPaused ? "▶️" : "⏸️"}
          </button>
          <button onClick={toggleParticles} className="text-xs px-2 py-1 bg-background/80 text-foreground rounded hover:bg-background transition-colors" title={showParticles ? "Ocultar partículas" : "Mostrar partículas"}>
            {showParticles ? "✨" : "⚫"}
          </button>
          <button onClick={resetAnimation} className="text-xs px-2 py-1 bg-background/80 text-foreground rounded hover:bg-background transition-colors" title="Reiniciar">
            🔄
          </button>
        </div>
      )}

      <style>{`
        @keyframes utensilsArrange {
          0% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.1) rotate(5deg); }
          50% { transform: scale(0.9) rotate(-3deg); }
          75% { transform: scale(1.05) rotate(2deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
      `}</style>
    </div>
  );
}

function PlateLogo({ className, isCollapsed, autoplay = true, loop = true, size = "md", showControls = false, speed = 1 }: LogoProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showParticles, setShowParticles] = useState(true);

  useEffect(() => {
    if (autoplay && !isCollapsed && !isPaused) {
      const timer = setTimeout(() => setIsAnimating(true), 300);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
    }
  }, [autoplay, isCollapsed, isPaused]);

  const toggleAnimation = () => setIsPaused(!isPaused);
  const toggleParticles = () => setShowParticles(!showParticles);
  const resetAnimation = () => { setIsPaused(false); setIsAnimating(true); };

  const sizeClasses = { sm: "w-8 h-8", md: "w-16 h-16", lg: "w-24 h-24" };

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <div className={cn("relative transition-all duration-500 ease-in-out", sizeClasses[size], isCollapsed && "w-10 h-10")}>
        <svg width="100%" height="100%" viewBox="0 0 200 200" className="drop-shadow-lg">
          {/* Plato principal */}
          <circle cx="100" cy="100" r="45" fill="#FAFAFA" stroke="#E0E0E0" strokeWidth="2" />
          <circle cx="100" cy="100" r="40" fill="#FFFFFF" stroke="#F5F5F5" strokeWidth="1" />

          {/* Cubiertos - Tenedor izquierdo */}
          <g className={cn("transition-all duration-500 ease-in-out", isAnimating && "animate-bounce")} style={{ transformOrigin: "60px 100px", animationDelay: "0.3s" }}>
            <rect x="45" y="90" width="3" height="25" fill="#9E9E9E" />
            <rect x="40" y="90" width="3" height="25" fill="#9E9E9E" />
            <rect x="50" y="90" width="3" height="25" fill="#9E9E9E" />
            <rect x="55" y="90" width="3" height="25" fill="#9E9E9E" />
            <line x1="42" y1="85" x2="58" y2="85" stroke="#9E9E9E" strokeWidth="3" />
          </g>

          {/* Cubiertos - Cuchillo derecho */}
          <g className={cn("transition-all duration-500 ease-in-out", isAnimating && "animate-bounce")} style={{ transformOrigin: "140px 100px", animationDelay: "0.6s" }}>
            <rect x="135" y="90" width="8" height="25" fill="#9E9E9E" />
            <polygon points="139,85 141,85 140,75" fill="#9E9E9E" />
            <polygon points="135,115 143,115 139,105" fill="#9E9E9E" />
          </g>

          {/* Líneas de posición elegante */}
          <path d="M 60 100 Q 80 90 100 100 Q 120 110 140 100" fill="none" stroke="rgba(158, 158, 158, 0.3)" strokeWidth="2" strokeDasharray="3,3"
                className={cn("transition-all duration-1000", isAnimating ? "opacity-100" : "opacity-0")} />

          {/* Partículas sutiles */}
          <g className={cn("transition-all duration-1000", (isAnimating && showParticles) ? "opacity-100" : "opacity-0")}>
            <circle cx="70" cy="80" r="1.5" fill="#E0E0E0" className="animate-ping" style={{ animationDelay: "1s", animationDuration: `${2 / speed}s` }} />
            <circle cx="130" cy="80" r="1.5" fill="#E0E0E0" className="animate-ping" style={{ animationDelay: "1.2s", animationDuration: `${2.2 / speed}s` }} />
            <circle cx="100" cy="70" r="1" fill="#F5F5F5" className="animate-ping" style={{ animationDelay: "1.5s", animationDuration: `${1.8 / speed}s` }} />
          </g>
        </svg>
      </div>

      {isCollapsed && (
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-primary bg-background/80 rounded-full w-10 h-10">
          AC
        </span>
      )}

      {showControls && !isCollapsed && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2">
          <button onClick={toggleAnimation} className="text-xs px-2 py-1 bg-background/80 text-foreground rounded hover:bg-background transition-colors" title={isPaused ? "Reanudar" : "Pausar"}>
            {isPaused ? "▶️" : "⏸️"}
          </button>
          <button onClick={toggleParticles} className="text-xs px-2 py-1 bg-background/80 text-foreground rounded hover:bg-background transition-colors" title={showParticles ? "Ocultar partículas" : "Mostrar partículas"}>
            {showParticles ? "✨" : "⚫"}
          </button>
          <button onClick={resetAnimation} className="text-xs px-2 py-1 bg-background/80 text-foreground rounded hover:bg-background transition-colors" title="Reiniciar">
            🔄
          </button>
        </div>
      )}
    </div>
  );
}

function IngredientsLogo({ className, isCollapsed, autoplay = true, loop = true, size = "md", showControls = false, speed = 1 }: LogoProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showParticles, setShowParticles] = useState(true);

  useEffect(() => {
    if (autoplay && !isCollapsed && !isPaused) {
      const timer = setTimeout(() => setIsAnimating(true), 300);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
    }
  }, [autoplay, isCollapsed, isPaused]);

  const toggleAnimation = () => setIsPaused(!isPaused);
  const toggleParticles = () => setShowParticles(!showParticles);
  const resetAnimation = () => { setIsPaused(false); setIsAnimating(true); };

  const sizeClasses = { sm: "w-8 h-8", md: "w-16 h-16", lg: "w-24 h-24" };

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <div className={cn("relative transition-all duration-500 ease-in-out", sizeClasses[size], isCollapsed && "w-10 h-10")}>
        <svg width="100%" height="100%" viewBox="0 0 200 200" className="drop-shadow-lg">
          {/* Fondo circular sutil */}
          <circle cx="100" cy="100" r="50" fill="#F8F8F8" opacity="0.5" />

          {/* Ingredientes estilizados */}
          <g className={cn("transition-all duration-700 ease-in-out", isAnimating && "animate-pulse")}>
            {/* Tomate */}
            <circle cx="80" cy="90" r="12" fill="#FF6B6B" />
            <circle cx="80" cy="90" r="8" fill="#FF5252" />

            {/* Lechuga */}
            <ellipse cx="100" cy="85" rx="15" ry="8" fill="#4CAF50" />
            <ellipse cx="100" cy="85" rx="12" ry="6" fill="#66BB6A" />

            {/* Queso */}
            <rect x="110" y="85" width="12" height="8" rx="2" fill="#FFD54F" />
            <rect x="110" y="85" width="10" height="6" rx="1" fill="#FFEB3B" />

            {/* Pan inferior */}
            <ellipse cx="100" cy="115" rx="25" ry="8" fill="#D4A574" />
            <ellipse cx="100" cy="115" rx="22" ry="6" fill="#DEB887" />
          </g>

          {/* Líneas de organización sutil */}
          <g className={cn("transition-all duration-1000", isAnimating ? "opacity-100" : "opacity-0")}>
            <circle cx="100" cy="100" r="45" fill="none" stroke="rgba(158, 158, 158, 0.2)" strokeWidth="1" strokeDasharray="5,5" />
          </g>

          {/* Partículas sutiles */}
          <g className={cn("transition-all duration-1000", (isAnimating && showParticles) ? "opacity-100" : "opacity-0")}>
            <circle cx="70" cy="70" r="1" fill="#FF6B6B" className="animate-ping" style={{ animationDelay: "1s", animationDuration: `${2 / speed}s` }} />
            <circle cx="130" cy="70" r="1" fill="#4CAF50" className="animate-ping" style={{ animationDelay: "1.2s", animationDuration: `${2.2 / speed}s` }} />
            <circle cx="100" cy="60" r="0.8" fill="#FFD54F" className="animate-ping" style={{ animationDelay: "1.5s", animationDuration: `${1.8 / speed}s` }} />
          </g>
        </svg>
      </div>

      {isCollapsed && (
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-primary bg-background/80 rounded-full w-10 h-10">
          AC
        </span>
      )}

      {showControls && !isCollapsed && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2">
          <button onClick={toggleAnimation} className="text-xs px-2 py-1 bg-background/80 text-foreground rounded hover:bg-background transition-colors" title={isPaused ? "Reanudar" : "Pausar"}>
            {isPaused ? "▶️" : "⏸️"}
          </button>
          <button onClick={toggleParticles} className="text-xs px-2 py-1 bg-background/80 text-foreground rounded hover:bg-background transition-colors" title={showParticles ? "Ocultar partículas" : "Mostrar partículas"}>
            {showParticles ? "✨" : "⚫"}
          </button>
          <button onClick={resetAnimation} className="text-xs px-2 py-1 bg-background/80 text-foreground rounded hover:bg-background transition-colors" title="Reiniciar">
            🔄
          </button>
        </div>
      )}
    </div>
  );
}

function ChecklistLogo({ className, isCollapsed, autoplay = true, loop = true, size = "md", showControls = false, speed = 1 }: LogoProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showParticles, setShowParticles] = useState(true);

  useEffect(() => {
    if (autoplay && !isCollapsed && !isPaused) {
      const timer = setTimeout(() => setIsAnimating(true), 300);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
    }
  }, [autoplay, isCollapsed, isPaused]);

  const toggleAnimation = () => setIsPaused(!isPaused);
  const toggleParticles = () => setShowParticles(!showParticles);
  const resetAnimation = () => { setIsPaused(false); setIsAnimating(true); };

  const sizeClasses = { sm: "w-8 h-8", md: "w-16 h-16", lg: "w-24 h-24" };

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <div className={cn("relative transition-all duration-500 ease-in-out", sizeClasses[size], isCollapsed && "w-10 h-10")}>
        <svg width="100%" height="100%" viewBox="0 0 200 200" className="drop-shadow-lg">
          {/* Fondo de papel */}
          <rect x="65" y="60" width="70" height="90" rx="5" fill="#FAFAFA" stroke="#E0E0E0" strokeWidth="2" />
          <rect x="70" y="65" width="60" height="80" rx="3" fill="#FFFFFF" />

          {/* Líneas de lista */}
          <line x1="75" y1="80" x2="125" y2="80" stroke="#E0E0E0" strokeWidth="1" />
          <line x1="75" y1="95" x2="125" y2="95" stroke="#E0E0E0" strokeWidth="1" />
          <line x1="75" y1="110" x2="125" y2="110" stroke="#E0E0E0" strokeWidth="1" />
          <line x1="75" y1="125" x2="125" y2="125" stroke="#E0E0E0" strokeWidth="1" />

          {/* Checkmarks animados */}
          <g className={cn("transition-all duration-500 ease-in-out", isAnimating && "animate-pulse")}>
            <path d="M 80 75 L 85 82 L 95 68" stroke="#4CAF50" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"
                  className={cn("transition-all duration-1000", isAnimating ? "opacity-100" : "opacity-0")} style={{ animationDelay: "0.5s" }} />
            <path d="M 80 90 L 85 97 L 95 83" stroke="#4CAF50" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"
                  className={cn("transition-all duration-1000", isAnimating ? "opacity-100" : "opacity-0")} style={{ animationDelay: "1s" }} />
            <path d="M 80 105 L 85 112 L 95 98" stroke="#4CAF50" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"
                  className={cn("transition-all duration-1000", isAnimating ? "opacity-100" : "opacity-0")} style={{ animationDelay: "1.5s" }} />
          </g>

          {/* Íconos de comida sutiles */}
          <g className={cn("transition-all duration-700 ease-in-out", isAnimating && "animate-pulse")} style={{ animationDelay: "2s" }}>
            <circle cx="105" cy="75" r="3" fill="#FF6B6B" />
            <circle cx="105" cy="90" r="3" fill="#4CAF50" />
            <circle cx="105" cy="105" r="3" fill="#FFD54F" />
          </g>

          {/* Partículas de checkmark */}
          <g className={cn("transition-all duration-1000", (isAnimating && showParticles) ? "opacity-100" : "opacity-0")}>
            <circle cx="95" cy="75" r="2" fill="#4CAF50" className="animate-ping" style={{ animationDelay: "0.5s", animationDuration: `${2 / speed}s` }} />
            <circle cx="95" cy="90" r="2" fill="#4CAF50" className="animate-ping" style={{ animationDelay: "1s", animationDuration: `${2.2 / speed}s` }} />
            <circle cx="95" cy="105" r="2" fill="#4CAF50" className="animate-ping" style={{ animationDelay: "1.5s", animationDuration: `${1.8 / speed}s` }} />
          </g>
        </svg>
      </div>

      {isCollapsed && (
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-primary bg-background/80 rounded-full w-10 h-10">
          AC
        </span>
      )}

      {showControls && !isCollapsed && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2">
          <button onClick={toggleAnimation} className="text-xs px-2 py-1 bg-background/80 text-foreground rounded hover:bg-background transition-colors" title={isPaused ? "Reanudar" : "Pausar"}>
            {isPaused ? "▶️" : "⏸️"}
          </button>
          <button onClick={toggleParticles} className="text-xs px-2 py-1 bg-background/80 text-foreground rounded hover:bg-background transition-colors" title={showParticles ? "Ocultar partículas" : "Mostrar partículas"}>
            {showParticles ? "✨" : "⚫"}
          </button>
          <button onClick={resetAnimation} className="text-xs px-2 py-1 bg-background/80 text-foreground rounded hover:bg-background transition-colors" title="Reiniciar">
            🔄
          </button>
        </div>
      )}
    </div>
  );
}

function LeafLogo({ className, isCollapsed, autoplay = true, loop = true, size = "md", showControls = false, speed = 1 }: LogoProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showParticles, setShowParticles] = useState(true);

  useEffect(() => {
    if (autoplay && !isCollapsed && !isPaused) {
      const timer = setTimeout(() => setIsAnimating(true), 300);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
    }
  }, [autoplay, isCollapsed, isPaused]);

  const toggleAnimation = () => setIsPaused(!isPaused);
  const toggleParticles = () => setShowParticles(!showParticles);
  const resetAnimation = () => { setIsPaused(false); setIsAnimating(true); };

  const sizeClasses = { sm: "w-8 h-8", md: "w-16 h-16", lg: "w-24 h-24" };

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <div className={cn("relative transition-all duration-500 ease-in-out", sizeClasses[size], isCollapsed && "w-10 h-10")}>
        <svg width="100%" height="100%" viewBox="0 0 200 200" className="drop-shadow-lg">
          {/* Hoja principal */}
          <path d="M 100 60 Q 120 50 130 70 Q 125 90 110 100 Q 130 110 125 130 Q 120 150 100 140 Q 80 150 75 130 Q 70 110 90 100 Q 75 90 80 70 Q 85 50 100 60 Z"
                fill="#4CAF50" className={cn("transition-all duration-1000", isAnimating && "animate-pulse")} />

          {/* Nervadura central */}
          <path d="M 100 60 L 100 140" stroke="#388E3C" strokeWidth="3" fill="none"
                className={cn("transition-all duration-1000", isAnimating && "animate-pulse")} />

          {/* Nervaduras laterales */}
          <g className={cn("transition-all duration-700 ease-in-out", isAnimating && "animate-pulse")} style={{ animationDelay: "0.5s" }}>
            <path d="M 100 80 Q 110 85 105 95" stroke="#66BB6A" strokeWidth="2" fill="none" />
            <path d="M 100 100 Q 110 105 105 115" stroke="#66BB6A" strokeWidth="2" fill="none" />
            <path d="M 100 120 Q 90 115 95 105" stroke="#66BB6A" strokeWidth="2" fill="none" />
            <path d="M 100 100 Q 90 95 95 85" stroke="#66BB6A" strokeWidth="2" fill="none" />
          </g>

          {/* Gota de agua */}
          <ellipse cx="115" cy="75" rx="6" ry="8" fill="#2196F3" opacity="0.7"
                   className={cn("transition-all duration-1000", isAnimating && "animate-bounce")} style={{ animationDelay: "1s" }} />

          {/* Partículas de crecimiento */}
          <g className={cn("transition-all duration-1000", (isAnimating && showParticles) ? "opacity-100" : "opacity-0")}>
            <circle cx="85" cy="90" r="1.5" fill="#4CAF50" className="animate-ping" style={{ animationDelay: "1s", animationDuration: `${2 / speed}s` }} />
            <circle cx="115" cy="110" r="1.5" fill="#4CAF50" className="animate-ping" style={{ animationDelay: "1.3s", animationDuration: `${2.2 / speed}s` }} />
            <circle cx="100" cy="130" r="1" fill="#2196F3" className="animate-ping" style={{ animationDelay: "1.6s", animationDuration: `${1.8 / speed}s` }} />
          </g>
        </svg>
      </div>

      {isCollapsed && (
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-primary bg-background/80 rounded-full w-10 h-10">
          AC
        </span>
      )}

      {showControls && !isCollapsed && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2">
          <button onClick={toggleAnimation} className="text-xs px-2 py-1 bg-background/80 text-foreground rounded hover:bg-background transition-colors" title={isPaused ? "Reanudar" : "Pausar"}>
            {isPaused ? "▶️" : "⏸️"}
          </button>
          <button onClick={toggleParticles} className="text-xs px-2 py-1 bg-background/80 text-foreground rounded hover:bg-background transition-colors" title={showParticles ? "Ocultar partículas" : "Mostrar partículas"}>
            {showParticles ? "✨" : "⚫"}
          </button>
          <button onClick={resetAnimation} className="text-xs px-2 py-1 bg-background/80 text-foreground rounded hover:bg-background transition-colors" title="Reiniciar">
            🔄
          </button>
        </div>
      )}
    </div>
  );
}

function MinimalLogo({ className, isCollapsed, autoplay = true, loop = true, size = "md", showControls = false, speed = 1 }: LogoProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showParticles, setShowParticles] = useState(true);

  useEffect(() => {
    if (autoplay && !isCollapsed && !isPaused) {
      const timer = setTimeout(() => setIsAnimating(true), 300);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
    }
  }, [autoplay, isCollapsed, isPaused]);

  const toggleAnimation = () => setIsPaused(!isPaused);
  const toggleParticles = () => setShowParticles(!showParticles);
  const resetAnimation = () => { setIsPaused(false); setIsAnimating(true); };

  const sizeClasses = { sm: "w-8 h-8", md: "w-16 h-16", lg: "w-24 h-24" };

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <div className={cn("relative transition-all duration-500 ease-in-out", sizeClasses[size], isCollapsed && "w-10 h-10")}>
        <svg width="100%" height="100%" viewBox="0 0 200 200" className="drop-shadow-lg">
          {/* Círculo principal */}
          <circle cx="100" cy="100" r="40" fill="#F8F8F8" stroke="#E0E0E0" strokeWidth="2"
                  className={cn("transition-all duration-1000", isAnimating && "animate-pulse")} />

          {/* Elementos minimalistas */}
          <g className={cn("transition-all duration-700 ease-in-out", isAnimating && "animate-pulse")}>
            {/* Línea superior */}
            <line x1="75" y1="85" x2="125" y2="85" stroke="#9E9E9E" strokeWidth="3" strokeLinecap="round" />
            {/* Línea media */}
            <line x1="80" y1="100" x2="120" y2="100" stroke="#9E9E9E" strokeWidth="2" strokeLinecap="round" />
            {/* Línea inferior */}
            <line x1="85" y1="115" x2="115" y2="115" stroke="#9E9E9E" strokeWidth="2" strokeLinecap="round" />
          </g>

          {/* Punto focal sutil */}
          <circle cx="100" cy="100" r="3" fill="#757575"
                  className={cn("transition-all duration-1000", isAnimating && "animate-pulse")} />

          {/* Partículas mínimas */}
          <g className={cn("transition-all duration-1000", (isAnimating && showParticles) ? "opacity-100" : "opacity-0")}>
            <circle cx="75" cy="75" r="1" fill="#E0E0E0" className="animate-ping" style={{ animationDelay: "1s", animationDuration: `${2 / speed}s` }} />
            <circle cx="125" cy="75" r="1" fill="#E0E0E0" className="animate-ping" style={{ animationDelay: "1.2s", animationDuration: `${2.2 / speed}s` }} />
            <circle cx="100" cy="60" r="0.8" fill="#F5F5F5" className="animate-ping" style={{ animationDelay: "1.5s", animationDuration: `${1.8 / speed}s` }} />
          </g>
        </svg>
      </div>

      {isCollapsed && (
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-primary bg-background/80 rounded-full w-10 h-10">
          AC
        </span>
      )}

      {showControls && !isCollapsed && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2">
          <button onClick={toggleAnimation} className="text-xs px-2 py-1 bg-background/80 text-foreground rounded hover:bg-background transition-colors" title={isPaused ? "Reanudar" : "Pausar"}>
            {isPaused ? "▶️" : "⏸️"}
          </button>
          <button onClick={toggleParticles} className="text-xs px-2 py-1 bg-background/80 text-foreground rounded hover:bg-background transition-colors" title={showParticles ? "Ocultar partículas" : "Mostrar partículas"}>
            {showParticles ? "✨" : "⚫"}
          </button>
          <button onClick={resetAnimation} className="text-xs px-2 py-1 bg-background/80 text-foreground rounded hover:bg-background transition-colors" title="Reiniciar">
            🔄
          </button>
        </div>
      )}
    </div>
  );
}

// Componente principal Logo que selecciona el tipo
export function Logo({
  className,
  isCollapsed,
  autoplay = true,
  loop = true,
  size = "md",
  showControls = false,
  speed = 1,
  type = "duck"
}: LogoProps) {
  const props = { className, isCollapsed, autoplay, loop, size, showControls, speed };

  switch (type) {
    case "plate": return <PlateLogo {...props} />;
    case "ingredients": return <IngredientsLogo {...props} />;
    case "checklist": return <ChecklistLogo {...props} />;
    case "leaf": return <LeafLogo {...props} />;
    case "minimal": return <MinimalLogo {...props} />;
    default: return <DuckLogo {...props} />;
  }
}
