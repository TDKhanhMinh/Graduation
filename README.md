# Graduation Frontend

Next.js 16 application using Supabase as the backend-as-a-service layer:

- PostgreSQL and generated Data API
- Cookie-based Supabase Auth for Server Components
- Migration-managed schema and generated TypeScript types
- Row Level Security for per-user profile access
- Owner-scoped event CRUD with protected dashboard routes
- Server-rendered public event walls under `/e/[slug]`

## Requirements

- Node.js 22 or newer
- npm 10 or newer
- Docker Desktop when using the local Supabase stack

## Environment

Copy `.env.example` to `.env.local`. For local development, start Supabase and copy values from `npx supabase status -o env`:

```dotenv
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:44321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<PUBLISHABLE_KEY from Supabase CLI>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY from Supabase CLI>
SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY from Supabase CLI>
DATABASE_URL=<DB_URL from Supabase CLI>
```

For a hosted Supabase project, use the project URL and publishable/anon keys from the project Connect dialog instead. The publishable and anon keys are safe to use in browser code because data authorization is enforced by RLS. Never add a Supabase secret or service-role key to a `NEXT_PUBLIC_` variable.

## Run the application

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Local Supabase workflow

The CLI configuration and SQL migration live in `supabase/`.

```bash
npm run supabase:start
npm run supabase:reset
npm run supabase:types
```

- `supabase:start` starts the Docker-based local stack.
- `supabase:reset` rebuilds the database from migrations and seed data.
- `supabase:types` regenerates `src/types/database.ts` from the local schema.

Stop the local stack with:

```bash
npm run supabase:stop
```

## Remote migration workflow

Create every schema change as a migration:

```bash
npx supabase migration new descriptive_change_name
```

After testing locally, link and deploy to the intended development project:

```bash
npx supabase link --project-ref <project-ref>
npx supabase db push
npx supabase gen types typescript --project-id <project-ref> --schema public > src/types/database.ts
```

Do not modify the remote schema directly in the Dashboard after adopting migrations. The migration files and remote migration history must stay aligned.

## Auth architecture

- `src/lib/supabase/client.ts`: browser client for Client Components.
- `src/lib/supabase/server.ts`: request-scoped server client.
- `src/lib/supabase/proxy.ts` and `src/proxy.ts`: refresh Auth cookies and apply no-cache response headers.
- `src/lib/auth/dal.ts`: verifies identity with `auth.getClaims()`.
- `src/app/auth/actions.ts`: validated sign-up, sign-in, sign-out, and profile mutations.
- `src/app/auth/callback/route.ts`: completes the PKCE/email confirmation flow.

Proxy refresh is not an authorization boundary. Every data mutation verifies the user again, and PostgreSQL RLS restricts each profile row to its matching `auth.uid()`.

## Event and public wall architecture

- `src/features/events/actions.ts`: server actions for owner-only create, update, archive, and close operations.
- `src/features/events/dal.ts`: owner-scoped event reads plus the safe public event projection for `/e/[slug]`.
- `src/features/wishes/dal.ts`: approved-only public wishes query with keyset pagination.
- `src/app/dashboard/events/**`: protected event CRUD surfaces.
- `src/app/(public)/e/[slug]/**`: server-rendered public/unlisted wall route with safe metadata and route states.

## Verification

```bash
npm run lint
npm run typecheck
npm run build
```

Manual end-to-end checks:

1. Register with an email, display name, and a password containing letters and numbers.
2. Sign in and navigate to the `/dashboard`.
3. Create a new event, verify it appears in the dashboard.
4. Navigate to the event settings and update its details (title, description, URL slug).
5. Access the public URL `/e/[slug]` and verify the event details are displayed.
6. Sign out and verify the protected dashboard is no longer accessible.

## Testing

This project uses Vitest for unit tests, Playwright for E2E tests, and pgTAP for database tests.
To run the Foundation validation gate locally:

```bash
npm install
npm run supabase:start
npm run supabase:reset
npx playwright install chromium

npm run test:db
npm run test:unit
npm run test:e2e
npm run lint
npm run typecheck
npm run build
```

`npm run test:e2e` starts the app through Playwright's `webServer` config and maps local Supabase CLI environment values without using production data.
