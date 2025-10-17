import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CinematicTransitionProps {
  isActive: boolean;
  children: React.ReactNode;
  type?: 'fade' | 'slide' | 'scale' | 'morph' | 'wipe' | 'ripple';
  direction?: 'up' | 'down' | 'left' | 'right';
  duration?: number;
  delay?: number;
  className?: string;
}

export function CinematicTransition({
  isActive,
  children,
  type = 'fade',
  direction = 'up',
  duration = 0.8,
  delay = 0,
  className
}: CinematicTransitionProps) {
  const getVariants = () => {
    const baseConfig = {
      transition: {
        duration,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94] // easeOutQuart
      }
    };

    switch (type) {
      case 'fade':
        return {
          ...baseConfig,
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 }
        };

      case 'slide':
        const slideDirections = {
          up: { y: 50 },
          down: { y: -50 },
          left: { x: 50 },
          right: { x: -50 }
        };
        return {
          ...baseConfig,
          initial: { ...slideDirections[direction], opacity: 0 },
          animate: { x: 0, y: 0, opacity: 1 },
          exit: { ...slideDirections[direction], opacity: 0 }
        };

      case 'scale':
        return {
          ...baseConfig,
          initial: { scale: 0.8, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          exit: { scale: 0.8, opacity: 0 }
        };

      case 'morph':
        return {
          ...baseConfig,
          initial: {
            scale: 0.5,
            borderRadius: '50%',
            opacity: 0
          },
          animate: {
            scale: 1,
            borderRadius: '12px',
            opacity: 1
          },
          exit: {
            scale: 0.5,
            borderRadius: '50%',
            opacity: 0
          }
        };

      case 'wipe':
        const wipeDirections = {
          up: { clipPath: 'inset(100% 0 0 0)' },
          down: { clipPath: 'inset(0 0 100% 0)' },
          left: { clipPath: 'inset(0 100% 0 0)' },
          right: { clipPath: 'inset(0 0 0 100%)' }
        };
        return {
          ...baseConfig,
          initial: wipeDirections[direction],
          animate: { clipPath: 'inset(0 0 0 0)' },
          exit: wipeDirections[direction]
        };

      case 'ripple':
        return {
          ...baseConfig,
          initial: {
            scale: 0,
            opacity: 1,
            borderRadius: '50%'
          },
          animate: {
            scale: 1,
            opacity: 0,
            borderRadius: '12px'
          },
          exit: {
            scale: 0,
            opacity: 1,
            borderRadius: '50%'
          }
        };

      default:
        return baseConfig;
    }
  };

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className={cn('w-full h-full', className)}
          {...getVariants()}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Componente para transiciones de página completas
export function PageTransition({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Overlay de carga cinematográfica */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="fixed inset-0 z-50 bg-background flex items-center justify-center"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{
              opacity: 0,
              transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }
            }}
          >
            <div className="text-center">
              <motion.div
                className="w-32 h-32 mx-auto mb-8"
                initial={{ scale: 0, rotate: -180 }}
                animate={{
                  scale: 1,
                  rotate: 0,
                  transition: {
                    duration: 1.2,
                    ease: [0.68, -0.55, 0.265, 1.55]
                  }
                }}
              >
                <div className="morphing-blob bg-gradient-primary w-full h-full flex items-center justify-center">
                  <span className="text-4xl">🍳</span>
                </div>
              </motion.div>

              <motion.h2
                className="text-2xl font-bold text-gradient-rainbow"
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: { delay: 0.3, duration: 0.6 }
                }}
              >
                Preparando tu experiencia...
              </motion.h2>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contenido principal */}
      <motion.div
        className={cn('', className)}
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: 1,
          y: 0,
          transition: {
            delay: isLoading ? 0.8 : 0,
            duration: 0.6,
            ease: [0.25, 0.46, 0.45, 0.94]
          }
        }}
      >
        {children}
      </motion.div>
    </>
  );
}

// Componente para efectos de morphing entre elementos
export function MorphTransition({
  isVisible,
  children,
  className
}: {
  isVisible: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={cn('', className)}
          initial={{
            scale: 0.8,
            borderRadius: '50%',
            opacity: 0
          }}
          animate={{
            scale: 1,
            borderRadius: '12px',
            opacity: 1
          }}
          exit={{
            scale: 0.8,
            borderRadius: '50%',
            opacity: 0
          }}
          transition={{
            duration: 0.6,
            ease: [0.68, -0.55, 0.265, 1.55]
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
