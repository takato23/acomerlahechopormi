/**
 * Representa una categoría de ingredientes.
 * Utilizada para organizar ingredientes en la despensa, listas de compras, etc.
 */
export interface Category {
  id: string; // ID único de la categoría (TEXT en la base de datos)
  name: string; // Nombre de la categoría (ej. "Lácteos", "Frutas", "Carnes")
  icon?: string | null; // Nombre o identificador del icono asociado (opcional)
  color?: string | null; // Color asociado a la categoría (ej. código hexadecimal) (opcional)
}