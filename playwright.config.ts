import { defineConfig, devices } from '@playwright/test';
import { execSync } from 'node:child_process';

function getLocalSupabaseEnv() {
  const output = execSync('supabase status -o env', {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
    env: {
      ...process.env,
      PATH: `${process.cwd()}/node_modules/.bin${process.platform === 'win32' ? ';' : ':'}${process.env.PATH ?? ''}`,
    },
  });
  const values = Object.fromEntries(
    output.split(/\r?\n/).flatMap((line) => {
      const match = line.match(/^([A-Z0-9_]+)=["']?(.*?)["']?$/);
      return match ? [[match[1], match[2]]] : [];
    }),
  );

  const supabaseUrl = values.API_URL ?? 'http://127.0.0.1:44321';
  const publishableKey = values.PUBLISHABLE_KEY ?? values.ANON_KEY;

  if (!values.ANON_KEY || !publishableKey || !values.SERVICE_ROLE_KEY || !values.DB_URL) {
    throw new Error('Local Supabase is unavailable or returned an incomplete environment.');
  }

  return {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: values.ANON_KEY,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKey,
    SUPABASE_SERVICE_ROLE_KEY: values.SERVICE_ROLE_KEY,
    DATABASE_URL: values.DB_URL,
  };
}

const inheritedEnv = Object.fromEntries(
  Object.entries(process.env).filter((entry): entry is [string, string] => entry[1] !== undefined),
);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    env: {
      ...inheritedEnv,
      ...getLocalSupabaseEnv(),
    },
  },
});
