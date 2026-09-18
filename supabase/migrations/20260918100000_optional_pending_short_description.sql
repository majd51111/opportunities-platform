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
	p_requirements text[] default null
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

	update public.opportunities
	set title = trim(p_title),
			short_description = nullif(trim(p_short_description), ''),
			description = trim(p_description),
			direct_url = trim(p_direct_url),
			earnings_text = nullif(trim(p_earnings_text), ''),
			countries = p_countries,
			devices = p_devices,
			payment_methods = p_payment_methods,
			requirements = p_requirements
	where id::text = p_opportunity_id
		and status = 'pending';

	if not found then
		raise exception 'The pending opportunity was not found';
	end if;
end;
$$;

grant execute on function public.update_pending_opportunity(text, text, text, text, text, text, text[], text[], text[], text[]) to authenticated;
ِ