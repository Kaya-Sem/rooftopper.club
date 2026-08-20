-- Location images: table + RLS. Run in Supabase SQL Editor.
-- Requires: existing "locations" table and auth.users (Supabase default).

-- Table: metadata for images stored in Storage bucket "images"
create table if not exists public.location_images (
  id uuid primary key default gen_random_uuid(),
  location uuid not null references public.locations(id) on delete cascade,
  storage_path text not null unique,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_location_images_location
  on public.location_images(location);

alter table public.location_images enable row level security;

-- Anyone can read location images (to show gallery on location page)
create policy "location_images_select"
  on public.location_images for select
  using (true);

-- Only authenticated users can insert
create policy "location_images_insert"
  on public.location_images for insert
  to authenticated
  with check (auth.uid() = uploaded_by);

-- Optional: allow uploader to delete their own image
create policy "location_images_delete_own"
  on public.location_images for delete
  to authenticated
  using (auth.uid() = uploaded_by);

-- Storage RLS for bucket "images"
-- Allow authenticated users to upload under locations/*
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do update set public = true;

-- Authenticated users can upload to locations/* (path prefix)
create policy "images_upload_locations"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'images'
    and (storage.foldername(name))[1] = 'locations'
  );

-- Public read for public bucket (optional; public buckets are often readable by default)
create policy "images_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'images');
