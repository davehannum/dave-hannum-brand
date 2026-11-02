-- Apply to a dedicated website integration database. No Vantage tables or credentials.
begin;
create table if not exists public.garmin_connections (
 id uuid primary key default gen_random_uuid(), garmin_user_id text unique not null,
 tokens text not null, token_expires_at timestamptz not null, permissions jsonb not null default '[]',
 active boolean not null default true, connected_at timestamptz not null default now(),
 refresh_lock uuid, refresh_lock_until timestamptz
);
create table if not exists public.garmin_sessions (
 id text primary key, connection_id uuid not null references public.garmin_connections(id) on delete cascade,
 expires_at timestamptz not null
);
create table if not exists public.garmin_oauth (id text primary key, verifier text not null, expires_at timestamptz not null);
create table if not exists public.garmin_activities (
 id uuid primary key default gen_random_uuid(), connection_id uuid not null references public.garmin_connections(id) on delete cascade,
 activity_id text not null, payload text not null, notes text, start_time bigint,
 received_at timestamptz not null default now(), unique(connection_id,activity_id)
);
create index if not exists garmin_activities_owner_time on public.garmin_activities(connection_id,start_time desc);
create table if not exists public.garmin_deliveries (
 id text primary key, connection_id uuid not null references public.garmin_connections(id) on delete cascade,
 workout_key text not null, scheduled_date date not null, workout_id text,
 status text not null check(status in ('sending','created','complete','uncertain')), created_at timestamptz not null default now()
);
create table if not exists public.garmin_inbox (id text primary key,payload text not null,created_at timestamptz not null default now());
create table if not exists public.garmin_budgets (id text primary key,used integer not null,expires_at timestamptz not null);
-- Server-only authorization. No browser Data API access, even with an authenticated Supabase token.
alter table public.garmin_connections enable row level security;
alter table public.garmin_sessions enable row level security;
alter table public.garmin_oauth enable row level security;
alter table public.garmin_activities enable row level security;
alter table public.garmin_deliveries enable row level security;
alter table public.garmin_inbox enable row level security;
alter table public.garmin_budgets enable row level security;
revoke all on public.garmin_connections,public.garmin_sessions,public.garmin_oauth,public.garmin_activities,public.garmin_deliveries,public.garmin_inbox,public.garmin_budgets from public,anon,authenticated;
grant all on public.garmin_connections,public.garmin_sessions,public.garmin_oauth,public.garmin_activities,public.garmin_deliveries,public.garmin_inbox,public.garmin_budgets to service_role;
create or replace function public.garmin_take_budget(bucket_key text,bucket_limit integer,window_seconds integer)
returns boolean language plpgsql security invoker set search_path=public as $$
declare n integer;
begin
 insert into public.garmin_budgets(id,used,expires_at) values(bucket_key,1,now()+make_interval(secs=>window_seconds))
 on conflict(id) do update set used=case when garmin_budgets.expires_at<=now() then 1 else garmin_budgets.used+1 end,
 expires_at=case when garmin_budgets.expires_at<=now() then now()+make_interval(secs=>window_seconds) else garmin_budgets.expires_at end
 returning used into n;
 return n<=bucket_limit;
end $$;
revoke all on function public.garmin_take_budget(text,integer,integer) from public,anon,authenticated;
grant execute on function public.garmin_take_budget(text,integer,integer) to service_role;
commit;
