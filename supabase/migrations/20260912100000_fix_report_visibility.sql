drop policy if exists "Users can view their own reports" on public.reports;

create policy "Users and report managers can view reports"
  on public.reports for select to authenticated
  using (
    user_id = auth.uid()
    or public.is_opportunity_admin()
    or public.has_support_permission('manage_reports')
  );