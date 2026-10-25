-- Fix permissive RLS/storage policies flagged by the security scan.

-- 1. analytics_events: anonymous logging stays, but rows must be well-formed
--    (replaces WITH CHECK (true)).
drop policy "anyone can log events" on public.analytics_events;
create policy "anyone can log events" on public.analytics_events
  for insert to anon, authenticated
  with check (
    event_type is not null
    and char_length(event_type) between 1 and 100
    and (path is null or char_length(path) <= 500)
    and (lesson_slug is null or char_length(lesson_slug) <= 200)
    and (visitor_id is null or char_length(visitor_id) <= 100)
  );

-- 2. site_settings: singleton settings row — bind the public read to it
--    (replaces USING (true)).
drop policy "settings public read" on public.site_settings;
create policy "settings public read" on public.site_settings
  for select to anon, authenticated
  using (id = 1);

-- 3. avatars: bind reads to the owner's folder, matching the write policies.
drop policy "avatars read" on storage.objects;
create policy "avatars read" on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- 4. media: bucket is private, so public read is removed; admins keep read
--    access for previews in the admin panel.
drop policy "media public read" on storage.objects;
create policy "media admin read" on storage.objects
  for select to authenticated
  using (bucket_id = 'media' and public.has_role(auth.uid(), 'admin'));