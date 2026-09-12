
alter table public.opportunities enable row level security;

drop policy if exists "Users and reviewers can view submitted opportunities"
  on public.opportunities;

create policy "Users and reviewers can view submitted opportunities"
  on public.opportunities for select to authenticated
  using (
    status = 'published'
    or submitted_by = auth.uid()
    or public.has_opportunity_review_access()
  );
