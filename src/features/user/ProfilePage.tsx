import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';

import { useAuth } from '../auth/AuthContext';
import { useUserStore } from '@/stores/userStore';
import { DietaryPreferences } from './components/DietaryPreferences';
import { AllergiesInput } from './components/AllergiesInput';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/Spinner';
import type { UserProfile } from './userTypes';

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const profile = useUserStore((state) => state.profile);
  const hydrateFromSupabase = useUserStore((state) => state.hydrateFromSupabase);
  const updateProfile = useUserStore((state) => state.updateProfile);
  const storeError = useUserStore((state) => state.error);
  const isHydrating = useUserStore((state) => state.isHydrating);

  useEffect(() => {
    if (user?.id) {
      hydrateFromSupabase();
    }
  }, [user?.id, hydrateFromSupabase]);

  const handleDietaryPreference = useCallback(
    async (preference: UserProfile['dietary_preference'] | null | undefined) => {
      try {
        await updateProfile({ dietary_preference: preference ?? null });
        toast.success('Preferencia dietética actualizada.');
        return true;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'No se pudo actualizar la preferencia dietética.';
        toast.error(message);
        return false;
      }
    },
    [updateProfile],
  );

  const handleAllergiesUpdate = useCallback(
    async (value: string | null) => {
      try {
        await updateProfile({ allergies_restrictions: value });
        toast.success('Restricciones actualizadas.');
        return true;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'No se pudieron guardar las restricciones.';
        toast.error(message);
        return false;
      }
    },
    [updateProfile],
  );

  const isLoading = authLoading || isHydrating;

  const profileEmail = user?.email ?? '';

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <Alert>
          <AlertDescription>
            Inicia sesión para gestionar las preferencias de tu perfil.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Información de tu cuenta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Correo:</span> {profileEmail}
          </p>
          <p>
            <span className="font-medium text-foreground">Nombre visible:</span>{' '}
            {profile?.username || 'No configurado'}
          </p>
        </CardContent>
      </Card>

      {storeError ? (
        <Alert variant="destructive">
          <AlertDescription>{storeError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <DietaryPreferences
          currentPreference={profile?.dietary_preference}
          onUpdatePreference={handleDietaryPreference}
        />
        <AllergiesInput
          currentValue={profile?.allergies_restrictions ?? ''}
          onUpdateValue={handleAllergiesUpdate}
        />
      </div>
    </div>
  );
}
