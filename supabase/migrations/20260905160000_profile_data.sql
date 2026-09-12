create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email_notifications boolean not null default true,
  opportunity_updates boolean not null default true,
  marketing_notifications boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

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

create table if not exists public.payout_details (
  user_id uuid primary key references auth.users(id) on delete cascade,
  account_holder_name text not null,
  bank_name text not null,
  iban text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payout_details enable row level security;

create policy "Users can select their payout details"
  on public.payout_details for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their payout details"
  on public.payout_details for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their payout details"
  on public.payout_details for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their payout details"
  on public.payout_details for delete
  to authenticated
  using (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', false)
on conflict (id) do nothing;

create policy "Users can view their avatar"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "Users can upload their avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "Users can update their avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "Users can delete their avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
