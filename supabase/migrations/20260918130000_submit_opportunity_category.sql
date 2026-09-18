drop function if exists public.submit_opportunity(text, text, text, text, text, text, text[], text[], text[], text[]);

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
  p_requirements text[] default null,
  p_category_id bigint default null
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
    countries, devices, payment_methods, requirements, category_id, status,
    verification_status, submitted_by
  ) values (
    trim(p_title), trim(p_slug), trim(p_short_description), trim(p_description), trim(p_direct_url),
    nullif(trim(p_earnings_text), ''), p_countries, p_devices, p_payment_methods,
    p_requirements, p_category_id, 'pending', 'pending', auth.uid()
  ) returning id into opportunity_id;

  return opportunity_id;
end;
$$;

grant execute on function public.submit_opportunity(text, text, text, text, text, text, text[], text[], text[], text[], bigint) to authenticated;
