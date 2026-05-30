-- ============================================================================
-- Row Level Security policies.
-- Run this SECOND (after 01_schema.sql).
--
-- Model:
--   * Public catalog tables (categories, colors, products, variants) are
--     world-readable. Writes happen server-side with the SERVICE ROLE key
--     (admin Server Actions), which bypasses RLS — so no write policies.
--   * profiles: a user sees/edits their own row; admins can read all.
--   * liked_products: a user manages only their own likes.
--   * carts / cart_items: managed exclusively server-side with the service
--     role key (guest carts are keyed by an httpOnly cookie session_id, which
--     RLS can't see). RLS stays ON with no public policies → locked to service role.
-- ============================================================================

-- ─── Enable RLS everywhere ──────────────────────────────────────────────────
alter table public.categories            enable row level security;
alter table public.colors                 enable row level security;
alter table public.products               enable row level security;
alter table public.product_color_variants enable row level security;
alter table public.profiles               enable row level security;
alter table public.liked_products         enable row level security;
alter table public.carts                  enable row level security;
alter table public.cart_items             enable row level security;

-- ─── Public read for catalog ────────────────────────────────────────────────
drop policy if exists "public read categories" on public.categories;
create policy "public read categories"
    on public.categories for select
    using (true);

drop policy if exists "public read colors" on public.colors;
create policy "public read colors"
    on public.colors for select
    using (true);

drop policy if exists "public read products" on public.products;
create policy "public read products"
    on public.products for select
    using (true);

drop policy if exists "public read variants" on public.product_color_variants;
create policy "public read variants"
    on public.product_color_variants for select
    using (true);

-- ─── profiles ───────────────────────────────────────────────────────────────
-- Helper: is the current user an admin? SECURITY DEFINER avoids recursive RLS.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
    select coalesce(
        (select p.is_admin from public.profiles p where p.id = auth.uid()),
        false
    );
$$;

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile"
    on public.profiles for select
    using (auth.uid() = id or public.is_admin());

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile"
    on public.profiles for update
    using (auth.uid() = id)
    with check (auth.uid() = id);

-- ─── liked_products ─────────────────────────────────────────────────────────
drop policy if exists "read own likes" on public.liked_products;
create policy "read own likes"
    on public.liked_products for select
    using (auth.uid() = profile_id);

drop policy if exists "insert own likes" on public.liked_products;
create policy "insert own likes"
    on public.liked_products for insert
    with check (auth.uid() = profile_id);

drop policy if exists "delete own likes" on public.liked_products;
create policy "delete own likes"
    on public.liked_products for delete
    using (auth.uid() = profile_id);

-- carts / cart_items: no policies → only the service role key can touch them.
