create or replace function public.delete_opportunity_as_admin(p_opportunity_id text)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_opportunity_admin() then
    raise exception 'Administrator access is required';
  end if;

  delete from public.opportunities
  where id::text = p_opportunity_id;

  if not found then
    raise exception 'The opportunity was not found';
  end if;
end;
$$;

grant execute on function public.delete_opportunity_as_admin(text) to authenticated;