import React from 'react';
import { useSettings, FontSize } from '../../context/SettingsContext';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';

/**
 * Componente para seleccionar el tamaño de fuente preferido por el usuario.
 * Utiliza un RadioGroup para presentar las opciones disponibles.
 */
export const FontSizeSelector: React.FC = () => {
  // Obtiene el estado actual del tamaño de fuente y la función para actualizarlo desde el contexto.
  // Obtiene el objeto 'settings' (que contiene fontSize) y la función 'setFontSize' del contexto.
  const { settings, setFontSize } = useSettings();
  // Extrae fontSize del objeto settings para usarlo directamente.
  const { fontSize } = settings;

  /**
   * Manejador para el cambio de valor en el RadioGroup.
   * Actualiza el estado global del tamaño de fuente.
   * @param {string} value - El nuevo valor seleccionado ('normal', 'large', 'extra-large').
   */
  const handleValueChange = (value: string) => {
    // Asegura que el valor pasado a setFontSize sea del tipo FontSize.
    setFontSize(value as FontSize);
  };

  return (
    <div className="space-y-2">
      <h4 className="font-medium">Tamaño de Fuente</h4>
      <RadioGroup
        value={fontSize} // El valor actual del RadioGroup está vinculado al estado global.
        onValueChange={handleValueChange} // Llama a handleValueChange cuando se selecciona una opción.
        className="flex items-center space-x-4" // Estilo para disposición horizontal.
      >
        {/* Opción Normal */}
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="normal" id="fs-normal" />
          <Label htmlFor="fs-normal">Normal</Label>
        </div>
        {/* Opción Grande */}
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="large" id="fs-large" />
          <Label htmlFor="fs-large">Grande</Label>
        </div>
        {/* Opción Extra Grande */}
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="extra-large" id="fs-extra-large" />
          <Label htmlFor="fs-extra-large">Extra Grande</Label>
        </div>
      </RadioGroup>
    </div>
  );
};