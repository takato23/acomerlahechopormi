import React from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  isLoading?: boolean;
}

export function SearchInput({ value, onChange, isLoading = false }: SearchInputProps) {
  // TODO: Implementar input de búsqueda con debounce y estado
  return (
    <div className="relative">
      <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input 
        type="search" 
        placeholder="Buscar productos y precios..."
        className="pl-8"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={isLoading}
      />
    </div>
  );
}