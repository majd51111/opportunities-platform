do $$
declare
  constraint_record record;
begin
  for constraint_record in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace schema_info on schema_info.oid = rel.relnamespace
    where schema_info.nspname = 'public'
      and rel.relname = 'opportunities'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%status%'
  loop
    execute format('alter table public.opportunities drop constraint if exists %I', constraint_record.conname);
  end loop;
end $$;

alter table public.opportunities
  add constraint opportunities_status_check
  check (status in ('draft', 'pending', 'published', 'archived', 'rejected'));
