-- Enable the moddatetime extension
create extension if not exists moddatetime;

-- Create pages table
create table public.pages (
  id uuid default gen_random_uuid() primary key,
  zine_id uuid references public.zines(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create elements table
create table public.elements (
  id uuid default gen_random_uuid() primary key,
  page_id uuid references public.pages(id) on delete cascade not null,
  type text check (type in ('text', 'image')) not null,
  content text not null,
  position_x numeric not null,
  position_y numeric not null,
  width numeric,
  height numeric,
  scale numeric not null default 1,
  z_index integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.pages enable row level security;
alter table public.elements enable row level security;

-- Pages policies
create policy "Users can read pages of zines they have access to"
  on public.pages for select
  using (
    exists (
      select 1 from public.zines
      where zines.id = pages.zine_id
      and (zines.privacy = 'public' or zines.user_id = auth.uid())
    )
  );

create policy "Users can create pages in their own zines"
  on public.pages for insert
  with check (
    exists (
      select 1 from public.zines
      where zines.id = zine_id
      and zines.user_id = auth.uid()
    )
  );

create policy "Users can update pages in their own zines"
  on public.pages for update
  using (
    exists (
      select 1 from public.zines
      where zines.id = zine_id
      and zines.user_id = auth.uid()
    )
  );

create policy "Users can delete pages in their own zines"
  on public.pages for delete
  using (
    exists (
      select 1 from public.zines
      where zines.id = zine_id
      and zines.user_id = auth.uid()
    )
  );

-- Elements policies
create policy "Users can read elements of pages they have access to"
  on public.elements for select
  using (
    exists (
      select 1 from public.pages
      join public.zines on zines.id = pages.zine_id
      where pages.id = elements.page_id
      and (zines.privacy = 'public' or zines.user_id = auth.uid())
    )
  );

create policy "Users can create elements in their own pages"
  on public.elements for insert
  with check (
    exists (
      select 1 from public.pages
      join public.zines on zines.id = pages.zine_id
      where pages.id = page_id
      and zines.user_id = auth.uid()
    )
  );

create policy "Users can update elements in their own pages"
  on public.elements for update
  using (
    exists (
      select 1 from public.pages
      join public.zines on zines.id = pages.zine_id
      where pages.id = page_id
      and zines.user_id = auth.uid()
    )
  );

create policy "Users can delete elements in their own pages"
  on public.elements for delete
  using (
    exists (
      select 1 from public.pages
      join public.zines on zines.id = pages.zine_id
      where pages.id = page_id
      and zines.user_id = auth.uid()
    )
  );

-- Add triggers for updated_at
create trigger handle_updated_at before update on public.pages
  for each row execute procedure moddatetime (updated_at);

create trigger handle_updated_at before update on public.elements
  for each row execute procedure moddatetime (updated_at); 