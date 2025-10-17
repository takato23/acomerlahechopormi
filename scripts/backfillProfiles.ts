import { createClient } from '@supabase/supabase-js';

type ProfileRecord = {
  id: string;
  cuisine_preferences: string[] | null;
  preferred_meal_times: Record<string, string> | null;
  max_calories: number | null;
  household_size: number | null;
  onboarding_completed_at: string | null;
  objectives: Record<string, unknown> | null;
};

const DEFAULT_MEAL_TIMES = {
  breakfast: '08:00',
  lunch: '13:00',
  dinner: '20:00'
};

const DEFAULT_OBJECTIVES = {
  primaryGoal: null,
  weeklySavingsTarget: null,
  calorieTarget: null
};

function assertEnv(variable: string | undefined, name: string): string {
  if (!variable) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return variable;
}

async function main() {
  const supabaseUrl = assertEnv(process.env.SUPABASE_URL, 'SUPABASE_URL');
  const serviceRoleKey = assertEnv(process.env.SUPABASE_SERVICE_ROLE_KEY, 'SUPABASE_SERVICE_ROLE_KEY');

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select(
      'id, cuisine_preferences, preferred_meal_times, max_calories, household_size, onboarding_completed_at, objectives'
    );

  if (error) {
    throw new Error(`Failed to fetch profiles: ${error.message}`);
  }

  if (!profiles || profiles.length === 0) {
    console.info('No profiles found to backfill.');
    return;
  }

  let updated = 0;
  for (const profile of profiles as ProfileRecord[]) {
    const update: Partial<ProfileRecord> = {};

    if (!Array.isArray(profile.cuisine_preferences)) {
      update.cuisine_preferences = [];
    }

    if (!profile.preferred_meal_times || Object.keys(profile.preferred_meal_times).length === 0) {
      update.preferred_meal_times = DEFAULT_MEAL_TIMES;
    }

    if (profile.household_size == null || profile.household_size < 1) {
      update.household_size = 1;
    }

    if (!profile.objectives || Object.keys(profile.objectives).length === 0) {
      update.objectives = DEFAULT_OBJECTIVES;
    }

    if (Object.keys(update).length === 0) {
      continue;
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(update)
      .eq('id', profile.id);

    if (updateError) {
      throw new Error(`Failed to update profile ${profile.id}: ${updateError.message}`);
    }

    updated += 1;
  }

  console.info(`Backfill complete. Updated ${updated} profile(s).`);
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
