import React, { useCallback, useRef } from 'react';

// Hook para efectos de sonido
export function useSoundEffects() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playTone = useCallback((frequency: number, duration: number = 200, type: OscillatorType = 'sine') => {
    try {
      const audioContext = initAudio();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = type;

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (error) {
      // Silently fail if audio context is not available
      console.warn('Audio context not available:', error);
    }
  }, [initAudio]);

  const playSuccess = useCallback(() => {
    // Secuencia ascendente para éxito
    playTone(523.25, 150); // C5
    setTimeout(() => playTone(659.25, 150), 100); // E5
    setTimeout(() => playTone(783.99, 200), 200); // G5
  }, [playTone]);

  const playError = useCallback(() => {
    // Secuencia descendente para error
    playTone(392, 200); // G4
    setTimeout(() => playTone(349.23, 200), 100); // F4
    setTimeout(() => playTone(293.66, 300), 200); // D4
  }, [playTone]);

  const playHover = useCallback(() => {
    playTone(800, 50, 'square');
  }, [playTone]);

  const playClick = useCallback(() => {
    playTone(600, 80, 'triangle');
  }, [playTone]);

  const playNotification = useCallback(() => {
    // Patrón de notificación
    playTone(440, 100); // A4
    setTimeout(() => playTone(554.37, 100), 150); // C#5
    setTimeout(() => playTone(659.25, 200), 300); // E5
  }, [playTone]);

  return {
    playSuccess,
    playError,
    playHover,
    playClick,
    playNotification
  };
}

// Componente con efectos de sonido integrados
export function SoundButton({
  children,
  onClick,
  soundType = 'click',
  className,
  ...props
}: {
  children: React.ReactNode;
  onClick?: () => void;
  soundType?: 'click' | 'success' | 'error' | 'notification';
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { playClick, playSuccess, playError, playNotification } = useSoundEffects();

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    switch (soundType) {
      case 'click':
        playClick();
        break;
      case 'success':
        playSuccess();
        break;
      case 'error':
        playError();
        break;
      case 'notification':
        playNotification();
        break;
    }

    // Trigger haptic feedback if available
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }

    onClick?.();
  }, [soundType, playClick, playSuccess, playError, playNotification, onClick]);

  return (
    <button
      className={className}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
}

// Hook para haptic feedback
export function useHapticFeedback() {
  const vibrate = useCallback((pattern: number | number[] = 50) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  const success = useCallback(() => vibrate([50, 50, 50]), [vibrate]);
  const error = useCallback(() => vibrate([100, 50, 100]), [vibrate]);
  const warning = useCallback(() => vibrate([50, 100, 50, 100, 50]), [vibrate]);
  const light = useCallback(() => vibrate(30), [vibrate]);
  const medium = useCallback(() => vibrate(50), [vibrate]);
  const heavy = useCallback(() => vibrate(80), [vibrate]);

  return { vibrate, success, error, warning, light, medium, heavy };
}

// Componente wrapper que añade efectos táctiles y sonoros
export function InteractiveElement({
  children,
  onClick,
  soundEnabled = true,
  hapticEnabled = true,
  className,
  ...props
}: {
  children: React.ReactNode;
  onClick?: () => void;
  soundEnabled?: boolean;
  hapticEnabled?: boolean;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  const { playHover, playClick } = useSoundEffects();
  const { light, medium } = useHapticFeedback();

  const handleMouseEnter = useCallback(() => {
    if (soundEnabled) playHover();
    if (hapticEnabled) light();
  }, [soundEnabled, hapticEnabled, playHover, light]);

  const handleClick = useCallback(() => {
    if (soundEnabled) playClick();
    if (hapticEnabled) medium();
    onClick?.();
  }, [soundEnabled, hapticEnabled, playClick, medium, onClick]);

  return (
    <div
      className={className}
      onMouseEnter={handleMouseEnter}
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
      {...props}
    >
      {children}
    </div>
  );
}
