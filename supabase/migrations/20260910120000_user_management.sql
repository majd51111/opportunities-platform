alter table public.user_profiles
  add column if not exists status text not null default 'active'
  check (status in ('active', 'suspended', 'banned'));

create or replace function public.manage_user(
  p_user_id uuid,
  p_action text
)
returns void
language plpgsql
security definer set search_path = public, auth
as $$
begin
  if not public.is_opportunity_admin() then
    raise exception 'Administrator access is required';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'Administrators cannot manage their own account';
  end if;

  if p_action = 'remove' then
    delete from auth.users where id = p_user_id;
  elsif p_action in ('active', 'suspended', 'banned') then
    update public.user_profiles
    set status = p_action,
        updated_at = now()
    where id = p_user_id;

    if not found then
      raise exception 'The user was not found';
    end if;
  else
    raise exception 'Invalid user management action';
  end if;
end;
$$;

grant execute on function public.manage_user(uuid, text) to authenticated;
