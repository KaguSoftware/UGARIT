-- ============================================================================
-- Storage bucket for product / category media.
-- Run this THIRD (after 02_rls.sql).
--
-- NOTE: You can also create the bucket from the Supabase Dashboard
--   (Storage → New bucket → name "media", Public = ON).
-- This SQL does the same thing and adds access policies.
-- ============================================================================

-- Create a public bucket named "media" (idempotent).
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

-- Anyone can read objects in the media bucket (public catalog images).
drop policy if exists "public read media" on storage.objects;
create policy "public read media"
    on storage.objects for select
    using (bucket_id = 'media');

-- Uploads/updates/deletes are performed server-side with the SERVICE ROLE key
-- (admin Server Actions + migration script), which bypasses these policies.
-- No authenticated-user write policy is added, so the bucket is read-only to
-- the public/anon and writable only by the service role.
