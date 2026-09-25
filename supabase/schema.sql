-- ============================================================================
-- LOCORA — DATABASE SCHEMA + SECURITY (Row Level Security)
-- ----------------------------------------------------------------------------
-- HOW TO RUN: Supabase Dashboard → SQL Editor → New query → paste this whole
-- file → Run. Takes ~2 seconds. Safe to re-run (idempotent).
--
-- SECURITY MODEL:
--   * Every table has Row Level Security (RLS) enabled — no exceptions.
--   * The anon key is public by design; these policies are the real security.
--   * Users can only read public marketplace data and edit their own rows.
--   * Admins (role='admin' in profiles) can moderate content and users.
--   * Protected profile fields (role, verified, banned, rating) cannot be
--     self-edited — a database trigger blocks privilege escalation.
--   * A trigger auto-notifies the other participant when a message is sent.
-- ============================================================================

-- --------------------------------------------------------- profiles table ---

-- ---------------------------------------------------------------- profiles --

create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  name          text not null default 'New user',
  role          text not null default 'buyer'
                check (role in ('buyer', 'seller', 'provider', 'admin')),
  area          text not null default 'viman',
  email         text not null default '',
  phone         text not null default '',
  joined_at     timestamptz not null default now(),
  avatar_from   text not null default '#0390E0',
  avatar_to     text not null default '#014093',
  verified      boolean not null default false,
  bio           text,
  rating        numeric(3,2) not null default 0,
  reviews_count integer not null default 0,
  response_mins integer not null default 15,
  banned        boolean not null default false,
  is_demo       boolean not null default false,
  username      text not null check (username ~ '^[a-z0-9_]{3,20}$')
);

create unique index if not exists profiles_username_key on public.profiles (username);

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- auto-create a profile whenever someone signs up (username + phone included)
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  g text[];
  base text;
  u text;
  n integer := 0;
begin
  g := array['#0390E0,#014093', '#6366F1,#4338CA', '#02A4B3,#0174B7',
             '#EC4899,#BE185D', '#13CA9E,#089271', '#8B5CF6,#6D28D9'];
  -- username: the validated one from sign-up if given, else derived from the name;
  -- always unique
  u := regexp_replace(
         lower(coalesce(nullif(trim(new.raw_user_meta_data ->> 'username'), ''),
                        split_part(coalesce(new.raw_user_meta_data ->> 'name', 'New user'), ' ', 1))),
         '[^a-z0-9_]', '', 'g');
  if u is null or length(u) < 3 then
    u := 'neighbour';
  end if;
  u := left(u, 20);
  base := u;
  while exists (select 1 from public.profiles where username = u) loop
    n := n + 1;
    if n > 99 then
      u := left(base, 12) || '_' || substr(md5(random()::text), 1, 6);
      exit;
    end if;
    u := left(base, greatest(3, 20 - length(n::text))) || n::text;
  end loop;

  insert into public.profiles (id, name, role, area, email, phone, username, avatar_from, avatar_to)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), 'New user'),
    coalesce(new.raw_user_meta_data ->> 'role', 'buyer'),
    coalesce(new.raw_user_meta_data ->> 'area', 'viman'),
    coalesce(new.email, ''),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'phone'), ''), ''),
    u,
    split_part(g[1 + (abs(hashtext(new.id::text)) % array_length(g, 1))], ',', 1),
    split_part(g[1 + (abs(hashtext(new.id::text)) % array_length(g, 1))], ',', 2)
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- block users from granting themselves admin / verified / fake ratings
create or replace function public.guard_profile_changes()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is not null
     and auth.uid() = old.id
     and not public.is_admin() then
    if new.role <> old.role
       or new.verified is distinct from old.verified
       or new.banned is distinct from old.banned
       or new.rating <> old.rating
       or new.reviews_count <> old.reviews_count then
      raise exception 'LOCORA_PROTECTED_FIELD: you cannot modify role, verified, banned or rating';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard
  before update on public.profiles
  for each row execute function public.guard_profile_changes();

alter table public.profiles enable row level security;

drop policy if exists "profiles are public" on public.profiles;
create policy "profiles are public"
  on public.profiles for select using (true);

drop policy if exists "users insert own profile" on public.profiles;
create policy "users insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile"
  on public.profiles for update using (auth.uid() = id or public.is_admin());

drop policy if exists "users delete own profile" on public.profiles;
create policy "users delete own profile"
  on public.profiles for delete using (auth.uid() = id or public.is_admin());

-- --------------------------------------------------------------- products --

create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  seller_id   uuid not null references public.profiles (id) on delete cascade,
  title       text not null,
  description text not null default '',
  price       integer not null check (price >= 0),
  negotiable  boolean not null default true,
  category    text not null default 'other',
  condition   text not null default 'good' check (condition in ('new', 'like-new', 'good', 'fair')),
  age_years   numeric(4,1),
  images      text[] not null default '{}',
  area        text not null default 'viman',
  created_at  timestamptz not null default now(),
  views       integer not null default 0,
  favorites   integer not null default 0,
  status      text not null default 'active' check (status in ('active', 'sold')),
  ai_tags     text[] not null default '{}',
  price_check jsonb,
  attributes  jsonb,
  flagged     jsonb,
  is_demo     boolean not null default false
);

create index if not exists products_feed_idx on public.products (status, created_at desc);
create index if not exists products_area_idx on public.products (area);
create index if not exists products_category_idx on public.products (category);
create index if not exists products_seller_idx on public.products (seller_id);

alter table public.products enable row level security;

-- everyone can browse active listings from non-banned sellers
-- (owners and admins additionally see sold/flagged ones)
drop policy if exists "products are browsable" on public.products;
create policy "products are browsable"
  on public.products for select using (
    auth.uid() = seller_id
    or public.is_admin()
    or (
      status = 'active'
      and not exists (
        select 1 from public.profiles p
        where p.id = seller_id and p.banned
      )
    )
  );

drop policy if exists "users post own products" on public.products;
create policy "users post own products"
  on public.products for insert with check (auth.uid() = seller_id);

drop policy if exists "owners edit own products" on public.products;
create policy "owners edit own products"
  on public.products for update using (auth.uid() = seller_id or public.is_admin());

drop policy if exists "owners delete own products" on public.products;
create policy "owners delete own products"
  on public.products for delete using (auth.uid() = seller_id or public.is_admin());

-- --------------------------------------------------------------- services --

create table if not exists public.services (
  id               uuid primary key default gen_random_uuid(),
  provider_id      uuid not null references public.profiles (id) on delete cascade,
  title            text not null,
  category         text not null default 'plumber',
  tagline          text not null default '',
  description      text not null default '',
  starting_price   integer not null default 0 check (starting_price >= 0),
  price_unit       text not null default 'visit'
                   check (price_unit in ('visit', 'hour', 'session', 'event', 'day', 'month', 'sqft')),
  area             text not null default 'viman',
  radius_km        integer not null default 5 check (radius_km between 1 and 50),
  images           text[] not null default '{}',
  rating           numeric(3,2) not null default 0,
  reviews_count    integer not null default 0,
  jobs_done        integer not null default 0,
  response_mins    integer not null default 15,
  experience_years integer not null default 1,
  availability     text[] not null default '{}',
  skills           text[] not null default '{}',
  verified         boolean not null default false,
  created_at       timestamptz not null default now(),
  is_demo          boolean not null default false
);

create index if not exists services_category_idx on public.services (category);
create index if not exists services_area_idx on public.services (area);
create index if not exists services_provider_idx on public.services (provider_id);

alter table public.services enable row level security;

drop policy if exists "services are browsable" on public.services;
create policy "services are browsable"
  on public.services for select using (
    auth.uid() = provider_id
    or public.is_admin()
    or not exists (
      select 1 from public.profiles p
      where p.id = provider_id and p.banned
    )
  );

drop policy if exists "providers post own services" on public.services;
create policy "providers post own services"
  on public.services for insert with check (auth.uid() = provider_id);

drop policy if exists "providers edit own services" on public.services;
create policy "providers edit own services"
  on public.services for update using (auth.uid() = provider_id or public.is_admin());

drop policy if exists "providers delete own services" on public.services;
create policy "providers delete own services"
  on public.services for delete using (auth.uid() = provider_id or public.is_admin());

-- ---------------------------------------------------------------- reviews --

create table if not exists public.reviews (
  id         uuid primary key default gen_random_uuid(),
  target_id  uuid not null references public.profiles (id) on delete cascade,
  author     uuid not null references public.profiles (id) on delete cascade,
  rating     integer not null check (rating between 1 and 5),
  text       text not null default '',
  deal_type  text not null default 'product' check (deal_type in ('product', 'service')),
  created_at timestamptz not null default now()
);

create index if not exists reviews_target_idx on public.reviews (target_id, created_at desc);

alter table public.reviews enable row level security;

drop policy if exists "reviews are public" on public.reviews;
create policy "reviews are public"
  on public.reviews for select using (true);

drop policy if exists "users write own reviews" on public.reviews;
create policy "users write own reviews"
  on public.reviews for insert with check (auth.uid() = author);

drop policy if exists "authors edit own reviews" on public.reviews;
create policy "authors edit own reviews"
  on public.reviews for update using (auth.uid() = author or public.is_admin());

drop policy if exists "authors delete own reviews" on public.reviews;
create policy "authors delete own reviews"
  on public.reviews for delete using (auth.uid() = author or public.is_admin());

-- ----------------------------------------------------------- conversations --

create table if not exists public.conversations (
  id           text primary key,
  participants uuid[] not null check (array_length(participants, 1) = 2),
  subject      jsonb not null,
  updated_at   timestamptz not null default now(),
  unread_for   uuid[] not null default '{}'
);

create index if not exists conversations_participant_idx on public.conversations using gin (participants);

alter table public.conversations enable row level security;

drop policy if exists "participants see own threads" on public.conversations;
create policy "participants see own threads"
  on public.conversations for select using (auth.uid() = any (participants));

drop policy if exists "participants create threads" on public.conversations;
create policy "participants create threads"
  on public.conversations for insert with check (auth.uid() = any (participants));

drop policy if exists "participants update threads" on public.conversations;
create policy "participants update threads"
  on public.conversations for update using (auth.uid() = any (participants));

-- ---------------------------------------------------------------- messages --

create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id text not null references public.conversations (id) on delete cascade,
  sender_id       uuid not null references public.profiles (id) on delete cascade,
  text            text not null default '',
  at              timestamptz not null default now(),
  kind            text not null default 'text' check (kind in ('text', 'offer', 'system')),
  offer           jsonb
);

create index if not exists messages_thread_idx on public.messages (conversation_id, at);

alter table public.messages enable row level security;

drop policy if exists "participants read messages" on public.messages;
create policy "participants read messages"
  on public.messages for select using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and auth.uid() = any (c.participants)
    )
  );

drop policy if exists "participants send messages" on public.messages;
create policy "participants send messages"
  on public.messages for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id and auth.uid() = any (c.participants)
    )
  );

-- keep the thread's updated_at fresh + auto-notify the other participant
create or replace function public.handle_new_message()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  others uuid[];
begin
  update public.conversations
     set updated_at = new.at
   where id = new.conversation_id;

  select array_remove(participants, new.sender_id) into others
    from public.conversations where id = new.conversation_id;

  if coalesce(array_length(others, 1), 0) > 0 then
    insert into public.notifications (user_id, kind, title, body, href)
    select u, 'message', 'New message',
           left(coalesce(nullif(new.text, ''), 'You received an offer'), 90), '/chat'
      from unnest(others) as u;
  end if;

  return new;
end;
$$;

drop trigger if exists on_message_created on public.messages;
create trigger on_message_created
  after insert on public.messages
  for each row execute function public.handle_new_message();

-- ----------------------------------------------------------- buy_requests --

create table if not exists public.buy_requests (
  id         uuid primary key default gen_random_uuid(),
  buyer_id   uuid not null references public.profiles (id) on delete cascade,
  text       text not null,
  category   text not null default 'general',
  area       text not null default 'viman',
  budget_max integer,
  need_by    text not null default 'flexible'
             check (need_by in ('today', 'tomorrow', 'this-week', 'weekend', 'flexible')),
  status     text not null default 'open' check (status in ('open', 'fulfilled')),
  created_at timestamptz not null default now(),
  watching   boolean not null default false,
  matches    jsonb not null default '[]',
  is_demo    boolean not null default false
);

create index if not exists buy_requests_feed_idx on public.buy_requests (status, created_at desc);
create index if not exists buy_requests_area_idx on public.buy_requests (area);

alter table public.buy_requests enable row level security;

drop policy if exists "requests are public" on public.buy_requests;
create policy "requests are public"
  on public.buy_requests for select using (true);

drop policy if exists "users post own requests" on public.buy_requests;
create policy "users post own requests"
  on public.buy_requests for insert with check (auth.uid() = buyer_id);

drop policy if exists "owners update own requests" on public.buy_requests;
create policy "owners update own requests"
  on public.buy_requests for update using (auth.uid() = buyer_id or public.is_admin());

drop policy if exists "owners delete own requests" on public.buy_requests;
create policy "owners delete own requests"
  on public.buy_requests for delete using (auth.uid() = buyer_id or public.is_admin());

-- ---------------------------------------------------------------- reports --

create table if not exists public.reports (
  id           uuid primary key default gen_random_uuid(),
  target_type  text not null check (target_type in ('product', 'service', 'user', 'chat')),
  target_id    text not null,
  target_label text not null default '',
  reason       text not null,
  details      text not null default '',
  by           uuid not null references public.profiles (id) on delete cascade,
  created_at   timestamptz not null default now(),
  status       text not null default 'open' check (status in ('open', 'reviewing', 'resolved'))
);

create index if not exists reports_status_idx on public.reports (status, created_at desc);

alter table public.reports enable row level security;

-- only admins (and the reporter for their own submissions) can read reports
drop policy if exists "admins and reporters see reports" on public.reports;
create policy "admins and reporters see reports"
  on public.reports for select using (public.is_admin() or auth.uid() = by);

drop policy if exists "authenticated users report" on public.reports;
create policy "authenticated users report"
  on public.reports for insert with check (auth.uid() = by);

drop policy if exists "admins update reports" on public.reports;
create policy "admins update reports"
  on public.reports for update using (public.is_admin());

-- ----------------------------------------------------------- notifications --

create table if not exists public.notifications (
  id      uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind    text not null default 'system'
          check (kind in ('match', 'message', 'price', 'system', 'review')),
  title   text not null,
  body    text not null default '',
  at      timestamptz not null default now(),
  read    boolean not null default false,
  href    text
);

create index if not exists notifications_user_idx on public.notifications (user_id, at desc);

alter table public.notifications enable row level security;

drop policy if exists "users create own notifications" on public.notifications;
create policy "users create own notifications"
  on public.notifications for insert with check (auth.uid() = user_id);

drop policy if exists "users see own notifications" on public.notifications;
create policy "users see own notifications"
  on public.notifications for select using (auth.uid() = user_id);

drop policy if exists "users update own notifications" on public.notifications;
create policy "users update own notifications"
  on public.notifications for update using (auth.uid() = user_id);

drop policy if exists "users delete own notifications" on public.notifications;
create policy "users delete own notifications"
  on public.notifications for delete using (auth.uid() = user_id);

-- --------------------------------------------------------------- favorites --

create table if not exists public.favorites (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

alter table public.favorites enable row level security;

drop policy if exists "users see own favorites" on public.favorites;
create policy "users see own favorites"
  on public.favorites for select using (auth.uid() = user_id);

drop policy if exists "users add own favorites" on public.favorites;
create policy "users add own favorites"
  on public.favorites for insert with check (auth.uid() = user_id);

drop policy if exists "users remove own favorites" on public.favorites;
create policy "users remove own favorites"
  on public.favorites for delete using (auth.uid() = user_id);

-- --------------------------------------------------- storage (listing photos) --

insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict (id) do nothing;

update storage.buckets
   set file_size_limit = 5242880, -- 5 MB
       allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
 where id = 'listing-photos';

drop policy if exists "public read listing photos" on storage.objects;
create policy "public read listing photos"
  on storage.objects for select using (bucket_id = 'listing-photos');

drop policy if exists "users upload to own folder" on storage.objects;
create policy "users upload to own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "users update own photos" on storage.objects;
create policy "users update own photos"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "users delete own photos" on storage.objects;
create policy "users delete own photos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- DONE. Next steps (I will do these with you):
--   1. Sign up in the app → your profile row is created automatically.
--   2. Run this one-liner in the SQL Editor to make yourself admin:
--        update public.profiles set role = 'admin' where email = 'YOUR_EMAIL';
-- ============================================================================

-- ----------------------------------------------------------------------------
-- VERIFICATION — if the run truly succeeded, the Results panel below will
-- show a table listing 10 tables and 1 function (not "No rows returned").
-- ----------------------------------------------------------------------------
select '✅ table' as created, tablename as name
  from pg_tables
 where schemaname = 'public'
union all
select '✅ function', 'is_admin'
 where exists (
   select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'is_admin'
 )
order by 2;



create or replace function public.recompute_target_rating()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  update public.profiles p
     set rating = coalesce((select round(avg(r.rating)::numeric, 2) from public.reviews r where r.target_id = p.id), 0),
         reviews_count = (select count(*) from public.reviews r where r.target_id = p.id)
   where p.id = coalesce(new.target_id, old.target_id);
  return null;
end;
$$;
drop trigger if exists on_review_created on public.reviews;
create trigger on_review_created after insert on public.reviews for each row execute function public.recompute_target_rating();
drop trigger if exists on_review_deleted on public.reviews;
create trigger on_review_deleted after delete on public.reviews for each row execute function public.recompute_target_rating();

create or replace function public.recount_product_favorites()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  update public.products pr
     set favorites = (select count(*) from public.favorites f where f.product_id = pr.id)
   where pr.id = coalesce(new.product_id, old.product_id);
  return null;
end;
$$;
drop trigger if exists on_favorite_added on public.favorites;
create trigger on_favorite_added after insert on public.favorites for each row execute function public.recount_product_favorites();
drop trigger if exists on_favorite_removed on public.favorites;
create trigger on_favorite_removed after delete on public.favorites for each row execute function public.recount_product_favorites();

do $$ begin alter publication supabase_realtime add table public.messages; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.conversations; exception when duplicate_object then null; end $$;

-- worldwide location columns (city/state/country/lat/lng)

alter table public.profiles
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists country text,
  add column if not exists lat double precision,
  add column if not exists lng double precision;

alter table public.products
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists country text,
  add column if not exists lat double precision,
  add column if not exists lng double precision;

alter table public.services
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists country text,
  add column if not exists lat double precision,
  add column if not exists lng double precision;

alter table public.buy_requests
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists country text,
  add column if not exists lat double precision,
  add column if not exists lng double precision;

create index if not exists products_city_idx on public.products (city);
create index if not exists services_city_idx on public.services (city);
create index if not exists buy_requests_city_idx on public.buy_requests (city);
;

-- ================================================================
--  Security hardening (2026-09 audit)
-- ================================================================

-- 1) PII column protection: email/phone are NOT readable via the public
--    REST API (anon or authenticated). Contact info is only served through
--    the RPCs below (own row / admin-only full list).
revoke select on public.profiles from anon, authenticated;
grant select (id, name, role, area, joined_at, avatar_from, avatar_to, verified,
             bio, rating, reviews_count, response_mins, banned,
             city, state, country, lat, lng, is_demo, username)
  on public.profiles to anon, authenticated;

-- username can be changed by its owner (profile edit). On projects where UPDATE
-- is granted per-column, make sure the username column is included.
grant update (username) on public.profiles to anon, authenticated;

create or replace function public.my_private_profile()
returns table (id uuid, email text, phone text)
language sql security definer set search_path = public stable
as $$ select p.id, p.email, p.phone from public.profiles p where p.id = auth.uid() $$;
revoke all on function public.my_private_profile() from public, anon;
grant execute on function public.my_private_profile() to authenticated;

create or replace function public.admin_profiles()
returns table (id uuid, email text, phone text)
language sql security definer set search_path = public stable
as $$ select p.id, p.email, p.phone from public.profiles p where public.is_admin() order by p.joined_at $$;
revoke all on function public.admin_profiles() from public, anon;
grant execute on function public.admin_profiles() to authenticated;

-- 2) Storage hardening: uploads must be real images (jpeg/png/webp/gif),
--    under 5 MB, inside the uploader's own folder. Fails closed when the
--    mimetype is missing.
drop policy if exists "users upload to own folder" on storage.objects;
create policy "users upload to own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
    and coalesce(metadata->>'mimetype', '') in ('image/jpeg','image/png','image/webp','image/gif')
    and coalesce((metadata->>'size')::bigint, 0) < 5242880
  );

drop policy if exists "users update own photos" on storage.objects;
create policy "users update own photos"
  on storage.objects for update to authenticated
  using (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
    and coalesce(metadata->>'mimetype', '') in ('image/jpeg','image/png','image/webp','image/gif')
    and coalesce((metadata->>'size')::bigint, 0) < 5242880
  );
