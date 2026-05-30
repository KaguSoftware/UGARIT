-- ============================================================================
-- Genbuzz / Project0 — Supabase schema
-- Run this FIRST in the Supabase SQL editor.
--
-- Localized text fields are stored as JSONB: { "tr": "...", "en": "...", "ar": "..." }
-- (tr is the source locale; en/ar fall back to tr when empty).
-- ============================================================================

-- Needed for gen_random_uuid()
create extension if not exists "pgcrypto";

-- ─── updated_at trigger helper ──────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

-- ─── categories ─────────────────────────────────────────────────────────────
create table if not exists public.categories (
    id                uuid primary key default gen_random_uuid(),
    slug              text not null unique,
    name              jsonb not null default '{}'::jsonb,   -- { tr, en, ar }
    image_url         text,
    show_in_navbar    boolean not null default true,
    is_mega_menu      boolean not null default false,
    mega_menu_content jsonb,
    created_at        timestamptz not null default now(),
    updated_at        timestamptz not null default now()
);

create index if not exists categories_slug_idx on public.categories (slug);
create index if not exists categories_navbar_idx on public.categories (show_in_navbar);

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
    before update on public.categories
    for each row execute function public.set_updated_at();

-- ─── colors ─────────────────────────────────────────────────────────────────
create table if not exists public.colors (
    id         uuid primary key default gen_random_uuid(),
    name       jsonb not null default '{}'::jsonb,          -- { tr, en, ar }
    hex_code   text not null default '#000000',
    created_at timestamptz not null default now()
);

-- ─── products ───────────────────────────────────────────────────────────────
create table if not exists public.products (
    id           uuid primary key default gen_random_uuid(),
    slug         text not null unique,
    title        jsonb not null default '{}'::jsonb,        -- { tr, en, ar }
    description  jsonb not null default '{}'::jsonb,        -- { tr, en, ar }
    price        numeric(10, 2),
    is_featured  boolean not null default false,
    sp_one       boolean not null default false,
    sp_two       boolean not null default false,
    sp_three     boolean not null default false,
    model_height text,
    model_weight text,
    model_size   text,
    size_xs      boolean not null default false,
    size_s       boolean not null default false,
    size_m       boolean not null default false,
    size_l       boolean not null default false,
    size_xl      boolean not null default false,
    size_xxl     boolean not null default false,
    category_id  uuid references public.categories (id) on delete set null,
    images       text[] not null default '{}',              -- ordered Storage URLs
    created_at   timestamptz not null default now(),
    updated_at   timestamptz not null default now()
);

create index if not exists products_slug_idx on public.products (slug);
create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_featured_idx on public.products (is_featured);

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
    before update on public.products
    for each row execute function public.set_updated_at();

-- ─── product_color_variants (replaces Strapi repeatable component) ───────────
create table if not exists public.product_color_variants (
    id         uuid primary key default gen_random_uuid(),
    product_id uuid not null references public.products (id) on delete cascade,
    color_id   uuid references public.colors (id) on delete set null,
    image_url  text not null,
    position   int not null default 0
);

create index if not exists pcv_product_idx on public.product_color_variants (product_id);

-- ─── profiles (1:1 with auth.users) ─────────────────────────────────────────
create table if not exists public.profiles (
    id         uuid primary key references auth.users (id) on delete cascade,
    username   text,
    email      text,
    is_admin   boolean not null default false,
    created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (id, email, username)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1))
    )
    on conflict (id) do nothing;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- ─── liked_products (M2M) ───────────────────────────────────────────────────
create table if not exists public.liked_products (
    profile_id uuid not null references public.profiles (id) on delete cascade,
    product_id uuid not null references public.products (id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (profile_id, product_id)
);

-- ─── carts ──────────────────────────────────────────────────────────────────
create table if not exists public.carts (
    id         uuid primary key default gen_random_uuid(),
    session_id text not null unique,
    profile_id uuid references public.profiles (id) on delete set null,
    status     text not null default 'active' check (status in ('active', 'ordered')),
    created_at timestamptz not null default now()
);

create index if not exists carts_session_idx on public.carts (session_id);

-- ─── cart_items ─────────────────────────────────────────────────────────────
create table if not exists public.cart_items (
    id             uuid primary key default gen_random_uuid(),
    cart_id        uuid not null references public.carts (id) on delete cascade,
    product_id     uuid references public.products (id) on delete set null,
    quantity       int not null default 1 check (quantity >= 1),
    size           text check (size in ('XS', 'S', 'M', 'L', 'XL', 'XXL')),
    color          text,
    unit_price     numeric(10, 2) not null,
    title_snapshot text not null,
    slug_snapshot  text not null,
    image_snapshot text,
    created_at     timestamptz not null default now()
);

create index if not exists cart_items_cart_idx on public.cart_items (cart_id);
