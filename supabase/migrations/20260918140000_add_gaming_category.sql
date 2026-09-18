insert into public.categories (name, slug)
select 'الألعاب', 'gaming'
where not exists (
  select 1
  from public.categories
  where lower(trim(name)) = lower('الألعاب')
    or lower(trim(slug)) = 'gaming'
  );