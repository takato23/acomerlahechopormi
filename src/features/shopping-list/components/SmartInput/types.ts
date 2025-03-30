import { Suggestion } from '../../types/suggestions';

export interface SmartInputProps {
  /**
   * Valor actual del input
   */
  value: string;

  /**
   * Callback cuando cambia el valor
   */
  onChange: (value: string) => void;

  /**
   * Callback cuando se selecciona una sugerencia
   */
  onSuggestionSelect: (suggestion: Suggestion) => void;

  /**
   * Placeholder del input
   */
  placeholder?: string;

  /**
   * Estado de carga
   */
  loading?: boolean;

  /**
   * Clases CSS adicionales
   */
  className?: string;

  /**
   * Si está deshabilitado
   */
  disabled?: boolean;

  /**
   * Número máximo de sugerencias a mostrar
   */
  maxSuggestions?: number;

  /**
   * Categoría para filtrar sugerencias
   */
  category?: string;

 /**
  * ID opcional para el input
  */
 id?: string;
}

export interface SmartInputState {
  /**
   * Sugerencias actuales
   */
  suggestions: Suggestion[];

  /**
   * Si se están cargando sugerencias
   */
  loading: boolean;

  /**
   * Índice de la sugerencia seleccionada
   */
  selectedIndex: number;

  /**
   * Si el menú de sugerencias está abierto
   */
  isOpen: boolean;
}