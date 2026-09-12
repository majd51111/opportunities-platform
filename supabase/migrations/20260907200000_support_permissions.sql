create table if not exists public.support_permissions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  can_review_opportunities boolean not null default false,
  can_manage_reports boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.support_permissions enable row level security;

create policy "Users can view their own support permissions"
  on public.support_permissions for select to authenticated
  using (user_id = auth.uid() or public.is_opportunity_admin());

create or replace function public.has_support_permission(p_permission text)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select public.is_opportunity_admin()
    or exists (
      select 1
      from public.user_roles roles
      join public.support_permissions permissions on permissions.user_id = roles.user_id
      where roles.user_id = auth.uid()
        and roles.role = 'support'
        and (
          (p_permission = 'review_opportunities' and permissions.can_review_opportunities)
          or (p_permission = 'manage_reports' and permissions.can_manage_reports)
        )
    );
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
  if not public.has_support_permission('review_opportunities') then
    raise exception 'Opportunity review access is required';
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

create or replace function public.update_report_status(
  p_report_id bigint,
  p_status text
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.has_support_permission('manage_reports') then
    raise exception 'Report management access is required';
  end if;

  if p_status not in ('pending', 'reviewed', 'resolved', 'rejected') then
    raise exception 'Invalid report status';
  end if;

  update public.reports
  set status = p_status
  where id = p_report_id;

  if not found then
    raise exception 'Report not found';
  end if;
end;
$$;

create or replace function public.set_support_permission(
  p_user_id uuid,
  p_permission text,
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

  if p_permission not in ('review_opportunities', 'manage_reports') then
    raise exception 'Invalid support permission';
  end if;

  if not exists (
    select 1 from public.user_roles
    where user_id = p_user_id and role = 'support'
  ) then
    raise exception 'The user is not a support-team member';
  end if;

  insert into public.support_permissions (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  if p_permission = 'review_opportunities' then
    update public.support_permissions
    set can_review_opportunities = p_enabled, updated_at = now()
    where user_id = p_user_id;
  else
    update public.support_permissions
    set can_manage_reports = p_enabled, updated_at = now()
    where user_id = p_user_id;
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
    on conflict (user_id) do update set role = 'support', updated_at = now();
    insert into public.support_permissions (user_id)
    values (p_user_id)
    on conflict (user_id) do nothing;
  else
    delete from public.support_permissions where user_id = p_user_id;
    delete from public.user_roles where user_id = p_user_id and role = 'support';
  end if;
end;
$$;

grant execute on function public.has_support_permission(text) to authenticated;
grant execute on function public.review_opportunity(text, text) to authenticated;
grant execute on function public.update_report_status(bigint, text) to authenticated;
grant execute on function public.set_support_permission(uuid, text, boolean) to authenticated;
grant execute on function public.set_support_access(uuid, boolean) to authenticated;
