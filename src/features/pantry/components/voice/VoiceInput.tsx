import React from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

interface VoiceInputProps {
  isLoading: boolean;
  isProcessingVoice: boolean;
  onTranscriptReceived: (transcript: string) => void;
}

const VoiceInput: React.FC<VoiceInputProps> = ({
  isLoading,
  isProcessingVoice,
  onTranscriptReceived,
}) => {
  const {
    isListening,
    transcript,
    error: speechError,
    isSupported: speechIsSupported,
    startListening,
    stopListening,
  } = useSpeechRecognition();

  // Referencia para rastrear si ya procesamos esta transcripción
  const processedTranscriptRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!isListening && transcript && transcript !== processedTranscriptRef.current) {
      processedTranscriptRef.current = transcript;
      onTranscriptReceived(transcript);
    }
  }, [transcript, isListening, onTranscriptReceived]);

  // Limpiar la referencia cuando se inicia una nueva escucha
  React.useEffect(() => {
    if (isListening) {
      processedTranscriptRef.current = null;
    }
  }, [isListening]);

  console.log('VoiceInput - speechIsSupported:', speechIsSupported); // Log temporal
  if (!speechIsSupported) {
    return null;
  }

  return (
    <Button
      variant={isListening ? "destructive" : "outline"}
      size="icon"
      onClick={isListening ? stopListening : startListening}
      disabled={isLoading}
      className={`h-10 w-10 ${isListening ? 'animate-pulse' : ''}`}
      aria-label={isListening ? "Detener dictado" : "Iniciar dictado"}
    >
      {isListening ? (
        <MicOff className="h-4 w-4" />
      ) : isProcessingVoice ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
};

export default VoiceInput;