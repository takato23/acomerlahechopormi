import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import BarcodeScannerComponent from 'react-qr-barcode-scanner'; // Importar el componente

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDetected: (barcode: string) => void;
}

export function BarcodeScannerModal({ isOpen, onClose, onDetected }: BarcodeScannerModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const handleUpdate = (err: any, result: any) => {
    if (result && result.text !== lastResult) {
      setLastResult(result.text); // Evitar detecciones múltiples rápidas
      setError(null);
      console.log('Barcode detected:', result.text);
      onDetected(result.text);
      onClose(); // Cerrar modal al detectar
    } else if (err) {
      // Ignorar errores comunes como 'video not playing' que ocurren a veces
      if (err.message && !err.message.includes('video')) {
         console.error('Barcode scanner error:', err);
         setError('Error al acceder a la cámara o escanear.');
      }
    }
  };

  // Resetear estado al cerrar/abrir
  React.useEffect(() => {
      if (!isOpen) {
          setLastResult(null);
          setError(null);
      }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Escanear Código de Barras</DialogTitle>
          <DialogDescription>
            Apunta la cámara al código de barras del producto.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {/* Contenedor para el escáner */}
          <div style={{ width: '100%', maxWidth: '400px', margin: 'auto' }}>
            <BarcodeScannerComponent
              width={400} // Ajustar según necesidad
              height={300} // Ajustar según necesidad
              onUpdate={handleUpdate}
              // delay={100} // Opcional: delay entre escaneos
              facingMode="environment" // Usar cámara trasera por defecto
            />
          </div>
          {error && <p className="text-sm text-destructive mt-2 text-center">{error}</p>}
          {/* {lastResult && <p className="text-sm text-muted-foreground mt-2 text-center">Último detectado: {lastResult}</p>} */}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}