import React, { useState, useEffect, useCallback } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EquipmentCheckboxesProps {
  label: string;
  currentEquipment?: string[] | null;
  onUpdateEquipment: (newEquipment: string[]) => Promise<boolean>;
  className?: string;
}

// Lista de equipamiento común predefinido
const COMMON_EQUIPMENT = [
  'Horno',
  'Microondas',
  'Air Fryer',
  'Licuadora',
  'Procesadora de alimentos',
  'Olla de cocción lenta',
  'Batidora de mano',
  'Batidora de pie',
];

const OTHER_EQUIPMENT_KEY = 'Otro'; // Clave especial para el checkbox "Otro"

export function EquipmentCheckboxes({
  label,
  currentEquipment,
  onUpdateEquipment,
  className,
}: EquipmentCheckboxesProps) {
  const [selectedEquipment, setSelectedEquipment] = useState<Set<string>>(new Set());
  const [otherValue, setOtherValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sincronizar estado interno con props
  useEffect(() => {
    const initialSet = new Set<string>();
    let initialOther = '';
    (currentEquipment || []).forEach(item => {
      if (COMMON_EQUIPMENT.includes(item)) {
        initialSet.add(item);
      } else if (item) { // Si no es común y no está vacío, es "Otro"
        initialSet.add(OTHER_EQUIPMENT_KEY); // Marcar el checkbox "Otro"
        initialOther = item; // Guardar el valor específico
      }
    });
    setSelectedEquipment(initialSet);
    setOtherValue(initialOther);
  }, [currentEquipment]);

  const handleUpdate = useCallback(async (newSet: Set<string>, newOtherValue: string) => {
    const finalEquipmentList: string[] = [];
    newSet.forEach(item => {
      if (item !== OTHER_EQUIPMENT_KEY) {
        finalEquipmentList.push(item);
      }
    });
    if (newSet.has(OTHER_EQUIPMENT_KEY) && newOtherValue.trim()) {
      finalEquipmentList.push(newOtherValue.trim());
    }

    setIsSaving(true);
    setError(null);
    try {
      const success = await onUpdateEquipment(finalEquipmentList);
      if (success) {
        // El estado interno se actualiza a través del useEffect cuando currentEquipment cambie
      } else {
        setError("Error al guardar el equipamiento.");
        // Revertir cambios visuales si falla? Podría ser complejo, mejor mostrar error.
      }
    } catch (err) {
      console.error("Error updating equipment:", err);
      setError("Error inesperado al guardar.");
    } finally {
      setIsSaving(false);
    }
  }, [onUpdateEquipment]);

  const handleCheckboxChange = (item: string, checked: boolean) => {
    const newSet = new Set(selectedEquipment);
    if (checked) {
      newSet.add(item);
    } else {
      newSet.delete(item);
    }
    setSelectedEquipment(newSet);
    // Si desmarcamos "Otro", limpiamos su valor
    const newOther = item === OTHER_EQUIPMENT_KEY && !checked ? '' : otherValue;
    setOtherValue(newOther);
    handleUpdate(newSet, newOther);
  };

  const handleOtherInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setOtherValue(newValue);
    // Solo llamamos a update si el checkbox "Otro" está marcado
    if (selectedEquipment.has(OTHER_EQUIPMENT_KEY)) {
      handleUpdate(selectedEquipment, newValue);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <Label className="text-slate-700 font-medium">{label}</Label>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {COMMON_EQUIPMENT.map((item) => (
          <div key={item} className="flex items-center space-x-2">
            <Checkbox
              id={`equip-${item}`}
              checked={selectedEquipment.has(item)}
              onCheckedChange={(checked) => handleCheckboxChange(item, !!checked)}
              disabled={isSaving}
            />
            <Label htmlFor={`equip-${item}`} className="text-sm font-normal text-slate-700">
              {item}
            </Label>
          </div>
        ))}
        {/* Checkbox y Input para "Otro" */}
        <div className="flex items-center space-x-2 col-span-2">
           <Checkbox
             id={`equip-${OTHER_EQUIPMENT_KEY}`}
             checked={selectedEquipment.has(OTHER_EQUIPMENT_KEY)}
             onCheckedChange={(checked) => handleCheckboxChange(OTHER_EQUIPMENT_KEY, !!checked)}
             disabled={isSaving}
           />
           <Label htmlFor={`equip-${OTHER_EQUIPMENT_KEY}`} className="text-sm font-normal text-slate-700">
             {OTHER_EQUIPMENT_KEY}:
           </Label>
           <Input
             type="text"
             value={otherValue}
             onChange={handleOtherInputChange}
             placeholder="Especifica otro equipamiento"
             disabled={!selectedEquipment.has(OTHER_EQUIPMENT_KEY) || isSaving}
             className={cn(
               "h-8 text-sm flex-1",
               !selectedEquipment.has(OTHER_EQUIPMENT_KEY) && "bg-slate-100"
             )}
           />
        </div>
      </div>
      {isSaving && <Loader2 className="h-4 w-4 animate-spin text-slate-500 mt-2" />}
      {error && <p className="text-sm text-destructive pt-1">{error}</p>}
    </div>
  );
}