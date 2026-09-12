alter table public.support_requests
  add column if not exists response text;

drop function if exists public.update_support_request_status(bigint, text);

create or replace function public.update_support_request_status(
  p_request_id bigint,
  p_status text,
  p_response text default null
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.has_support_permission('manage_support_requests') then
    raise exception 'Support request management access is required';
  end if;

  if p_status not in ('open', 'in_progress', 'resolved', 'closed') then
    raise exception 'Invalid support request status';
  end if;

  update public.support_requests
  set status = p_status,
      response = nullif(trim(p_response), ''),
      handled_by = auth.uid(),
      handled_at = now(),
      updated_at = now()
  where id = p_request_id;

  if not found then
    raise exception 'Support request not found';
  end if;
end;
$$;

grant execute on function public.update_support_request_status(bigint, text, text) to authenticated;
