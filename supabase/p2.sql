-- LOCORA PART 2/6: products table + policies. Run parts 1 to 6 in order.
create table if not exists public.products ( id uuid primary key default gen_random_uuid(), seller_id uuid not null references public.profiles (id) on delete cascade, title text not null, description text not null default '', price integer not null check (price >= 0), negotiable boolean not null default true, category text not null default 'other', condition text not null default 'good' check (condition in ('new', 'like-new', 'good', 'fair')), age_years numeric(4,1), images text[] not null default '{}', area text not null default 'viman', created_at timestamptz not null default now(), views integer not null default 0, favorites integer not null default 0, status text not null default 'active' check (status in ('active', 'sold')), ai_tags text[] not null default '{}', price_check jsonb, attributes jsonb, flagged jsonb );
create index if not exists products_feed_idx on public.products (status, created_at desc);
create index if not exists products_area_idx on public.products (area);
create index if not exists products_category_idx on public.products (category);
create index if not exists products_seller_idx on public.products (seller_id);
alter table public.products enable row level security;
drop policy if exists "products are browsable" on public.products;
create policy "products are browsable" on public.products for select using ( auth.uid() = seller_id or public.is_admin() or ( status = 'active' and not exists ( select 1 from public.profiles p where p.id = seller_id and p.banned ) ) );
drop policy if exists "users post own products" on public.products;
create policy "users post own products" on public.products for insert with check (auth.uid() = seller_id);
drop policy if exists "owners edit own products" on public.products;
create policy "owners edit own products" on public.products for update using (auth.uid() = seller_id or public.is_admin());
drop policy if exists "owners delete own products" on public.products;
create policy "owners delete own products" on public.products for delete using (auth.uid() = seller_id or public.is_admin());
