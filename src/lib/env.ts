import { z } from 'zod';

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  DATABASE_URL: z.string().url().optional(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

export type ServerEnv = z.infer<typeof serverSchema> & z.infer<typeof clientSchema>;
export type ClientEnv = z.infer<typeof clientSchema>;

const publicProcessEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  // Keep the legacy anon variable compatible with the publishable-key setup.
  // The app's SSR/browser clients already use NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.
  NEXT_PUBLIC_SUPABASE_ANON_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
};

const parsePublicEnv = (): ClientEnv => {
  const parsed = clientSchema.safeParse(publicProcessEnv);

  if (!parsed.success) {
    console.error(
      'Invalid client environment variables:',
      parsed.error.flatten().fieldErrors
    );
    throw new Error('Invalid client environment variables');
  }

  return parsed.data;
};

export const getClientEnv = (): ClientEnv => parsePublicEnv();

export const getServerEnv = (): ServerEnv => {
  const parsed = serverSchema.merge(clientSchema).safeParse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    ...publicProcessEnv,
  });

  if (!parsed.success) {
    console.error(
      'Invalid server environment variables:',
      parsed.error.flatten().fieldErrors
    );
    throw new Error('Invalid server environment variables');
  }

  return parsed.data;
};
