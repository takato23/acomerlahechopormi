import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ParticleBackground } from './ParticleBackground';
import { WaveBackground } from './WaveBackground';
import { MorphingBlob, FloatingBlob } from './MorphingBlob';
import { DynamicLighting, LightingScene, SpotlightEffect } from './DynamicLighting';
import { PageTransition, MorphTransition } from './CinematicTransition';
import { AdvancedText, TypewriterText } from './AdvancedText';
import { useSoundEffects, useHapticFeedback } from './SoundEffects';

interface ImmersiveExperienceProps {
  children: React.ReactNode;
  className?: string;
  theme?: 'cosmic' | 'ocean' | 'forest' | 'sunset' | 'aurora';
  intensity?: 'subtle' | 'moderate' | 'intense';
  interactive?: boolean;
}

const themes = {
  cosmic: {
    particles: { count: 60, colors: ['#8B5CF6', '#3B82F6', '#06B6D4', '#FFFFFF'] },
    lighting: [
      { position: { x: '15%', y: '20%' }, color: 'rgba(139, 92, 246, 0.4)', size: 450, intensity: 0.7, pulse: true },
      { position: { x: '85%', y: '70%' }, color: 'rgba(59, 130, 246, 0.3)', size: 350, intensity: 0.5 },
      { position: { x: '70%', y: '30%' }, color: 'rgba(6, 182, 212, 0.2)', size: 280, intensity: 0.4, pulse: true }
    ],
    blobs: [
      { className: 'top-16 left-12', size: 'lg', color: 'bg-gradient-secondary', delay: 0 },
      { className: 'top-32 right-16', size: 'md', color: 'bg-gradient-primary', delay: 1.5 },
      { className: 'bottom-32 left-1/3', size: 'sm', color: 'bg-accent/40', delay: 3 },
      { className: 'top-48 right-1/4', size: 'md', color: 'bg-gradient-rainbow', delay: 4.5 },
      { className: 'bottom-16 right-12', size: 'sm', color: 'bg-gradient-warm', delay: 6 },
      { className: 'top-64 left-2/3', size: 'sm', color: 'bg-primary/50', delay: 7.5 }
    ]
  },
  ocean: {
    particles: { count: 45, colors: ['#06B6D4', '#0891B2', '#0E7490', '#0369A1'] },
    lighting: [
      { position: { x: '20%', y: '25%' }, color: 'rgba(6, 182, 212, 0.3)', size: 400, intensity: 0.6, pulse: true },
      { position: { x: '75%', y: '65%' }, color: 'rgba(8, 145, 178, 0.4)', size: 320, intensity: 0.5 },
      { position: { x: '55%', y: '80%' }, color: 'rgba(14, 116, 144, 0.2)', size: 260, intensity: 0.4, pulse: true }
    ],
    blobs: [
      { className: 'top-20 left-16', size: 'lg', color: 'bg-gradient-primary', delay: 0 },
      { className: 'top-40 right-20', size: 'md', color: 'bg-accent/30', delay: 2 },
      { className: 'bottom-40 left-1/4', size: 'sm', color: 'bg-gradient-secondary', delay: 4 },
      { className: 'top-56 right-1/3', size: 'md', color: 'bg-gradient-rainbow', delay: 6 }
    ]
  },
  forest: {
    particles: { count: 35, colors: ['#10B981', '#059669', '#047857', '#065F46'] },
    lighting: [
      { position: { x: '25%', y: '30%' }, color: 'rgba(16, 185, 129, 0.3)', size: 380, intensity: 0.5, pulse: true },
      { position: { x: '70%', y: '60%' }, color: 'rgba(5, 150, 105, 0.4)', size: 340, intensity: 0.6 },
      { position: { x: '45%', y: '75%' }, color: 'rgba(4, 120, 87, 0.2)', size: 290, intensity: 0.4, pulse: true }
    ],
    blobs: [
      { className: 'top-24 left-20', size: 'lg', color: 'bg-gradient-secondary', delay: 0 },
      { className: 'top-48 right-24', size: 'md', color: 'bg-accent/40', delay: 2.5 },
      { className: 'bottom-48 left-1/3', size: 'sm', color: 'bg-gradient-primary', delay: 5 },
      { className: 'top-72 right-2/3', size: 'sm', color: 'bg-gradient-warm', delay: 7.5 }
    ]
  },
  sunset: {
    particles: { count: 50, colors: ['#F59E0B', '#D97706', '#B45309', '#92400E'] },
    lighting: [
      { position: { x: '30%', y: '35%' }, color: 'rgba(245, 158, 11, 0.3)', size: 420, intensity: 0.6, pulse: true },
      { position: { x: '65%', y: '55%' }, color: 'rgba(217, 119, 6, 0.4)', size: 360, intensity: 0.5 },
      { position: { x: '50%', y: '70%' }, color: 'rgba(180, 83, 9, 0.2)', size: 310, intensity: 0.4, pulse: true }
    ],
    blobs: [
      { className: 'top-28 left-24', size: 'lg', color: 'bg-gradient-warm', delay: 0 },
      { className: 'top-52 right-28', size: 'md', color: 'bg-gradient-secondary', delay: 1.8 },
      { className: 'bottom-52 left-2/5', size: 'sm', color: 'bg-accent/30', delay: 3.6 },
      { className: 'top-80 right-1/4', size: 'sm', color: 'bg-gradient-rainbow', delay: 5.4 }
    ]
  },
  aurora: {
    particles: { count: 55, colors: ['#8B5CF6', '#EC4899', '#06B6D4', '#10B981', '#F59E0B'] },
    lighting: [
      { position: { x: '18%', y: '22%' }, color: 'rgba(139, 92, 246, 0.4)', size: 430, intensity: 0.7, pulse: true },
      { position: { x: '78%', y: '68%' }, color: 'rgba(236, 72, 153, 0.3)', size: 380, intensity: 0.5 },
      { position: { x: '62%', y: '35%' }, color: 'rgba(6, 182, 212, 0.2)', size: 320, intensity: 0.4, pulse: true },
      { position: { x: '35%', y: '78%' }, color: 'rgba(16, 185, 129, 0.3)', size: 270, intensity: 0.5 }
    ],
    blobs: [
      { className: 'top-12 left-8', size: 'lg', color: 'bg-gradient-rainbow', delay: 0 },
      { className: 'top-36 right-12', size: 'md', color: 'bg-gradient-secondary', delay: 1.2 },
      { className: 'bottom-36 left-1/6', size: 'sm', color: 'bg-gradient-primary', delay: 2.4 },
      { className: 'top-60 right-1/2', size: 'md', color: 'bg-accent/40', delay: 3.6 },
      { className: 'bottom-24 right-16', size: 'sm', color: 'bg-gradient-warm', delay: 4.8 },
      { className: 'top-84 left-3/4', size: 'sm', color: 'bg-primary/50', delay: 6 }
    ]
  }
};

const intensities = {
  subtle: { particleOpacity: 0.2, waveOpacity: 0.15, blobOpacity: 0.15 },
  moderate: { particleOpacity: 0.35, waveOpacity: 0.25, blobOpacity: 0.25 },
  intense: { particleOpacity: 0.5, waveOpacity: 0.35, blobOpacity: 0.35 }
};

export function ImmersiveExperience({
  children,
  className,
  theme = 'cosmic',
  intensity = 'moderate',
  interactive = true
}: ImmersiveExperienceProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { playHover, playClick } = useSoundEffects();
  const { light } = useHapticFeedback();

  const currentTheme = themes[theme];
  const currentIntensity = intensities[intensity];

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!interactive) return;

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      // Subtle sound on mouse movement (throttled)
      if (Math.random() > 0.95) {
        playHover();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [interactive, playHover]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={cn('relative overflow-hidden', className)}
      >
        {/* Sistema de partículas */}
        <ParticleBackground
          className={cn('transition-opacity duration-1000', isLoaded ? 'opacity-100' : 'opacity-0')}
          particleCount={currentTheme.particles.count}
          colors={currentTheme.particles.colors}
          speed={0.3}
        />

        {/* Ondas animadas */}
        <WaveBackground
          className={cn('transition-opacity duration-1000 delay-300', isLoaded ? 'opacity-100' : 'opacity-0')}
          waveCount={3}
          colors={currentTheme.particles.colors.map(color => color + '20')}
          amplitude={60}
          speed={0.8}
        />

        {/* Sistema de iluminación dinámica */}
        <LightingScene
          className="absolute inset-0 pointer-events-none"
          lights={currentTheme.lighting}
        >
          <span className="sr-only">Escena de iluminación decorativa</span>
        </LightingScene>

        {/* Efecto spotlight interactivo */}
        {interactive && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.03) 0%, transparent 50%)`
            }}
          />
        )}

        {/* Blobs decorativos flotantes */}
        {currentTheme.blobs.map((blob, index) => (
          <FloatingBlob
            key={index}
            className={cn(blob.className, `opacity-${Math.round(currentIntensity.blobOpacity * 100)}`)}
            size={blob.size as any}
            color={blob.color}
            delay={blob.delay}
          />
        ))}

        {/* Contenido principal */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative z-10"
        >
          {children}
        </motion.div>

        {/* Overlay de vidrio sutil */}
        <div className="absolute inset-0 glass-morphism-advanced pointer-events-none opacity-30" />
      </motion.div>
    </AnimatePresence>
  );
}

// Componente de bienvenida inmersiva
export function ImmersiveWelcome({
  title,
  subtitle,
  actions,
  theme = 'cosmic'
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  theme?: keyof typeof themes;
}) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ImmersiveExperience theme={theme} intensity="intense" className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-4xl mx-auto px-6">
        <AnimatePresence>
          {showContent && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.68, -0.55, 0.265, 1.55] }}
            >
              <AdvancedText
                variant="rainbow"
                size="4xl"
                weight="extrabold"
                className="mb-6 text-3d"
              >
                {title}
              </AdvancedText>

              {subtitle && (
                <TypewriterText
                  texts={[subtitle]}
                  className="text-xl text-muted-foreground mb-8 block h-8"
                  speed={60}
                />
              )}

              {actions && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 2, duration: 0.6 }}
                  className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                >
                  {actions}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ImmersiveExperience>
  );
}
