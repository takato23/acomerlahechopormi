import React, { lazy, Suspense, useState } from 'react';
import BarcodeScannerUI from './BarcodeScannerUI';

// Cargar el contenido del escáner de manera lazy
const BarcodeScannerContent = lazy(() => import('./BarcodeScannerContent'));

interface BarcodeScannerProps {
  isLoading: boolean;
  onBarcodeDetected: (barcode: string) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  isLoading,
  onBarcodeDetected,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleOpen = () => {
    setIsOpen(true);
  };

  return (
    <BarcodeScannerUI
      isOpen={isOpen}
      isLoading={isLoading}
      onClose={handleClose}
      onOpen={handleOpen}
    >
      {isOpen && (
        <Suspense fallback={null}>
          <BarcodeScannerContent onDetected={onBarcodeDetected} />
        </Suspense>
      )}
    </BarcodeScannerUI>
  );
};

export default BarcodeScanner;