create table if not exists public.profiles (
  id text primary key,
  display_name text not null,
  instagram_handle text,
  linkedin_slug text,
  instagram_url text,
  linkedin_url text,
  status text not null default 'active' check (status in ('active', 'flagged', 'hidden', 'expired')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null,
  edit_token_hash text not null,
  report_count integer not null default 0
);

create table if not exists public.reports (
  id text primary key,
  profile_id text not null references public.profiles(id) on delete cascade,
  reason text,
  created_at timestamptz not null default timezone('utc', now()),
  reporter_ip_hash text not null
);

create unique index if not exists profiles_instagram_active_unique
  on public.profiles (instagram_handle)
  where instagram_handle is not null and status in ('active', 'flagged');

create unique index if not exists profiles_linkedin_active_unique
  on public.profiles (linkedin_slug)
  where linkedin_slug is not null and status in ('active', 'flagged');

create unique index if not exists reports_profile_reporter_unique
  on public.reports (profile_id, reporter_ip_hash);

create index if not exists profiles_public_idx
  on public.profiles (status, updated_at desc, expires_at desc);

create index if not exists reports_profile_idx
  on public.reports (profile_id, created_at desc);

create or replace view public.admin_profiles as
select
  profiles.*,
  case
    when status = 'flagged' then 0
    when report_count > 0 then 1
    when status = 'hidden' then 2
    when status = 'expired' then 3
    else 4
  end as admin_priority
from public.profiles;

create or replace function public.expire_profiles()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expired_count integer;
begin
  update public.profiles
  set
    status = 'expired',
    updated_at = timezone('utc', now())
  where status in ('active', 'flagged')
    and expires_at <= timezone('utc', now());

  get diagnostics v_expired_count = row_count;
  return v_expired_count;
end;
$$;

create or replace function public.report_profile(
  p_profile_id text,
  p_report_id text,
  p_reason text,
  p_reporter_ip_hash text,
  p_flag_threshold integer default 3
)
returns setof public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles%rowtype;
begin
  select *
  into v_profile
  from public.profiles
  where id = p_profile_id
  limit 1
  for update;

  if not found or v_profile.status in ('hidden', 'expired') then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  insert into public.reports (id, profile_id, reason, reporter_ip_hash)
  values (p_report_id, p_profile_id, p_reason, p_reporter_ip_hash);

  update public.profiles
  set
    report_count = report_count + 1,
    status = case
      when report_count + 1 >= greatest(p_flag_threshold, 1) then 'flagged'
      else status
    end,
    updated_at = timezone('utc', now())
  where id = p_profile_id
  returning * into v_profile;

  return next v_profile;
  return;
end;
$$;

create or replace function public.merge_profiles(
  p_source_profile_id text,
  p_target_profile_id text
)
returns setof public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_source public.profiles%rowtype;
  v_target public.profiles%rowtype;
begin
  if p_source_profile_id = p_target_profile_id then
    raise exception 'MERGE_CONFLICT_SAME_ID';
  end if;

  select *
  into v_source
  from public.profiles
  where id = p_source_profile_id
  limit 1
  for update;

  select *
  into v_target
  from public.profiles
  where id = p_target_profile_id
  limit 1
  for update;

  if v_source.id is null or v_target.id is null then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  if v_source.instagram_handle is not null
    and v_target.instagram_handle is not null
    and v_source.instagram_handle <> v_target.instagram_handle then
    raise exception 'MERGE_CONFLICT_INSTAGRAM';
  end if;

  if v_source.linkedin_slug is not null
    and v_target.linkedin_slug is not null
    and v_source.linkedin_slug <> v_target.linkedin_slug then
    raise exception 'MERGE_CONFLICT_LINKEDIN';
  end if;

  delete from public.reports
  where profile_id = p_source_profile_id
    and reporter_ip_hash in (
      select reporter_ip_hash
      from public.reports
      where profile_id = p_target_profile_id
    );

  update public.reports
  set profile_id = p_target_profile_id
  where profile_id = p_source_profile_id;

  update public.profiles
  set
    instagram_handle = coalesce(v_target.instagram_handle, v_source.instagram_handle),
    instagram_url = coalesce(v_target.instagram_url, v_source.instagram_url),
    linkedin_slug = coalesce(v_target.linkedin_slug, v_source.linkedin_slug),
    linkedin_url = coalesce(v_target.linkedin_url, v_source.linkedin_url),
    expires_at = greatest(v_target.expires_at, v_source.expires_at),
    updated_at = timezone('utc', now()),
    report_count = (
      select count(*)
      from public.reports
      where profile_id = p_target_profile_id
    )
  where id = p_target_profile_id
  returning * into v_target;

  delete from public.profiles
  where id = p_source_profile_id;

  return next v_target;
  return;
end;
$$;
