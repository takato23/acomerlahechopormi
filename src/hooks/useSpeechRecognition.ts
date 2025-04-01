import { useState, useEffect, useRef, useCallback } from 'react';

interface SpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  error: string | null;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
}

// Nota: Los tipos globales para Web Speech API pueden ser inconsistentes.
// Se eliminan las declaraciones globales conflictivas y se usará 'any' o
// tipos inferidos donde sea posible. Considerar instalar @types si es necesario.


export const useSpeechRecognition = (): SpeechRecognitionHook => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const SpeechRecognitionAPI = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : undefined;
  const isSupported = !!SpeechRecognitionAPI;

  useEffect(() => {
    if (!isSupported) {
      setError('Speech recognition no es soportado por este navegador.');
      return;
    }

    recognitionRef.current = new SpeechRecognitionAPI();
    const recognition = recognitionRef.current;

    recognition.continuous = false; // Detenerse después de la primera frase detectada
    recognition.interimResults = false; // Solo obtener resultados finales
    recognition.lang = 'es-AR'; // Establecer idioma

    recognition.onresult = (event: any) => { // Usar 'any' para el evento
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      console.log('Speech result:', finalTranscript);
      setTranscript(finalTranscript.trim());
      // setIsListening(false); // Se maneja en onend
    };

    recognition.onerror = (event: any) => { // Usar 'any' para el evento
      console.error('Speech recognition error:', event.error, event.message);
      setError(`Error de reconocimiento: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      console.log('Speech recognition ended.');
      setIsListening(false);
    };

     recognition.onstart = () => {
        console.log('Speech recognition started.');
        setIsListening(true);
        setError(null); // Limpiar errores anteriores
        setTranscript(''); // Limpiar transcripción anterior
    };

    // Limpiar al desmontar
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [isSupported, SpeechRecognitionAPI]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (err) {
         console.error("Error starting speech recognition:", err);
         setError("No se pudo iniciar el reconocimiento.");
         setIsListening(false); // Asegurar que el estado es correcto
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  return { isListening, transcript, error, isSupported, startListening, stopListening };
};