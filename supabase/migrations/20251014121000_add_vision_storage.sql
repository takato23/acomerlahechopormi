-- Migration: add Supabase Storage support for vision images with TTL metadata
-- Created: 2025-10-14

-- Ensure dedicated bucket exists for vision images
insert into storage.buckets (id, name, public, file_size_limit)
values ('vision-insights', 'vision-insights', false, 6 * 1024 * 1024)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;

-- Restrict access to the bucket to the service role by default
drop policy if exists "vision images anonymous access" on storage.objects;
drop policy if exists "vision images public read" on storage.objects;
drop policy if exists "vision images authenticated access" on storage.objects;
drop policy if exists "vision images service access" on storage.objects;

create policy "vision images service access"
  on storage.objects
  for all
  using (bucket_id = 'vision-insights' and auth.role() = 'service_role')
  with check (bucket_id = 'vision-insights' and auth.role() = 'service_role');

-- Track storage metadata on vision_insights
alter table public.vision_insights
  rename column storage_path to image_storage_path;

alter table public.vision_insights
  add column if not exists image_expires_at timestamptz,
  add column if not exists image_content_type text;

create index if not exists vision_insights_image_expiry_idx
  on public.vision_insights (image_expires_at);

comment on column public.vision_insights.image_storage_path is 'Ruta del archivo original almacenado en Supabase Storage.';
comment on column public.vision_insights.image_expires_at is 'Fecha de expiración programada para eliminar el archivo de Storage.';
comment on column public.vision_insights.image_content_type is 'MIME type detectado al subir la imagen a Storage.';
