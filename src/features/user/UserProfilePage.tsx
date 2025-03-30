import React, { useState, useEffect, useCallback } from 'react';
import { getUserProfile, updateUserProfile } from './userService';
import type { UserProfile, DietaryPreference, DifficultyPreference } from './userTypes'; 
import { DietaryPreferences } from './components/DietaryPreferences';
import { AvatarUpload } from './components/AvatarUpload'; 
import { DifficultyPreference as DifficultyPreferenceComponent } from './components/DifficultyPreference'; 
import { TimePreference } from './components/TimePreference'; 
import { AllergiesInput } from './components/AllergiesInput'; 
import { Spinner } from '@/components/ui/Spinner';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; 
import { Terminal, Save } from 'lucide-react'; 
import { Label } from '@/components/ui/label'; 
import { Input } from '@/components/ui/input'; 
import { Button } from '@/components/ui/button'; 
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'; 

/**
 * Página para que el usuario vea y edite su perfil.
 * Muestra información básica, avatar, preferencias dietéticas, de dificultad, tiempo y alergias.
 * @component
 */
export function UserProfilePage() {
  /** @state {UserProfile | null} profile - Datos del perfil del usuario cargados. */
  const [profile, setProfile] = useState<UserProfile | null>(null);
  /** @state {boolean} isLoading - Indica si se están cargando los datos iniciales del perfil. */
  const [isLoading, setIsLoading] = useState(true);
  /** @state {string | null} error - Mensaje de error general de la página. */
  const [error, setError] = useState<string | null>(null);
  
  /** @state {string} usernameInput - Valor actual del input de nombre de usuario. */
  const [usernameInput, setUsernameInput] = useState('');
  /** @state {boolean} isSavingUsername - Indica si se está guardando el nombre de usuario. */
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  /** @state {string | null} usernameError - Mensaje de error específico para el guardado del username. */
  const [usernameError, setUsernameError] = useState<string | null>(null);
  /** @state {boolean} usernameSuccess - Indica si el username se guardó correctamente (para feedback). */
  const [usernameSuccess, setUsernameSuccess] = useState(false);

  /** @state {string | null | undefined} avatarUrl - URL actual del avatar del usuario. */
  const [avatarUrl, setAvatarUrl] = useState<string | null | undefined>(undefined);

  /**
   * Carga el perfil del usuario al montar el componente.
   * @function loadProfile
   * @async
   */
  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setUsernameError(null); 
    setUsernameSuccess(false);
    try {
      const userProfile = await getUserProfile();
      if (userProfile) {
        setProfile(userProfile);
        setUsernameInput(userProfile.username || ''); 
        setAvatarUrl(userProfile.avatar_url); 
      } else {
        setError("No se pudo cargar el perfil."); 
      }
    } catch (err) {
      console.error("Error loading profile in page:", err);
      setError("Ocurrió un error al cargar tu perfil.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  /**
   * Maneja la actualización del nombre de usuario.
   * @function handleUpdateUsername
   * @async
   */
  const handleUpdateUsername = async () => {
    if (!profile) return; 

    setIsSavingUsername(true);
    setUsernameError(null);
    setUsernameSuccess(false);
    setError(null); 

    try {
      const trimmedUsername = usernameInput.trim();
      if (trimmedUsername.length > 0 && trimmedUsername.length < 3) {
         setUsernameError("El nombre de usuario debe tener al menos 3 caracteres.");
         setIsSavingUsername(false);
         return;
      }

      const success = await updateUserProfile({ username: trimmedUsername || null }); 
      if (success) {
        setProfile({ ...profile, username: trimmedUsername || null });
        setUsernameSuccess(true);
        setTimeout(() => setUsernameSuccess(false), 3000);
      } else {
        setUsernameError("No se pudo guardar el nombre de usuario.");
      }
    } catch (err) {
      console.error("Error updating username in page:", err);
      setUsernameError("Ocurrió un error al guardar el nombre de usuario.");
    } finally {
      setIsSavingUsername(false);
    }
  };

  /**
   * Maneja la actualización de preferencias simples (dietética, dificultad, tiempo) y alergias.
   * @function handleUpdateSimplePreference
   * @async
   * @param {Partial<Pick<UserProfile, 'dietary_preference' | 'difficulty_preference' | 'max_prep_time' | 'allergies_restrictions'>>} updateData - Objeto con el campo a actualizar.
   * @returns {Promise<boolean>} `true` si la actualización fue exitosa, `false` si no.
   */
  const handleUpdateSimplePreference = useCallback(
    async (
      updateData: Partial<Pick<UserProfile, 'dietary_preference' | 'difficulty_preference' | 'max_prep_time' | 'allergies_restrictions'>> 
    ): Promise<boolean> => {
      setError(null); 
      setUsernameError(null); 
      setUsernameSuccess(false);
      try {
        if (updateData.max_prep_time !== undefined && typeof updateData.max_prep_time !== 'number' && updateData.max_prep_time !== null) {
           console.warn("Invalid type for max_prep_time, setting to null");
           updateData.max_prep_time = null; 
        }
        if (updateData.allergies_restrictions !== undefined && updateData.allergies_restrictions?.trim() === '') {
            updateData.allergies_restrictions = null;
        }

        const success = await updateUserProfile(updateData);
        if (success && profile) {
          setProfile({ ...profile, ...updateData }); 
          return true;
        } else {
          // El error se mostrará en el componente hijo que llamó a esta función
          return false;
        }
      } catch (err) {
        console.error("Error updating preference/info in page:", err);
        setError("Ocurrió un error al guardar la información.");
        return false;
      }
  }, [profile]); 

  /**
   * Callback llamado por AvatarUpload cuando se sube un nuevo avatar.
   * Actualiza el estado local del avatar y del perfil.
   * @function handleAvatarUpdate
   * @param {string} newUrl - La nueva URL pública del avatar.
   */
  const handleAvatarUpdate = (newUrl: string) => {
    setAvatarUrl(newUrl);
    if (profile) {
      setProfile({ ...profile, avatar_url: newUrl }); 
    }
  };

  // Renderizado condicional de carga y error inicial
  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
  }
  
  if (error && !profile) { 
     return (
       <Alert variant="destructive" className="max-w-md mx-auto mt-8">
         <Terminal className="h-4 w-4" />
         <AlertTitle>Error</AlertTitle>
         <AlertDescription>{error}</AlertDescription>
       </Alert>
     );
  }
  
  if (!profile) {
     return <p className="text-center mt-8">Perfil no disponible.</p>;
  }

  /** @constant {boolean} usernameHasChanged - Indica si el valor del input de username difiere del valor guardado. */
  const usernameHasChanged = profile.username !== (usernameInput.trim() || null);

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Tu Perfil</h1>
      
      {/* Mostrar error general si existe y no hay error específico de username */}
      {error && !usernameError && ( 
         <Alert variant="destructive" className="mb-6">
           <Terminal className="h-4 w-4" />
           <AlertTitle>Error General</AlertTitle>
           <AlertDescription>{error}</AlertDescription>
         </Alert>
       )}

      <div className="space-y-6">
        {/* Sección Avatar */}
         <Card>
           <CardHeader>
             <CardTitle>Avatar</CardTitle>
           </CardHeader>
           <CardContent>
             <AvatarUpload 
               currentAvatarUrl={avatarUrl} 
               onAvatarUploaded={handleAvatarUpdate}
               userId={profile.id} 
             />
           </CardContent>
         </Card>

        {/* Card para Información Básica */}
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Email */}
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <div 
                id="email" 
                className="text-sm text-muted-foreground p-2 border rounded-md bg-muted/50"
              >
                {profile.email || 'No disponible'}
              </div>
            </div>
            {/* Username */}
            <div className="space-y-1">
              <Label htmlFor="username">Nombre de Usuario</Label>
              <Input 
                id="username"
                value={usernameInput}
                onChange={(e) => {
                  setUsernameInput(e.target.value);
                  setUsernameError(null); 
                  setUsernameSuccess(false);
                }}
                placeholder="Tu nombre público (opcional)"
                disabled={isSavingUsername}
              />
               {usernameError && <p className="text-sm text-destructive pt-1">{usernameError}</p>}
               {usernameSuccess && <p className="text-sm text-green-600 pt-1">Nombre de usuario guardado.</p>}
            </div>
          </CardContent>
           <CardFooter>
             <Button 
               onClick={handleUpdateUsername} 
               disabled={!usernameHasChanged || isSavingUsername}
               size="sm"
               className="ml-auto" 
             >
               {isSavingUsername ? <Spinner size="sm" className="mr-2" /> : <Save className="mr-2 h-4 w-4" />}
               Guardar Usuario
             </Button>
           </CardFooter>
        </Card>

        {/* Card para Preferencia Dietética */}
        <DietaryPreferences 
          currentPreference={profile.dietary_preference} 
          onUpdatePreference={(pref) => handleUpdateSimplePreference({ dietary_preference: pref })} 
        />

         {/* Card para Preferencia de Dificultad */}
         <DifficultyPreferenceComponent
           currentPreference={profile.difficulty_preference}
           onUpdatePreference={(pref) => handleUpdateSimplePreference({ difficulty_preference: pref })}
         />

         {/* Card para Preferencia de Tiempo */}
         <TimePreference
            currentTime={profile.max_prep_time}
            onUpdateTime={(time) => handleUpdateSimplePreference({ max_prep_time: time })}
         />

         {/* Card para Alergias/Restricciones */}
         <AllergiesInput
            currentValue={profile.allergies_restrictions}
            onUpdateValue={(value) => handleUpdateSimplePreference({ allergies_restrictions: value })}
         />
        
      </div>
    </div>
  );
}