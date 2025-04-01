export interface SearchTermRecord {
  term: string; // El término de búsqueda original (con mayúsculas/minúsculas)
  frequency: number; // Cuántas veces se ha buscado/seleccionado
  lastUsed: number; // Timestamp de la última vez que se usó
}