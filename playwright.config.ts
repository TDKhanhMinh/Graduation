import { defineConfig, devices } from '@playwright/test';
import { execSync } from 'node:child_process';
import path from 'node:path';

function getLocalSupabaseEnv() {
  const supabaseCommand = path.join(
    process.cwd(),
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'supabase.cmd' : 'supabase',
  )
  let output = ''
  let lastError: unknown

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      output = execSync(`"${supabaseCommand}" status -o env`, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
        env: process.env,
      });
      break
    } catch (error) {
      lastError = error
      if (attempt === 2) throw lastError
    }
  }

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
    baseURL: 'http://localhost:3100',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev -- --port 3100',
    url: 'http://localhost:3100',
    reuseExistingServer: !process.env.CI,
    env: {
      ...inheritedEnv,
      ...getLocalSupabaseEnv(),
      NEXT_DIST_DIR: '.next/playwright',
      NEXT_PUBLIC_SITE_URL: 'http://localhost:3100',
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: 'playwright-site-key',
      CAPTCHA_BYPASS_TOKEN: 'mock-turnstile-token',
    },
  },
});
