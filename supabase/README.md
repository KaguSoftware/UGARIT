# Supabase setup

Run these SQL files **in order** in the Supabase SQL editor (Dashboard → SQL Editor → New query → paste → Run):

1. `01_schema.sql` — tables, indexes, triggers (incl. auto-profile on signup).
2. `02_rls.sql` — Row Level Security policies.
3. `03_storage.sql` — creates the public `media` storage bucket + read policy.
4. `04_seed.sql` — initial catalog data (products/categories). Paste it last.
   This was generated from the old data during the one-time migration; you can
   re-run it on a fresh database to reseed, or skip it and add content via
   `/admin`.

## Environment variables (frontend)

Copy `frontend/.env.example` to `frontend/.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service_role key>   # server-only, never exposed to the browser
```

## Making yourself an admin

Sign up through the storefront (or create a user in Auth → Users), then in the SQL editor:

```sql
update public.profiles set is_admin = true where email = 'you@example.com';
```

You can now reach `/admin`.
