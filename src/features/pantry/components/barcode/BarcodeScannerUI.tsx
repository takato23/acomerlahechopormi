import React from 'react';
import { Button } from '@/components/ui/button';
import { ScanLine } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Spinner } from '@/components/ui/Spinner';

interface BarcodeScannerUIProps {
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onOpen: () => void;
  children?: React.ReactNode;
}

const BarcodeScannerUI: React.FC<BarcodeScannerUIProps> = ({
  isOpen,
  isLoading,
  onClose,
  onOpen,
  children,
}) => {
  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={onOpen}
        disabled={isLoading}
        className="h-10 w-10"
        aria-label="Escanear código de barras"
      >
        <ScanLine className="h-4 w-4" />
      </Button>

      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Escanear código de barras</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            {children || (
              <div className="flex justify-center items-center h-64">
                <Spinner size="lg" />
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default BarcodeScannerUI;