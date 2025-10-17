import type {
  AuthError,
  PostgrestError,
  PostgrestMaybeSingleResponse,
  PostgrestResponse,
  PostgrestSingleResponse,
  SupabaseClient,
  User,
} from '@supabase/supabase-js';

import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/lib/database.types';

export type PostgrestResult<T> =
  | PostgrestResponse<T>
  | PostgrestSingleResponse<T>
  | PostgrestMaybeSingleResponse<T>;

interface RunOptions<T> {
  fallback?: T;
}

const AUTH_ERROR_CODES = new Set(['401', '403', 'PGRST301', '42501']);

export class SupabaseRepository {
  private readonly client: SupabaseClient<Database>;

  constructor(client: SupabaseClient<Database>) {
    this.client = client;
  }

  getClient(): SupabaseClient<Database> {
    return this.client;
  }

  async run<T>(operation: () => Promise<PostgrestResult<T>>, options?: RunOptions<T>): Promise<T> {
    const execute = async (): Promise<T> => {
      const response = await operation();

      if ('error' in response && response.error) {
        throw response.error;
      }

      if ('data' in response) {
        const data = response.data;

        if (typeof data === 'undefined') {
          throw new Error('Supabase query returned an undefined payload.');
        }

        if (data === null) {
          if (options && 'fallback' in options) {
            return options.fallback as T;
          }

          return data as T;
        }

        return data;
      }

      throw new Error('Unsupported Supabase response.');
    };

    try {
      return await execute();
    } catch (error) {
      if (await this.tryRefreshSession(error)) {
        return execute();
      }

      throw this.normalizeError(error);
    }
  }

  async getCurrentUser(): Promise<User | null> {
    const fetchUser = async () => {
      const { data, error } = await this.client.auth.getUser();
      if (error) throw error;
      return data?.user ?? null;
    };

    try {
      return await fetchUser();
    } catch (error) {
      if (await this.tryRefreshSession(error)) {
        return fetchUser();
      }

      throw this.normalizeError(error);
    }
  }

  private async tryRefreshSession(error: unknown): Promise<boolean> {
    if (!this.shouldRefresh(error)) {
      return false;
    }

    const { error: refreshError } = await this.client.auth.refreshSession();

    if (refreshError) {
      console.warn('[SupabaseRepository] Token refresh failed:', refreshError);
      return false;
    }

    return true;
  }

  private shouldRefresh(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const maybePostgrest = error as Partial<PostgrestError>;
    if (maybePostgrest.code && AUTH_ERROR_CODES.has(maybePostgrest.code)) {
      return true;
    }

    if (typeof maybePostgrest.status === 'number' && AUTH_ERROR_CODES.has(String(maybePostgrest.status))) {
      return true;
    }

    const maybeAuthError = error as Partial<AuthError>;
    if (typeof maybeAuthError.status === 'number' && AUTH_ERROR_CODES.has(String(maybeAuthError.status))) {
      return true;
    }

    return false;
  }

  private normalizeError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }

    if (error && typeof error === 'object' && 'message' in error) {
      const message = String((error as { message: unknown }).message);
      return new Error(message, { cause: error });
    }

    return new Error('Unexpected Supabase error.', { cause: error });
  }
}

export const supabaseRepository = new SupabaseRepository(supabase as SupabaseClient<Database>);
