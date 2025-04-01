import React, { useState, useEffect, useCallback } from 'react';
import { getUserProfile, updateUserProfile } from './userService';
import type { UserProfile, DietaryPreference, DifficultyPreference } from './userTypes'; 
import { DietaryPreferences } from './components/DietaryPreferences';
import { AvatarUpload } from './components/AvatarUpload'; 
import { DifficultyPreference as DifficultyPreferenceComponent } from './components/DifficultyPreference'; 
import { TimePreference } from './components/TimePreference'; 
import { AllergiesInput } from './components/AllergiesInput'; 
import { useAuth } from '../auth/AuthContext';
import { Spinner } from '@/components/ui/Spinner';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; 
import { Terminal, Save, Key, Trash2, Eye, EyeOff } from 'lucide-react';

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
  const { user } = useAuth();
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

  /** @state {string | null} geminiApiKey - Clave API de Gemini actual del usuario. */
  const [geminiApiKey, setGeminiApiKey] = useState<string | null>(null);
  /** @state {string} newGeminiApiKey - Valor del input para la nueva clave API de Gemini. */
  const [newGeminiApiKey, setNewGeminiApiKey] = useState('');
  /** @state {boolean} showApiKey - Controla si la clave API actual se muestra completa. */
  const [showApiKey, setShowApiKey] = useState(false);
  /** @state {boolean} isSavingApiKey - Indica si se está guardando/eliminando la clave API. */
  const [isSavingApiKey, setIsSavingApiKey] = useState(false);
  /** @state {string | null} apiKeyError - Mensaje de error específico para la gestión de la API Key. */
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  /** @state {string | null} apiKeySuccess - Mensaje de éxito específico para la gestión de la API Key. */
  const [apiKeySuccess, setApiKeySuccess] = useState<string | null>(null);
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
      if (!user?.id) {
        setError("No se pudo identificar al usuario para cargar el perfil.");
        setIsLoading(false);
        return;
      }

      const userProfile = await getUserProfile(user.id);
      if (userProfile) {
        setProfile(userProfile);
        setUsernameInput(userProfile.username || ''); 
        setAvatarUrl(userProfile.avatar_url); 
        setGeminiApiKey(userProfile.gemini_api_key || null); // Cargar la API Key de Gemini
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

      if (!user?.id) {
        setUsernameError("No se pudo identificar al usuario para guardar.");
        setIsSavingUsername(false);
        return;
      }
      const success = await updateUserProfile(user.id, { username: trimmedUsername || null }); 
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

        if (!user?.id) {
          setError("No se pudo identificar al usuario para guardar la preferencia.");
          return false; // Indicate failure
        }
        const success = await updateUserProfile(user.id, updateData);
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

  /**
   * Ofusca una API key mostrando solo los últimos 4 caracteres.
   * @function obfuscateApiKey
   * @param {string | null} key - La clave a ofuscar.
   * @returns {string} La clave ofuscada o un string vacío.
   */
  const obfuscateApiKey = (key: string | null): string => {
    if (!key || key.length <= 4) {
      return '****'; // O un placeholder si es muy corta o no existe
    }
    return `****...${key.slice(-4)}`;
  };

  /**
   * Maneja la actualización de la API Key de Gemini.
   * @function handleUpdateApiKey
   * @async
   */
  const handleUpdateApiKey = async () => {
    if (!user?.id) {
      setApiKeyError("No se pudo identificar al usuario para guardar la clave.");
      return;
    }
    if (!newGeminiApiKey.trim()) {
      setApiKeyError("La clave API no puede estar vacía.");
      return;
    }

    setIsSavingApiKey(true);
    setApiKeyError(null);
    setApiKeySuccess(null);
    setError(null); // Limpiar error general

    try {
      const success = await updateUserProfile(user.id, { gemini_api_key: newGeminiApiKey.trim() });
      if (success) {
        setGeminiApiKey(newGeminiApiKey.trim());
        setNewGeminiApiKey(''); // Limpiar input
        setApiKeySuccess("Clave API de Gemini guardada correctamente.");
        setShowApiKey(false); // Ocultar la clave después de guardar
        setTimeout(() => setApiKeySuccess(null), 4000); // Ocultar mensaje de éxito
      } else {
        setApiKeyError("No se pudo guardar la clave API.");
      }
    } catch (err) {
      console.error("Error updating Gemini API Key:", err);
      setApiKeyError("Ocurrió un error al guardar la clave API.");
    } finally {
      setIsSavingApiKey(false);
    }
  };

  /**
   * Maneja la eliminación de la API Key de Gemini.
   * @function handleDeleteApiKey
   * @async
   */
  const handleDeleteApiKey = async () => {
    // TODO: Añadir confirmación real (ej. un modal)
    if (!window.confirm("¿Estás seguro de que quieres eliminar tu clave API de Gemini?")) {
      return;
    }

    if (!user?.id) {
      setApiKeyError("No se pudo identificar al usuario para eliminar la clave.");
      return;
    }

    setIsSavingApiKey(true);
    setApiKeyError(null);
    setApiKeySuccess(null);
    setError(null); // Limpiar error general

    try {
      const success = await updateUserProfile(user.id, { gemini_api_key: null });
      if (success) {
        setGeminiApiKey(null);
        setNewGeminiApiKey(''); // Limpiar input por si acaso
        setApiKeySuccess("Clave API de Gemini eliminada.");
        setShowApiKey(false);
        setTimeout(() => setApiKeySuccess(null), 4000);
      } else {
        setApiKeyError("No se pudo eliminar la clave API.");
      }
    } catch (err) {
      console.error("Error deleting Gemini API Key:", err);
      setApiKeyError("Ocurrió un error al eliminar la clave API.");
    } finally {
      setIsSavingApiKey(false);
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

         {/* Card para API Key de Gemini */}
         <Card>
           <CardHeader>
             <CardTitle>API Key de Gemini (Opcional)</CardTitle>
           </CardHeader>
           <CardContent className="space-y-4">
             <p className="text-sm text-muted-foreground">
               Opcionalmente, puedes guardar tu propia API Key de Google AI Studio (Gemini) 
               para habilitar funcionalidades avanzadas de IA en la aplicación. 
               Tu clave se almacena de forma segura y solo se usa para interactuar con la API de Gemini en tu nombre.
               {/* TODO: Reemplazar con enlace real a la guía */}
               <a href="#" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                 ¿Cómo obtener una clave?
               </a>
             </p>

             {apiKeySuccess && (
               <Alert>
                 <Terminal className="h-4 w-4" />
                 <AlertTitle>Éxito</AlertTitle>
                 <AlertDescription>{apiKeySuccess}</AlertDescription>
               </Alert>
             )}
             {apiKeyError && (
               <Alert variant="destructive">
                 <Terminal className="h-4 w-4" />
                 <AlertTitle>Error</AlertTitle>
                 <AlertDescription>{apiKeyError}</AlertDescription>
               </Alert>
             )}

             {/* Mostrar Clave Actual (Ofuscada) */}
             {geminiApiKey && (
               <div className="space-y-1">
                 <Label htmlFor="currentApiKey">Clave API Actual</Label>
                 <div className="flex items-center space-x-2">
                   <Input 
                     id="currentApiKey"
                     type={showApiKey ? 'text' : 'password'}
                     readOnly
                     value={showApiKey ? geminiApiKey : obfuscateApiKey(geminiApiKey)}
                     className="flex-grow bg-muted/50"
                   />
                   <Button 
                     variant="outline"
                     size="icon"
                     onClick={() => setShowApiKey(!showApiKey)}
                     aria-label={showApiKey ? "Ocultar clave" : "Mostrar clave"}
                   >
                     {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                   </Button>
                 </div>
               </div>
             )}

             {/* Input para Nueva Clave */}
             <div className="space-y-1">
               <Label htmlFor="newApiKey">{geminiApiKey ? 'Reemplazar Clave API' : 'Ingresar Nueva Clave API'}</Label>
               <Input 
                 id="newApiKey"
                 type="password" 
                 value={newGeminiApiKey}
                 onChange={(e) => {
                   setNewGeminiApiKey(e.target.value);
                   setApiKeyError(null);
                   setApiKeySuccess(null);
                 }}
                 placeholder="Pega tu clave API de Gemini aquí"
                 disabled={isSavingApiKey}
               />
             </div>

           </CardContent>
           <CardFooter className="flex justify-end space-x-2">
             {geminiApiKey && (
                <Button 
                  variant="destructive"
                  onClick={handleDeleteApiKey}
                  disabled={isSavingApiKey}
                  size="sm"
                >
                  {isSavingApiKey ? <Spinner size="sm" className="mr-2" /> : <Trash2 className="mr-2 h-4 w-4" />}
                  Eliminar Clave
                </Button>
             )}
             <Button 
               onClick={handleUpdateApiKey}
               disabled={!newGeminiApiKey.trim() || isSavingApiKey}
               size="sm"
             >
               {isSavingApiKey ? <Spinner size="sm" className="mr-2" /> : <Save className="mr-2 h-4 w-4" />}
               Guardar Clave
             </Button>
           </CardFooter>
         </Card>

        
      </div>
    </div>
  );
}