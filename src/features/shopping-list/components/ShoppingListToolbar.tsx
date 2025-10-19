import React, { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingListItem } from '@/types/shoppingListTypes';
import {
  CheckCircle2,
  Download,
  Eraser,
  FileDown,
  FileText,
  ListPlus,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShoppingListToolbarProps {
  items: ShoppingListItem[];
  onGeneratePlanning?: () => Promise<void> | void;
  onClearPurchased?: () => Promise<void> | void;
  onClearAll?: () => Promise<void> | void;
  isGenerating?: boolean;
  isClearingPurchased?: boolean;
  isClearingAll?: boolean;
  className?: string;
}

const formatDateSuffix = () => new Date().toISOString().slice(0, 10);

const escapeForCsv = (value: unknown): string => {
  const stringValue = value === null || value === undefined ? '' : String(value);
  if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

const ShoppingListToolbar: React.FC<ShoppingListToolbarProps> = ({
  items,
  onGeneratePlanning,
  onClearPurchased,
  onClearAll,
  isGenerating = false,
  isClearingPurchased = false,
  isClearingAll = false,
  className,
}) => {
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const pendingCount = useMemo(() => items.filter((item) => !item.is_checked).length, [items]);
  const purchasedCount = useMemo(() => items.filter((item) => item.is_checked).length, [items]);

  const handleExportCsv = useCallback(() => {
    if (!items.length) return;

    const headers = ['Ingrediente', 'Cantidad', 'Unidad', 'Categoría', 'Notas', 'Comprado'];
    const rows = items.map((item) => [
      escapeForCsv(item.ingredient_name ?? ''),
      escapeForCsv(item.quantity ?? ''),
      escapeForCsv(item.unit ?? ''),
      escapeForCsv(item.category ?? ''),
      escapeForCsv(item.notes ?? ''),
      escapeForCsv(item.is_checked ? 'Sí' : 'No'),
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `lista-compras-${formatDateSuffix()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [items]);

  const handleExportPdf = useCallback(async () => {
    if (!items.length || isExportingPdf) return;
    setIsExportingPdf(true);

    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      doc.setFontSize(18);
      doc.text('Lista de Compras', 14, 20);
      doc.setFontSize(11);
      doc.text(`Generada el ${new Date().toLocaleString()}`, 14, 28);

      let y = 40;
      const lineHeight = 8;
      items.forEach((item, index) => {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }

        const baseLine = `${index + 1}. ${item.ingredient_name || 'Ítem sin nombre'}`;
        const quantityLine = item.quantity
          ? ` - ${item.quantity}${item.unit ? ` ${item.unit}` : ''}`
          : '';
        const categoryLine = item.category ? ` [${item.category}]` : '';
        const purchasedLine = item.is_checked ? ' ✓' : '';

        doc.text(`${baseLine}${quantityLine}${categoryLine}${purchasedLine}`, 14, y);
        y += lineHeight;

        if (item.notes) {
          doc.setFontSize(9);
          doc.text(`Notas: ${item.notes}`, 18, y);
          doc.setFontSize(11);
          y += lineHeight - 2;
        }
      });

      doc.save(`lista-compras-${formatDateSuffix()}.pdf`);
    } finally {
      setIsExportingPdf(false);
    }
  }, [items, isExportingPdf]);

  const hasItems = items.length > 0;
  const hasPurchased = purchasedCount > 0;

  return (
    <div
      className={cn('flex flex-col gap-3 rounded-lg border bg-card/60 p-4 shadow-sm', className)}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <ListPlus className="h-5 w-5 text-primary" />
            Organización de compras
          </h2>
          <p className="text-sm text-muted-foreground">
            {hasItems
              ? `Pendientes: ${pendingCount} · Completados: ${purchasedCount}`
              : 'Añade productos manualmente o genera la lista desde tu planificación semanal.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onGeneratePlanning && (
            <Button onClick={() => onGeneratePlanning()} disabled={isGenerating} className="gap-2">
              {isGenerating ? <SpinnerIcon /> : <Sparkles className="h-4 w-4" />}
              Generar con planificación
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleExportCsv}
            disabled={!hasItems}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            Exportar CSV
          </Button>
          <Button
            variant="outline"
            onClick={handleExportPdf}
            disabled={!hasItems || isExportingPdf}
            className="gap-2"
          >
            <FileDown className="h-4 w-4" />
            Exportar PDF
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {onClearPurchased && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onClearPurchased()}
            disabled={!hasPurchased || isClearingPurchased}
            className="gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            Limpiar comprados
          </Button>
        )}
        {onClearAll && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onClearAll()}
            disabled={!hasItems || isClearingAll}
            className="gap-2"
          >
            <Eraser className="h-4 w-4" />
            Vaciar lista
          </Button>
        )}
        <Badge variant="secondary" className="ml-auto flex items-center gap-1">
          <Download className="h-3.5 w-3.5" />
          {hasItems ? `${items.length} ítems` : 'Lista vacía'}
        </Badge>
      </div>
    </div>
  );
};

const SpinnerIcon: React.FC = () => (
  <svg
    className="h-4 w-4 animate-spin"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
  </svg>
);

export default ShoppingListToolbar;
