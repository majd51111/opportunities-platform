insert into public.categories (name)
select 'الألعاب'
where not exists (
  select 1
  from public.categories
  where lower(trim(name)) = lower('الألعاب')
);