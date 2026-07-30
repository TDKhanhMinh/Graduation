# Graduation Frontend

Next.js 16 application using Supabase as the backend-as-a-service layer:

- PostgreSQL and generated Data API
- Cookie-based Supabase Auth for Server Components
- Migration-managed schema and generated TypeScript types
- Row Level Security for per-user profile access

## Requirements

- Node.js 22 or newer
- npm 10 or newer
- Docker Desktop when using the local Supabase stack

## Environment

Copy `.env.example` to `.env.local` and fill in the values from the Supabase project Connect dialog:

```dotenv
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
```

The publishable key is safe to use in browser code because data authorization is enforced by RLS. Never add a Supabase secret or service-role key to a `NEXT_PUBLIC_` variable.

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

## Verification

```bash
npm run lint
npm run typecheck
npm run build
```

Manual end-to-end checks:

1. Register with an email, display name, and a password containing letters and numbers.
2. Follow the confirmation link when email confirmation is enabled.
3. Sign in and confirm the profile created by the database trigger is displayed.
4. Update the display name and refresh the page.
5. Sign out and verify the protected profile is no longer rendered.
