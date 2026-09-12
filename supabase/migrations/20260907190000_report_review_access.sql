create or replace function public.update_report_status(
  p_report_id bigint,
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

grant execute on function public.update_report_status(bigint, text) to authenticated;
