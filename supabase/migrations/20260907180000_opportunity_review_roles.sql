create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'support')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.user_profiles (id, email, full_name)
select id, email, raw_user_meta_data ->> 'full_name'
from auth.users
on conflict (id) do update set
  email = excluded.email,
  full_name = excluded.full_name,
  updated_at = now();

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.user_profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute procedure public.handle_new_user_profile();

alter table public.user_roles enable row level security;
alter table public.user_profiles enable row level security;

create or replace function public.has_opportunity_review_access()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role in ('admin', 'support')
  );
$$;

create or replace function public.is_opportunity_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = 'admin'
  );
$$;

create policy "Users can view their own review role"
  on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.is_opportunity_admin());

create policy "Admins can view user profiles"
  on public.user_profiles for select to authenticated
  using (id = auth.uid() or public.is_opportunity_admin());

alter table public.opportunities
  add column if not exists submitted_by uuid references auth.users(id) on delete set null,
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null,
  add column if not exists reviewed_at timestamptz;

create policy "Users and reviewers can view submitted opportunities"
  on public.opportunities for select to authenticated
  using (
    status = 'published'
    or submitted_by = auth.uid()
    or public.has_opportunity_review_access()
  );

create or replace function public.submit_opportunity(
  p_title text,
  p_slug text,
  p_short_description text,
  p_description text,
  p_direct_url text,
  p_earnings_text text default null,
  p_countries text[] default null,
  p_devices text[] default null,
  p_payment_methods text[] default null,
  p_requirements text[] default null
)
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  opportunity_id text;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required';
  end if;

  if coalesce(trim(p_title), '') = ''
    or coalesce(trim(p_short_description), '') = ''
    or coalesce(trim(p_description), '') = ''
    or coalesce(trim(p_direct_url), '') = '' then
    raise exception 'Required opportunity details are missing';
  end if;

  if p_direct_url !~ '^https?://' then
    raise exception 'Opportunity URL must use HTTP or HTTPS';
  end if;

  insert into public.opportunities (
    title, slug, short_description, description, direct_url, earnings_text,
    countries, devices, payment_methods, requirements, status,
    verification_status, submitted_by
  ) values (
    trim(p_title), trim(p_slug), trim(p_short_description), trim(p_description), trim(p_direct_url),
    nullif(trim(p_earnings_text), ''), p_countries, p_devices, p_payment_methods,
    p_requirements, 'pending', 'pending', auth.uid()
  ) returning id into opportunity_id;

  return opportunity_id;
end;
$$;

create or replace function public.review_opportunity(
  p_opportunity_id text,
  p_status text
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.has_opportunity_review_access() then
    raise exception 'Review access is required';
  end if;

  if p_status not in ('published', 'rejected') then
    raise exception 'Invalid review status';
  end if;

  update public.opportunities
  set status = p_status,
      verification_status = case when p_status = 'published' then 'verified' else 'rejected' end,
      reviewed_by = auth.uid(),
      reviewed_at = now()
  where id::text = p_opportunity_id
    and status = 'pending';

  if not found then
    raise exception 'The pending opportunity was not found';
  end if;
end;
$$;

create or replace function public.set_support_access(
  p_user_id uuid,
  p_enabled boolean
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_opportunity_admin() then
    raise exception 'Administrator access is required';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'Administrators cannot change their own access';
  end if;

  if p_enabled then
    insert into public.user_roles (user_id, role)
    values (p_user_id, 'support')
    on conflict (user_id) do update
      set role = 'support', updated_at = now();
  else
    delete from public.user_roles
    where user_id = p_user_id and role = 'support';
  end if;
end;
$$;

grant execute on function public.submit_opportunity(text, text, text, text, text, text, text[], text[], text[], text[]) to authenticated;
grant execute on function public.review_opportunity(text, text) to authenticated;
grant execute on function public.set_support_access(uuid, boolean) to authenticated;

-- Bootstrap the first administrator once after deployment:
-- insert into public.user_roles (user_id, role) values ('AUTH_USER_UUID', 'admin');
