-- ============================================================================
-- Site settings, product stock, and cart de-duplication.
-- Run this AFTER 01_schema.sql / 02_rls.sql (and any earlier migrations).
--
-- Idempotent: safe to re-run.
-- ============================================================================

-- ─── site_settings (key/value store for editable site config) ────────────────
create table if not exists public.site_settings (
    key        text primary key,
    value      jsonb not null default '{}'::jsonb,
    updated_at timestamptz not null default now()
);

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
    before update on public.site_settings
    for each row execute function public.set_updated_at();

-- World-readable; writes only via the service role (admin Server Actions),
-- same model as the catalog tables — so no insert/update policies.
alter table public.site_settings enable row level security;

drop policy if exists "public read settings" on public.site_settings;
create policy "public read settings"
    on public.site_settings for select
    using (true);

-- Seed defaults (kept if already present).
insert into public.site_settings (key, value) values
    ('whatsapp_number', '"905372825347"'::jsonb),
    ('store_name',      '"UGARIT"'::jsonb),
    ('socials',         '{}'::jsonb)
on conflict (key) do nothing;

-- ─── product stock ───────────────────────────────────────────────────────────
-- null  = not tracked (always purchasable)
-- 0     = out of stock
-- > 0   = units available
alter table public.products add column if not exists stock integer;

-- ─── cart_items de-duplication ───────────────────────────────────────────────
-- Historically every add-to-cart inserted a new row. Collapse existing
-- duplicates (same cart + product + size + color) into one row whose quantity
-- is the sum, then enforce uniqueness so future adds increment instead.
with ranked as (
    select
        id,
        cart_id,
        product_id,
        coalesce(size, '')  as size_key,
        coalesce(color, '') as color_key,
        quantity,
        row_number() over (
            partition by cart_id, product_id,
                         coalesce(size, ''), coalesce(color, '')
            order by created_at
        ) as rn,
        sum(quantity) over (
            partition by cart_id, product_id,
                         coalesce(size, ''), coalesce(color, '')
        ) as total_qty
    from public.cart_items
)
update public.cart_items ci
set quantity = ranked.total_qty
from ranked
where ci.id = ranked.id and ranked.rn = 1;

delete from public.cart_items ci
using (
    select
        id,
        row_number() over (
            partition by cart_id, product_id,
                         coalesce(size, ''), coalesce(color, '')
            order by created_at
        ) as rn
    from public.cart_items
) dupes
where ci.id = dupes.id and dupes.rn > 1;

create unique index if not exists cart_items_dedupe_idx
    on public.cart_items (cart_id, product_id, coalesce(size, ''), coalesce(color, ''));
