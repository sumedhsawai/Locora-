-- LOCORA PART 6/6: photo storage + FINAL VERIFICATION. Run parts 1 to 6 in order.
insert into storage.buckets (id, name, public) values ('listing-photos', 'listing-photos', true) on conflict (id) do nothing;
update storage.buckets set file_size_limit = 5242880, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/avif'] where id = 'listing-photos';
drop policy if exists "public read listing photos" on storage.objects;
create policy "public read listing photos" on storage.objects for select using (bucket_id = 'listing-photos');
drop policy if exists "users upload to own folder" on storage.objects;
create policy "users upload to own folder" on storage.objects for insert to authenticated with check ( bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text );
drop policy if exists "users update own photos" on storage.objects;
create policy "users update own photos" on storage.objects for update to authenticated using ( bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text );
drop policy if exists "users delete own photos" on storage.objects;
create policy "users delete own photos" on storage.objects for delete to authenticated using ( bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text );
select '✅ table' as created, tablename as name from pg_tables where schemaname = 'public' union all select '✅ function', 'is_admin' where exists ( select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'is_admin' ) order by 2;
