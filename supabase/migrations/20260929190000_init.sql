-- Discover Spain: initial schema.
--
-- Content tables (guides, transport, mortgages, healthcare, trades) are public-read and
-- edited only by admins (Supabase Studio / service role). Visitors can suggest a
-- tradesperson (lands as 'pending'), and signed-in users can track their own checklist
-- progress.
--
-- Security model (every table has RLS enabled):
--   * anon + authenticated: SELECT on content (guides/guide_steps only when published).
--   * No INSERT/UPDATE/DELETE privileges or policies on content for anon/authenticated.
--   * tradespeople: SELECT only approved rows and only the directory columns (never
--     recommended_by / submitted_by); INSERT only pending suggestions, limited to a
--     whitelisted set of columns (status/verified/is_placeholder/id/created_at cannot even be
--     supplied), and RLS WITH CHECK re-validates the moderation flags.
--   * user_progress: authenticated users SELECT/INSERT/DELETE their own rows only; anon nothing.
--   * service_role keeps full access (it bypasses RLS) for admin tooling.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Guides
-- ---------------------------------------------------------------------------

create table public.guides (
  slug          text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title         text not null check (char_length(title) between 1 and 200),
  summary       text not null,
  category      text not null check (category in ('Paperwork', 'Money', 'Health', 'Driving', 'Home')),
  time_estimate text not null,
  cost          text not null,
  reviewed_on   date not null default current_date,
  documents     text[] not null default '{}',
  tips          text[] not null default '{}',
  links         jsonb not null default '[]' check (jsonb_typeof(links) = 'array'), -- [{label, url, note?}]
  path_position int unique check (path_position > 0), -- order on the home "Your path"; null = not on path
  sort_order    int not null default 0,
  published     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on column public.guides.links is 'JSON array of {label, url, note?}';
comment on column public.guides.path_position is 'Order on the home page "Your path" (1-based). NULL = not on the path.';

create index guides_sort_order_idx on public.guides (sort_order);

create trigger guides_set_updated_at
  before update on public.guides
  for each row execute function public.set_updated_at();

create table public.guide_steps (
  id         bigint generated always as identity primary key,
  guide_slug text not null references public.guides (slug) on update cascade on delete cascade,
  position   int not null check (position > 0),
  title      text not null,
  detail     text not null,
  link_label text,
  link_url   text,
  unique (guide_slug, position),
  constraint guide_steps_link_pair check ((link_label is null) = (link_url is null))
);

comment on column public.guide_steps.position is '1-based order of the step within its guide.';

-- ---------------------------------------------------------------------------
-- Transport
-- ---------------------------------------------------------------------------

create table public.ride_options (
  id          bigint generated always as identity primary key,
  name        text not null,
  kind        text not null check (kind in ('Licensed taxi', 'VTC (private hire)')),
  pricing     text not null,
  airport     text not null,
  booking     text not null,
  best_for    text not null,
  pros        text[] not null default '{}',
  cons        text[] not null default '{}',
  url         text not null,
  highlighted boolean not null default false,
  sort_order  int not null default 0
);

create index ride_options_sort_order_idx on public.ride_options (sort_order);

create table public.airport_options (
  id         bigint generated always as identity primary key,
  name       text not null,
  detail     text not null,
  url        text,
  sort_order int not null default 0
);

create index airport_options_sort_order_idx on public.airport_options (sort_order);

-- ---------------------------------------------------------------------------
-- Mortgages / buying
-- ---------------------------------------------------------------------------

create table public.purchase_fees (
  id            bigint generated always as identity primary key,
  name          text not null,
  resale_pct    numeric check (resale_pct between 0 and 100),
  new_build_pct numeric check (new_build_pct between 0 and 100),
  fixed_min     int check (fixed_min >= 0),
  fixed_max     int check (fixed_max >= 0),
  plus_vat      boolean not null default false,
  note          text not null,
  sort_order    int not null default 0,
  constraint purchase_fees_fixed_range check (
    (fixed_min is null) = (fixed_max is null) and (fixed_min is null or fixed_min <= fixed_max)
  )
);

comment on column public.purchase_fees.resale_pct is 'Percent of purchase price for resale properties (null = n/a).';
comment on column public.purchase_fees.new_build_pct is 'Percent of purchase price for new builds (null = n/a).';
comment on column public.purchase_fees.plus_vat is 'True when 21% IVA is charged on top of the fee.';

create index purchase_fees_sort_order_idx on public.purchase_fees (sort_order);

create table public.mortgage_facts (
  id         bigint generated always as identity primary key,
  label      text not null,
  value      text not null,
  sort_order int not null default 0
);

create index mortgage_facts_sort_order_idx on public.mortgage_facts (sort_order);

create table public.rate_types (
  id         bigint generated always as identity primary key,
  name       text not null,
  detail     text not null,
  sort_order int not null default 0
);

create index rate_types_sort_order_idx on public.rate_types (sort_order);

create table public.resource_links (
  id         bigint generated always as identity primary key,
  section    text not null check (section in ('property_search', 'mortgage_compare')),
  label      text not null,
  url        text not null,
  note       text,
  sort_order int not null default 0
);

create index resource_links_section_sort_idx on public.resource_links (section, sort_order);

create table public.content_blocks (
  key  text primary key check (key ~ '^[a-z0-9_]+(\.[a-z0-9_]+)*$'), -- e.g. 'mortgages.buyer_protections'
  body text not null
);

-- ---------------------------------------------------------------------------
-- Healthcare
-- ---------------------------------------------------------------------------

create table public.health_sections (
  id         text primary key,
  title      text not null,
  intro      text not null,
  links      jsonb not null default '[]' check (jsonb_typeof(links) = 'array'), -- [{label, url, note?}]
  sort_order int not null default 0
);

create index health_sections_sort_order_idx on public.health_sections (sort_order);

create table public.health_points (
  id         bigint generated always as identity primary key,
  section_id text not null references public.health_sections (id) on update cascade on delete cascade,
  title      text not null,
  detail     text not null,
  sort_order int not null default 0
);

create index health_points_section_sort_idx on public.health_points (section_id, sort_order);

-- ---------------------------------------------------------------------------
-- Trades directory
-- ---------------------------------------------------------------------------

create table public.trade_categories (
  name       text primary key check (char_length(name) between 1 and 60),
  sort_order int not null default 0
);

create index trade_categories_sort_order_idx on public.trade_categories (sort_order);

create table public.tradespeople (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  trade          text not null references public.trade_categories (name) on update cascade,
  areas          text[] not null default '{}',
  phone          text not null,
  whatsapp       text, -- international format, digits only, e.g. 34600000000
  languages      text[] not null default '{}',
  notes          text not null default '',
  verified       boolean not null default false,
  is_placeholder boolean not null default false,
  status         text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  recommended_by text, -- free-text contact of the person suggesting
  submitted_by   uuid references auth.users (id) on delete set null,
  created_at     timestamptz not null default now(),

  -- Sanity / anti-abuse limits (suggestions come from anonymous visitors). Text limits bound the
  -- raw length (so whitespace padding can't be used to store huge values) and require a
  -- non-blank value.
  constraint tradespeople_name_len check (char_length(name) <= 100 and char_length(btrim(name)) >= 2),
  constraint tradespeople_phone_format check (
    char_length(phone) between 6 and 30 and phone ~ '^\+?[0-9][0-9 ().-]*$'
  ),
  constraint tradespeople_whatsapp_format check (whatsapp is null or whatsapp ~ '^[0-9]{8,15}$'),
  constraint tradespeople_areas_len check (
    cardinality(areas) <= 10
    and array_position(areas, null) is null
    and char_length(array_to_string(areas, '|')) <= 500
  ),
  constraint tradespeople_languages_len check (
    cardinality(languages) <= 10
    and array_position(languages, null) is null
    and char_length(array_to_string(languages, '|')) <= 200
  ),
  constraint tradespeople_notes_len check (char_length(notes) <= 1000),
  constraint tradespeople_recommended_by_len check (
    recommended_by is null or (char_length(recommended_by) <= 200 and char_length(btrim(recommended_by)) >= 1)
  )
);

comment on table public.tradespeople is
  'Public directory. Visitors may insert suggestions (status=pending); admins approve in Studio.';

create index tradespeople_trade_idx on public.tradespeople (trade);
create index tradespeople_status_idx on public.tradespeople (status);
create index tradespeople_submitted_by_idx on public.tradespeople (submitted_by);

-- ---------------------------------------------------------------------------
-- Per-user checklist progress
-- ---------------------------------------------------------------------------

create table public.user_progress (
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  step_id      bigint not null references public.guide_steps (id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, step_id)
);

create index user_progress_step_id_idx on public.user_progress (step_id);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.guides           enable row level security;
alter table public.guide_steps      enable row level security;
alter table public.ride_options     enable row level security;
alter table public.airport_options  enable row level security;
alter table public.purchase_fees    enable row level security;
alter table public.mortgage_facts   enable row level security;
alter table public.rate_types       enable row level security;
alter table public.resource_links   enable row level security;
alter table public.content_blocks   enable row level security;
alter table public.health_sections  enable row level security;
alter table public.health_points    enable row level security;
alter table public.trade_categories enable row level security;
alter table public.tradespeople     enable row level security;
alter table public.user_progress    enable row level security;

-- Content: read-only for everyone.
create policy "Published guides are public" on public.guides
  for select to anon, authenticated using (published);

create policy "Steps of published guides are public" on public.guide_steps
  for select to anon, authenticated
  using (exists (select 1 from public.guides g where g.slug = guide_slug and g.published));

create policy "Ride options are public" on public.ride_options
  for select to anon, authenticated using (true);
create policy "Airport options are public" on public.airport_options
  for select to anon, authenticated using (true);
create policy "Purchase fees are public" on public.purchase_fees
  for select to anon, authenticated using (true);
create policy "Mortgage facts are public" on public.mortgage_facts
  for select to anon, authenticated using (true);
create policy "Rate types are public" on public.rate_types
  for select to anon, authenticated using (true);
create policy "Resource links are public" on public.resource_links
  for select to anon, authenticated using (true);
create policy "Content blocks are public" on public.content_blocks
  for select to anon, authenticated using (true);
create policy "Health sections are public" on public.health_sections
  for select to anon, authenticated using (true);
create policy "Health points are public" on public.health_points
  for select to anon, authenticated using (true);
create policy "Trade categories are public" on public.trade_categories
  for select to anon, authenticated using (true);

-- Tradespeople: approved entries are public; anyone may suggest a pending entry.
create policy "Approved tradespeople are public" on public.tradespeople
  for select to anon, authenticated using (status = 'approved');

create policy "Anyone can suggest a tradesperson" on public.tradespeople
  for insert to anon, authenticated
  with check (
    status = 'pending'
    and verified = false
    and is_placeholder = false
    and (submitted_by is null or submitted_by = (select auth.uid()))
  );

-- Progress: own rows only, signed-in users only.
create policy "Users read own progress" on public.user_progress
  for select to authenticated using (user_id = (select auth.uid()));

create policy "Users add own progress" on public.user_progress
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy "Users remove own progress" on public.user_progress
  for delete to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Privileges (explicit; do not rely on Supabase's permissive default grants)
-- ---------------------------------------------------------------------------

revoke all on table
  public.guides, public.guide_steps, public.ride_options, public.airport_options,
  public.purchase_fees, public.mortgage_facts, public.rate_types, public.resource_links,
  public.content_blocks, public.health_sections, public.health_points,
  public.trade_categories, public.tradespeople, public.user_progress
from anon, authenticated;

revoke all on all sequences in schema public from anon, authenticated;

grant select on table
  public.guides, public.guide_steps, public.ride_options, public.airport_options,
  public.purchase_fees, public.mortgage_facts, public.rate_types, public.resource_links,
  public.content_blocks, public.health_sections, public.health_points,
  public.trade_categories
to anon, authenticated;

-- Directory columns only. RLS filters rows, not columns, so without this an approved entry would
-- expose who recommended it (recommended_by, a private contact) and their account id
-- (submitted_by) through the API. Admins see them in Studio.
grant select (id, name, trade, areas, phone, whatsapp, languages, notes, verified, is_placeholder, status, created_at)
  on table public.tradespeople to anon, authenticated;

-- Suggestions: only these columns may be supplied. status / verified / is_placeholder /
-- id / created_at always take their defaults (pending / false / false / generated / now()).
grant insert (name, trade, areas, phone, whatsapp, languages, notes, recommended_by, submitted_by)
  on table public.tradespeople to anon, authenticated;

grant select, insert, delete on table public.user_progress to authenticated;

grant all on table
  public.guides, public.guide_steps, public.ride_options, public.airport_options,
  public.purchase_fees, public.mortgage_facts, public.rate_types, public.resource_links,
  public.content_blocks, public.health_sections, public.health_points,
  public.trade_categories, public.tradespeople, public.user_progress
to service_role;

grant usage, select on all sequences in schema public to service_role;

-- Supabase's default privileges grant every new public table and sequence to the API roles.
-- Switch that off for objects created by migrations, so a future table is never exposed by
-- accident: each migration must enable RLS and grant explicitly, as above. (Functions still get
-- the default EXECUTE grant: revoke it explicitly on any new function, like set_updated_at.)
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
