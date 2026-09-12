create or replace function public.delete_my_account()
returns void
language plpgsql
security definer set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication is required';
  end if;

  delete from auth.users where id = auth.uid();

  if not found then
    raise exception 'The account was not found';
  end if;
end;
$$;

grant execute on function public.delete_my_account() to authenticated;