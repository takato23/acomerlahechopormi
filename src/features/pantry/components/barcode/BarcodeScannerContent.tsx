import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';

interface BarcodeScannerContentProps {
  onDetected: (barcode: string) => void;
}

const BarcodeScannerContent: React.FC<BarcodeScannerContentProps> = ({ onDetected }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    let mounted = true;

    const startScanning = async () => {
      try {
        const videoInputDevices = await codeReader.listVideoInputDevices();
        
        if (!videoInputDevices.length) {
          setError('No se encontraron cámaras disponibles');
          return;
        }

        const selectedDeviceId = videoInputDevices[0].deviceId;

        await codeReader.decodeFromVideoDevice(
          selectedDeviceId,
          videoRef.current!,
          (result, err) => {
            if (!mounted) return;

            if (result?.getText()) {
              onDetected(result.getText());
              codeReader.reset();
            }

            if (err && !err?.message?.includes('NotFoundException')) {
              setError('Error al escanear: ' + err.message);
            }
          }
        );
      } catch (err) {
        if (!mounted) return;
        setError('Error al iniciar el escáner: ' + (err instanceof Error ? err.message : 'Error desconocido'));
      }
    };

    startScanning();

    return () => {
      mounted = false;
      codeReader.reset();
    };
  }, [onDetected]);

  return (
    <div className="relative">
      <video 
        ref={videoRef}
        className="w-full aspect-[4/3] rounded-lg bg-black"
      />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
          <p className="text-white text-center p-4">{error}</p>
        </div>
      )}
      <div className="mt-2 text-sm text-muted-foreground text-center">
        Apunta la cámara al código de barras
      </div>
    </div>
  );
};

export default BarcodeScannerContent;