# Supabase setup

Run these SQL files **in order** in the Supabase SQL editor (Dashboard → SQL Editor → New query → paste → Run):

1. `01_schema.sql` — tables, indexes, triggers (incl. auto-profile on signup).
2. `02_rls.sql` — Row Level Security policies.
3. `03_storage.sql` — creates the public `media` storage bucket + read policy.
4. `04_seed.sql` — **generated** by the migration script; contains your existing
   products/categories/colors/variants/likes. Paste it last.

## Generating `04_seed.sql`

From the repo root, before deleting `backend/`:

```bash
cd backend
# set the service-role env so media can be uploaded to Storage:
#   SUPABASE_URL=...                (https://<project>.supabase.co)
#   SUPABASE_SERVICE_ROLE_KEY=...   (Project Settings → API → service_role)
node scripts/export-to-supabase.mjs
```

This reads the old Strapi SQLite DB (`backend/.tmp/data.db`), uploads media to the
Supabase `media` bucket, and writes `supabase/04_seed.sql`. Review it, then paste
it into the SQL editor.

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
