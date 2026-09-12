alter table public.reports
drop constraint if exists reports_status_check;

update public.reports
set status = 'pending'
where status is null
   or status not in ('pending', 'reviewed', 'resolved', 'rejected');

alter table public.reports
  alter column status set default 'pending',
  alter column status set not null,
  add constraint reports_status_check
    check (status in ('pending', 'reviewed', 'resolved', 'rejected'));
