create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email_notifications boolean not null default true,
  opportunity_updates boolean not null default true,
  marketing_notifications boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

drop policy if exists "Users can select their notification preferences" on public.notification_preferences;
drop policy if exists "Users can insert their notification preferences" on public.notification_preferences;
drop policy if exists "Users can update their notification preferences" on public.notification_preferences;

create policy "Users can select their notification preferences"
  on public.notification_preferences for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their notification preferences"
  on public.notification_preferences for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their notification preferences"
  on public.notification_preferences for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
