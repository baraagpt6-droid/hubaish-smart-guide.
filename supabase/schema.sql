-- Hubaish Smart Guide — Supabase schema
-- Run once in Supabase Dashboard > SQL Editor.
-- Use only the anon public key in the client. Never expose service_role.

create extension if not exists pgcrypto;

create or replace function public.is_hubaish_admin()
returns boolean language sql stable set search_path = ''
as $$ select coalesce(auth.jwt() -> 'app_metadata' ->> 'role' = 'hubaish_admin', false); $$;

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = ''
as $$ begin new.updated_at = now(); return new; end; $$;

create table if not exists public.landmarks (
 id uuid primary key default gen_random_uuid(), slug text not null unique,
 category text not null default 'fort' check(category in ('fort','mosque','valley','mountain')),
 title_ar text not null, title_en text, title_tr text, title_fr text,
 location_ar text, location_en text, location_tr text, location_fr text,
 description_ar text not null, description_en text, description_tr text, description_fr text,
 importance_ar text, source_text text, source_url text,
 status text not null default 'draft' check(status in ('draft','approved','rejected')),
 created_by uuid references auth.users(id) on delete set null, updated_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.history_events (
 id uuid primary key default gen_random_uuid(), slug text not null unique,
 era text not null default 'ancient' check(era in ('ancient','modern')),
 title_ar text not null, title_en text, title_tr text, title_fr text,
 period_ar text, period_en text, period_tr text, period_fr text,
 body_ar text not null, body_en text, body_tr text, body_fr text,
 source_text text, source_url text,
 status text not null default 'draft' check(status in ('draft','approved','rejected')),
 created_by uuid references auth.users(id) on delete set null, updated_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.sub_districts_updates (
 id uuid primary key default gen_random_uuid(), slug text not null unique,
 district_name_ar text not null, district_name_en text, district_name_tr text, district_name_fr text,
 place_name_ar text not null, place_name_en text, place_name_tr text, place_name_fr text,
 description_ar text not null, description_en text, description_tr text, description_fr text,
 source_text text, source_url text,
 status text not null default 'draft' check(status in ('draft','approved','rejected')),
 created_by uuid references auth.users(id) on delete set null, updated_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.historical_figures (
 id uuid primary key default gen_random_uuid(), slug text not null unique,
 name_ar text not null, name_en text, name_tr text, name_fr text,
 role_ar text, role_en text, role_tr text, role_fr text,
 biography_ar text not null, biography_en text, biography_tr text, biography_fr text,
 source_text text, source_url text,
 status text not null default 'draft' check(status in ('draft','approved','rejected')),
 created_by uuid references auth.users(id) on delete set null, updated_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.community_links (
 id uuid primary key default gen_random_uuid(), slug text not null unique,
 label_ar text not null, label_en text, label_tr text, label_fr text, url text not null,
 sort_order integer not null default 0,
 status text not null default 'draft' check(status in ('draft','approved','rejected')),
 created_by uuid references auth.users(id) on delete set null, updated_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.user_contributions (
 id uuid primary key default gen_random_uuid(), name text,
 category text not null check(category in ('place','history','uzal','correction','person')),
 title text not null, details text not null, reference_url text,
 status text not null default 'pending' check(status in ('pending','approved','rejected')),
 created_by uuid references auth.users(id) on delete set null, reviewed_by uuid references auth.users(id) on delete set null,
 reviewed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(char_length(title) between 2 and 120), check(char_length(details) between 3 and 5000)
);

create index if not exists landmarks_status_updated_idx on public.landmarks(status,updated_at desc);
create index if not exists history_status_updated_idx on public.history_events(status,updated_at desc);
create index if not exists district_updates_lookup_idx on public.sub_districts_updates(status,district_name_ar);
create index if not exists figures_status_updated_idx on public.historical_figures(status,updated_at desc);
create index if not exists links_status_order_idx on public.community_links(status,sort_order);
create index if not exists contributions_pending_idx on public.user_contributions(status,created_at desc);

do $$ declare t text; begin
 foreach t in array array['landmarks','history_events','sub_districts_updates','historical_figures','community_links','user_contributions'] loop
  execute format('drop trigger if exists set_updated_at on public.%I',t);
  execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()',t);
 end loop;
end $$;

alter table public.landmarks enable row level security;
alter table public.history_events enable row level security;
alter table public.sub_districts_updates enable row level security;
alter table public.historical_figures enable row level security;
alter table public.community_links enable row level security;
alter table public.user_contributions enable row level security;

drop policy if exists "public read approved landmarks" on public.landmarks;
create policy "public read approved landmarks" on public.landmarks for select to anon,authenticated using(status='approved');
drop policy if exists "admin manage landmarks" on public.landmarks;
create policy "admin manage landmarks" on public.landmarks for all to authenticated using(public.is_hubaish_admin()) with check(public.is_hubaish_admin());

drop policy if exists "public read approved history" on public.history_events;
create policy "public read approved history" on public.history_events for select to anon,authenticated using(status='approved');
drop policy if exists "admin manage history" on public.history_events;
create policy "admin manage history" on public.history_events for all to authenticated using(public.is_hubaish_admin()) with check(public.is_hubaish_admin());

drop policy if exists "public read approved district updates" on public.sub_districts_updates;
create policy "public read approved district updates" on public.sub_districts_updates for select to anon,authenticated using(status='approved');
drop policy if exists "admin manage district updates" on public.sub_districts_updates;
create policy "admin manage district updates" on public.sub_districts_updates for all to authenticated using(public.is_hubaish_admin()) with check(public.is_hubaish_admin());

drop policy if exists "public read approved figures" on public.historical_figures;
create policy "public read approved figures" on public.historical_figures for select to anon,authenticated using(status='approved');
drop policy if exists "admin manage figures" on public.historical_figures;
create policy "admin manage figures" on public.historical_figures for all to authenticated using(public.is_hubaish_admin()) with check(public.is_hubaish_admin());

drop policy if exists "public read approved links" on public.community_links;
create policy "public read approved links" on public.community_links for select to anon,authenticated using(status='approved');
drop policy if exists "admin manage links" on public.community_links;
create policy "admin manage links" on public.community_links for all to authenticated using(public.is_hubaish_admin()) with check(public.is_hubaish_admin());

drop policy if exists "public submit pending contributions" on public.user_contributions;
create policy "public submit pending contributions" on public.user_contributions for insert to anon,authenticated
with check(status='pending' and reviewed_at is null and reviewed_by is null);
drop policy if exists "admin manage contribution inbox" on public.user_contributions;
create policy "admin manage contribution inbox" on public.user_contributions for all to authenticated using(public.is_hubaish_admin()) with check(public.is_hubaish_admin());

grant usage on schema public to anon,authenticated;
grant select on public.landmarks,public.history_events,public.sub_districts_updates,public.historical_figures,public.community_links to anon,authenticated;
grant insert on public.user_contributions to anon,authenticated;
grant select,insert,update,delete on public.landmarks,public.history_events,public.sub_districts_updates,public.historical_figures,public.community_links,public.user_contributions to authenticated;

-- Optional Realtime publication. The client polls every 60 seconds and on reconnect for offline-safe delivery.
do $$ begin alter publication supabase_realtime add table public.landmarks; exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.history_events; exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.sub_districts_updates; exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.historical_figures; exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.community_links; exception when duplicate_object then null; when undefined_object then null; end $$;

-- Create the admin user under Authentication > Users first, then run this using the exact email.
-- UPDATE auth.users SET raw_app_meta_data=coalesce(raw_app_meta_data,'{}'::jsonb)||'{"role":"hubaish_admin"}'::jsonb
-- WHERE email='YOUR_ADMIN_EMAIL';
-- Sign out/in again so the new app_metadata claim is included in the JWT.
