-- LOCORA PART 3/6: services table + policies. Run parts 1 to 6 in order.
create table if not exists public.services ( id uuid primary key default gen_random_uuid(), provider_id uuid not null references public.profiles (id) on delete cascade, title text not null, category text not null default 'plumber', tagline text not null default '', description text not null default '', starting_price integer not null default 0 check (starting_price >= 0), price_unit text not null default 'visit' check (price_unit in ('visit', 'hour', 'session', 'event', 'day', 'month', 'sqft')), area text not null default 'viman', radius_km integer not null default 5 check (radius_km between 1 and 50), images text[] not null default '{}', rating numeric(3,2) not null default 0, reviews_count integer not null default 0, jobs_done integer not null default 0, response_mins integer not null default 15, experience_years integer not null default 1, availability text[] not null default '{}', skills text[] not null default '{}', verified boolean not null default false, created_at timestamptz not null default now() );
create index if not exists services_category_idx on public.services (category);
create index if not exists services_area_idx on public.services (area);
create index if not exists services_provider_idx on public.services (provider_id);
alter table public.services enable row level security;
drop policy if exists "services are browsable" on public.services;
create policy "services are browsable" on public.services for select using ( auth.uid() = provider_id or public.is_admin() or not exists ( select 1 from public.profiles p where p.id = provider_id and p.banned ) );
drop policy if exists "providers post own services" on public.services;
create policy "providers post own services" on public.services for insert with check (auth.uid() = provider_id);
drop policy if exists "providers edit own services" on public.services;
create policy "providers edit own services" on public.services for update using (auth.uid() = provider_id or public.is_admin());
drop policy if exists "providers delete own services" on public.services;
create policy "providers delete own services" on public.services for delete using (auth.uid() = provider_id or public.is_admin());
