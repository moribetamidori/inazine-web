create table public.zines (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  user_id uuid references public.users(id) on delete cascade not null,
  privacy text default 'closed' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.zines enable row level security;

create policy "Users can read public zines"
  on public.zines for select
  using (privacy = 'public' or auth.uid() = user_id);

create policy "Users can create their own zines"
  on public.zines for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own zines"
  on public.zines for update
  using (auth.uid() = user_id);

create policy "Users can delete their own zines"
  on public.zines for delete
  using (auth.uid() = user_id); 