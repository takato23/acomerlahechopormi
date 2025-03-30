import React, { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/Spinner';
import { User, UploadCloud } from 'lucide-react'; // Iconos
import { uploadAvatar } from '../userService'; // Importar función de subida

interface AvatarUploadProps {
  currentAvatarUrl: string | null | undefined;
  onAvatarUploaded: (newUrl: string) => void; // Callback para actualizar el estado padre
  userId: string; // Necesario para el fallback
}

export function AvatarUpload({ currentAvatarUrl, onAvatarUploaded, userId }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generar iniciales para el fallback
  const getInitials = (id: string) => {
    // Usar las primeras 2 letras del ID o 'U' si no hay ID
    return id ? id.substring(0, 2).toUpperCase() : 'U';
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo y tamaño (opcional pero recomendado)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Tipo de archivo no permitido. Usa JPG, PNG o WEBP.');
      return;
    }
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('El archivo es demasiado grande (máx 5MB).');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const newUrl = await uploadAvatar(file);
      if (newUrl) {
        onAvatarUploaded(newUrl); // Notificar al padre
      } else {
        setError('Error al subir el avatar.');
      }
    } catch (err) {
      console.error("Error uploading avatar:", err);
      setError('Ocurrió un error inesperado.');
    } finally {
      setUploading(false);
      // Limpiar el input para permitir subir el mismo archivo de nuevo si falla
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; 
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <Avatar className="h-24 w-24 ring-2 ring-offset-2 ring-primary/20 ring-offset-background">
        <AvatarImage src={currentAvatarUrl ?? undefined} alt="Avatar de usuario" />
        <AvatarFallback className="bg-muted text-muted-foreground">
          {/* Usar iniciales del ID si no hay URL */}
          {userId ? getInitials(userId) : <User className="h-10 w-10" />} 
        </AvatarFallback>
      </Avatar>

      {/* Input oculto */}
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp"
        onChange={handleFileChange}
        className="hidden"
        disabled={uploading}
      />

      {/* Botón para activar input */}
      <Button 
        variant="outline" 
        size="sm" 
        onClick={triggerFileInput} 
        disabled={uploading}
      >
        {uploading ? (
          <>
            <Spinner size="sm" className="mr-2" /> Subiendo...
          </>
        ) : (
          <>
            <UploadCloud className="mr-2 h-4 w-4" /> Cambiar Avatar
          </>
        )}
      </Button>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">JPG, PNG, WEBP (Máx 5MB)</p>
    </div>
  );
}