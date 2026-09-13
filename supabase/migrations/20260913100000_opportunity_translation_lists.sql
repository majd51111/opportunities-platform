alter table public.opportunity_translations
  add column if not exists countries text[],
  add column if not exists devices text[],
  add column if not exists payment_methods text[],
  add column if not exists requirements text[];

create or replace function public.save_opportunity_translations(
  p_opportunity_id bigint,
  p_translations jsonb
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  translation record;
  opportunity_owner uuid;
begin
  select submitted_by into opportunity_owner
  from public.opportunities
  where id = p_opportunity_id;

  if opportunity_owner is null
    or (opportunity_owner <> auth.uid() and not public.has_opportunity_review_access()) then
    raise exception 'You cannot update these opportunity translations';
  end if;

  for translation in
    select * from jsonb_to_recordset(p_translations) as item(
      language_code text,
      title text,
      short_description text,
      description text,
      earnings_text text,
      countries text[],
      devices text[],
      payment_methods text[],
      requirements text[]
    )
  loop
    insert into public.opportunity_translations (
      opportunity_id,
      language_code,
      title,
      short_description,
      description,
      earnings_text,
      countries,
      devices,
      payment_methods,
      requirements
    ) values (
      p_opportunity_id,
      translation.language_code,
      nullif(trim(translation.title), ''),
      nullif(trim(translation.short_description), ''),
      nullif(trim(translation.description), ''),
      nullif(trim(translation.earnings_text), ''),
      translation.countries,
      translation.devices,
      translation.payment_methods,
      translation.requirements
    )
    on conflict (opportunity_id, language_code) do update set
      title = excluded.title,
      short_description = excluded.short_description,
      description = excluded.description,
      earnings_text = excluded.earnings_text,
      countries = excluded.countries,
      devices = excluded.devices,
      payment_methods = excluded.payment_methods,
      requirements = excluded.requirements;
  end loop;
end;
$$;

grant execute on function public.save_opportunity_translations(bigint, jsonb) to authenticated;
