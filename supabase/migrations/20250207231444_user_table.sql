create table public.users (
  id uuid references auth.users on delete cascade,
  email text unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id)
);

alter table public.users enable row level security;

create policy "Users can read their own user data"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update their own user data"
  on public.users for update
  using (auth.uid() = id);

create policy "Users can delete their own user data"
  on public.users for delete
  using (auth.uid() = id);

create policy "Users can insert their own user data"
  on public.users for insert
  with check (auth.uid() = id);