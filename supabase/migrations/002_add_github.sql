-- Add GitHub username and URL columns to profiles
alter table public.profiles
  add column if not exists github_username text,
  add column if not exists github_url text;

-- Unique partial index for active GitHub usernames (same pattern as IG/LinkedIn)
create unique index if not exists profiles_github_active_unique
  on public.profiles (github_username)
  where github_username is not null and status in ('active', 'flagged');

-- Recreate admin_profiles view to include new columns
drop view if exists public.admin_profiles;
create view public.admin_profiles as
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

-- Update merge_profiles function to also merge GitHub fields
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

  if v_source.github_username is not null
    and v_target.github_username is not null
    and v_source.github_username <> v_target.github_username then
    raise exception 'MERGE_CONFLICT_GITHUB';
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
    github_username = coalesce(v_target.github_username, v_source.github_username),
    github_url = coalesce(v_target.github_url, v_source.github_url),
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
