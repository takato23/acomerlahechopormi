import React from 'react';
import { cn } from '@/lib/utils';

interface WaveBackgroundProps {
  className?: string;
  waveCount?: number;
  colors?: string[];
  speed?: number;
  amplitude?: number;
}

export function WaveBackground({
  className,
  waveCount = 3,
  colors = ['rgba(59, 130, 246, 0.1)', 'rgba(139, 92, 246, 0.1)', 'rgba(6, 182, 212, 0.1)'],
  speed = 1,
  amplitude = 50
}: WaveBackgroundProps) {
  return (
    <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
      <svg
        className="absolute bottom-0 left-0 w-full h-full"
        viewBox="0 0 1200 600"
        preserveAspectRatio="none"
      >
        {Array.from({ length: waveCount }).map((_, index) => (
          <path
            key={index}
            d={`M0,${300 + index * 100} Q300,${250 + index * 100 - amplitude * Math.sin(index)} 600,${300 + index * 100} T1200,${350 + index * 100 + amplitude * Math.cos(index)} V600 H0 Z`}
            fill={colors[index % colors.length]}
            className="animate-pulse"
            style={{
              animation: `wave${index + 1} ${10 / speed}s ease-in-out infinite`,
              animationDelay: `${index * 2}s`
            }}
          >
            <animateTransform
              attributeName="transform"
              attributeType="XML"
              type="translate"
              values="0,0;50,0;0,0"
              dur={`${8 / speed}s`}
              repeatCount="indefinite"
            />
          </path>
        ))}
      </svg>
    </div>
  );
}
