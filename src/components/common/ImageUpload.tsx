// src/components/common/ImageUpload.tsx
import React, { useState, useCallback, ChangeEvent, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient'; // Asegúrate que la ruta sea correcta
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, UploadCloud, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploadProps {
  bucketName: string; // Nombre del bucket de Supabase Storage
  folderPath?: string; // Carpeta opcional dentro del bucket
  initialImageUrl?: string | null;
  onUploadSuccess: (url: string) => void;
  onUploadError?: (error: Error) => void;
  onRemoveImage?: () => void; // Para manejar la eliminación de la imagen actual
  label?: string;
  disabled?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  bucketName,
  folderPath = '',
  initialImageUrl = null,
  onUploadSuccess,
  onUploadError,
  onRemoveImage,
  label = 'Subir Imagen',
  disabled = false,
}) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialImageUrl);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Sincronizar previewUrl con initialImageUrl si cambia externamente
  useEffect(() => {
    setPreviewUrl(initialImageUrl);
  }, [initialImageUrl]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setUploadError(null); // Limpiar error anterior
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // Límite de 5MB
        setUploadError("El archivo es demasiado grande (máximo 5MB).");
        toast.error("El archivo es demasiado grande (máximo 5MB).");
        setSelectedFile(null);
        setPreviewUrl(initialImageUrl); // Volver al inicial si había uno
        event.target.value = ''; // Reset input
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      // Si se cancela la selección, volver al estado inicial o a la imagen inicial
      setSelectedFile(null);
      setPreviewUrl(initialImageUrl);
    }
     // Resetear el input para permitir seleccionar el mismo archivo de nuevo si se canceló
     event.target.value = '';
  };

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadError(null);

    const fileExt = selectedFile.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;

    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, selectedFile, {
          cacheControl: '3600', // Cache por 1 hora
          upsert: false, // No sobrescribir si ya existe (poco probable con timestamp)
        });

      if (error) {
        throw error;
      }

      // Obtener la URL pública
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      if (!publicUrlData?.publicUrl) {
          throw new Error("No se pudo obtener la URL pública de la imagen.");
      }

      console.log('Imagen subida:', publicUrlData.publicUrl);
      onUploadSuccess(publicUrlData.publicUrl);
      // No necesitamos actualizar previewUrl aquí, se hará a través de initialImageUrl en el componente padre
      setSelectedFile(null); // Limpiar archivo seleccionado después de subir
      toast.success("Imagen subida con éxito.");

    } catch (error: any) {
      console.error('Error subiendo imagen:', error);
      const errorMessage = error.message || 'Error desconocido al subir la imagen.';
      setUploadError(errorMessage);
      toast.error(`Error al subir: ${errorMessage}`);
      if (onUploadError) {
        onUploadError(error);
      }
    } finally {
      setUploading(false);
    }
  }, [selectedFile, bucketName, folderPath, onUploadSuccess, onUploadError]);

  // Subir automáticamente al seleccionar archivo
  useEffect(() => {
    if (selectedFile && previewUrl !== initialImageUrl) { // Solo subir si es un archivo nuevo
      handleUpload();
    }
  }, [selectedFile, previewUrl, initialImageUrl, handleUpload]);


  const handleRemoveImage = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    setUploadError(null);
    // Notificar al padre que la imagen fue removida (para que actualice su estado)
    if (onRemoveImage) {
      onRemoveImage();
    }
    // Resetear el input file por si el usuario quiere volver a subir la misma imagen
    const input = document.getElementById('image-upload') as HTMLInputElement;
    if (input) {
        input.value = '';
    }
    toast.info("Imagen eliminada.");
  };


  return (
    <div className="space-y-2">
      <Label htmlFor="image-upload" className="text-slate-700 font-medium">{label}</Label>
      <div className="flex items-center space-x-4">
        {/* Preview o Placeholder */}
        <div className="relative group shrink-0">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Vista previa"
              className="h-24 w-24 object-cover rounded-lg border border-slate-300 shadow-sm"
            />
          ) : (
            <div className="h-24 w-24 flex items-center justify-center bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 text-slate-400">
              <UploadCloud className="h-10 w-10" />
            </div>
          )}
          {/* Botón de eliminar (solo si hay imagen y no está subiendo) */}
          {previewUrl && !uploading && (
             <Button
               variant="destructive"
               size="icon"
               className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
               onClick={handleRemoveImage}
               disabled={disabled}
               aria-label="Eliminar imagen"
             >
               <XCircle className="h-4 w-4" />
             </Button>
          )}
           {/* Indicador de carga */}
           {uploading && (
             <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
               <Loader2 className="h-6 w-6 text-white animate-spin" />
             </div>
           )}
        </div>

        {/* Input File */}
        <div className="flex-grow">
           <Input
             id="image-upload"
             type="file"
             accept="image/png, image/jpeg, image/webp"
             onChange={handleFileChange}
             disabled={disabled || uploading}
             className={`border-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 ${uploading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
           />
           <p className="text-xs text-slate-500 mt-1">Max 5MB. PNG, JPG, WEBP.</p>
           {uploadError && <p className="text-xs text-red-500 mt-1">{uploadError}</p>}
        </div>
      </div>
    </div>
  );
};

export default ImageUpload;