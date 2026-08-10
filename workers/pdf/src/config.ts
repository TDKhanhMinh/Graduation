function required(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is required`)
  return value
}

function integer(name: string, fallback: number, min: number, max: number): number {
  const value = Number.parseInt(process.env[name] ?? String(fallback), 10)
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${name} must be between ${min} and ${max}`)
  }
  return value
}

const chromiumArgs = (process.env.PDF_CHROMIUM_ARGS ?? '')
  .split(/\s+/)
  .map((value) => value.trim())
  .filter(Boolean)

if (chromiumArgs.includes('--disable-web-security')) {
  throw new Error('PDF_CHROMIUM_ARGS cannot disable web security')
}

export const workerConfig = {
  supabaseUrl: required('SUPABASE_URL'),
  serviceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
  appUrl: required('PUBLIC_APP_URL').replace(/\/$/, ''),
  workerId: process.env.PDF_WORKER_ID?.trim() || `pdf-worker-${process.pid}`,
  leaseSeconds: integer('PDF_LEASE_SECONDS', 120, 30, 900),
  pollIntervalMs: integer('PDF_POLL_INTERVAL_MS', 5000, 500, 60000),
  navigationTimeoutMs: integer('PDF_NAVIGATION_TIMEOUT_MS', 120000, 10000, 300000),
  printTokenTtlMs: integer('PDF_PRINT_TOKEN_TTL_MS', 15 * 60 * 1000, 60000, 60 * 60 * 1000),
  chromiumArgs,
}
