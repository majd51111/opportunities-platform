drop function if exists public.update_pending_opportunity(text, text, text, text, text, text, text[], text[], text[], text[]);

create or replace function public.update_pending_opportunity(
  p_opportunity_id text,
  p_title text,
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
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.has_opportunity_review_access() then
    raise exception 'Review access is required';
  end if;

  if coalesce(trim(p_title), '') = ''
    or coalesce(trim(p_description), '') = ''
    or coalesce(trim(p_direct_url), '') = ''
    or p_direct_url !~ '^https?://' then
    raise exception 'Required opportunity details are invalid';
  end if;

  delete from public.opportunity_translations
  where opportunity_id::text = p_opportunity_id;

  update public.opportunities
  set title = trim(p_title),
      short_description = nullif(trim(p_short_description), ''),
      description = trim(p_description),
      direct_url = trim(p_direct_url),
      earnings_text = nullif(trim(p_earnings_text), ''),
      countries = p_countries,
      devices = p_devices,
      payment_methods = p_payment_methods,
      requirements = p_requirements,
      category_id = p_category_id
  where id::text = p_opportunity_id
    and status = 'pending';

  if not found then
    raise exception 'The pending opportunity was not found';
  end if;
end;
$$;

create or replace function public.update_published_opportunity(
  p_opportunity_id text,
  p_title text,
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
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_opportunity_admin() then
    raise exception 'Administrator access is required';
  end if;

  if coalesce(trim(p_title), '') = ''
    or coalesce(trim(p_description), '') = ''
    or coalesce(trim(p_direct_url), '') = ''
    or p_direct_url !~ '^https?://' then
    raise exception 'Required opportunity details are invalid';
  end if;

  delete from public.opportunity_translations
  where opportunity_id::text = p_opportunity_id;

  update public.opportunities
  set title = trim(p_title),
      short_description = nullif(trim(p_short_description), ''),
      description = trim(p_description),
      direct_url = trim(p_direct_url),
      earnings_text = nullif(trim(p_earnings_text), ''),
      countries = p_countries,
      devices = p_devices,
      payment_methods = p_payment_methods,
      requirements = p_requirements,
      category_id = p_category_id,
      verification_status = 'pending',
      reviewed_at = null,
      reviewed_by = null
  where id::text = p_opportunity_id
    and status = 'published';

  if not found then
    raise exception 'The published opportunity was not found';
  end if;
end;
$$;

create or replace function public.approve_published_opportunity(p_opportunity_id text)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_opportunity_admin() then
    raise exception 'Administrator access is required';
  end if;

  update public.opportunities
  set verification_status = 'verified',
      reviewed_by = auth.uid(),
      reviewed_at = now()
  where id::text = p_opportunity_id
    and status = 'published';

  if not found then
    raise exception 'The published opportunity was not found';
  end if;
end;
$$;

grant execute on function public.update_published_opportunity(text, text, text, text, text, text, text[], text[], text[], text[], bigint) to authenticated;
grant execute on function public.approve_published_opportunity(text) to authenticated;
grant execute on function public.update_pending_opportunity(text, text, text, text, text, text, text[], text[], text[], text[], bigint) to authenticated;