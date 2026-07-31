import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { getServerEnv } from '../env';
import { Database } from '../../types/database';

/**
 * Server-only Supabase client with Service Role Key.
 * Bypasses RLS. NEVER use this to pass data directly to the client without validation.
 */
export const createAdminClient = () => {
  const env = getServerEnv();

  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};
