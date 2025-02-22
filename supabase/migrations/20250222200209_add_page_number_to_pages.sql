alter table public.pages
add column page_order integer default 0;

-- Update existing pages to have sequential order
with numbered_pages as (
  select id, row_number() over (partition by zine_id order by created_at) - 1 as rnum
  from pages
)
update pages
set page_order = numbered_pages.rnum
from numbered_pages
where pages.id = numbered_pages.id;