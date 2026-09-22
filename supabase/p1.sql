-- LOCORA PART 1/6: profiles + signup trigger + security guard. Run parts 1 to 6 in order.
create table if not exists public.profiles ( id uuid primary key references auth.users (id) on delete cascade, name text not null default 'New user', role text not null default 'buyer' check (role in ('buyer', 'seller', 'provider', 'admin')), area text not null default 'viman', email text not null default '', phone text not null default '', joined_at timestamptz not null default now(), avatar_from text not null default '#0E9F5E', avatar_to text not null default '#0A6640', verified boolean not null default false, bio text, rating numeric(3,2) not null default 0, reviews_count integer not null default 0, response_mins integer not null default 15, banned boolean not null default false );
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$ select exists ( select 1 from public.profiles where id = auth.uid() and role = 'admin' ); $$;
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$ declare g text[]; begin g := array['#0E9F5E,#0A6640', '#6366F1,#4338CA', '#F59E0B,#D97706', '#EC4899,#BE185D', '#06B6D4,#0E7490', '#8B5CF6,#6D28D9']; insert into public.profiles (id, name, role, area, email, avatar_from, avatar_to) values ( new.id, coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), 'New user'), coalesce(new.raw_user_meta_data ->> 'role', 'buyer'), coalesce(new.raw_user_meta_data ->> 'area', 'viman'), coalesce(new.email, ''), split_part(g[1 + (abs(hashtext(new.id::text)) % array_length(g, 1))], ',', 1), split_part(g[1 + (abs(hashtext(new.id::text)) % array_length(g, 1))], ',', 2) ); return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
create or replace function public.guard_profile_changes() returns trigger language plpgsql security definer set search_path = public as $$ begin if auth.uid() is not null and auth.uid() = old.id and not public.is_admin() then if new.role <> old.role or new.verified is distinct from old.verified or new.banned is distinct from old.banned or new.rating <> old.rating or new.reviews_count <> old.reviews_count then raise exception 'LOCORA_PROTECTED_FIELD: you cannot modify role, verified, banned or rating'; end if; end if; return new; end; $$;
drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard before update on public.profiles for each row execute function public.guard_profile_changes();
alter table public.profiles enable row level security;
drop policy if exists "profiles are public" on public.profiles;
create policy "profiles are public" on public.profiles for select using (true);
drop policy if exists "users insert own profile" on public.profiles;
create policy "users insert own profile" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile" on public.profiles for update using (auth.uid() = id or public.is_admin());
drop policy if exists "users delete own profile" on public.profiles;
create policy "users delete own profile" on public.profiles for delete using (auth.uid() = id or public.is_admin());
