-- Content tables: readable by anon + authenticated, never writable by them.
begin;
create extension if not exists pgtap with schema extensions;

select plan(26);

insert into auth.users (id, email, aud, role)
values ('aaaaaaaa-0000-4000-8000-000000000001', 'reader@example.com', 'authenticated', 'authenticated');

-- Hide one guide to check the published filter (rolled back at the end).
update public.guides set published = false where slug = 'taxes';

-- ---- anon reads ------------------------------------------------------------
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select is((select count(*) from public.guides), 8::bigint, 'anon sees published guides only');
select is((select count(*) from public.guides where slug = 'taxes'), 0::bigint, 'anon cannot see an unpublished guide');
select is((select count(*) from public.guide_steps where guide_slug = 'taxes'), 0::bigint,
  'anon cannot see steps of an unpublished guide');
select is((select count(*) from public.guide_steps), 28::bigint, 'anon sees steps of published guides');
select results_eq(
  'select slug from public.guides where path_position is not null order by path_position',
  array['nie', 'padron', 'bank-account', 'social-security', 'health-card', 'digital-certificate', 'driving-licence'],
  'home path order'
);
select is((select count(*) from public.ride_options), 4::bigint, 'anon reads ride_options');
select is((select name from public.ride_options where highlighted), 'PideTaxi', 'PideTaxi is highlighted');
select is((select count(*) from public.airport_options), 4::bigint, 'anon reads airport_options');
select is((select count(*) from public.purchase_fees), 8::bigint, 'anon reads purchase_fees');
select is((select count(*) from public.mortgage_facts), 4::bigint, 'anon reads mortgage_facts');
select is((select count(*) from public.rate_types), 3::bigint, 'anon reads rate_types');
select is((select count(*) from public.resource_links), 8::bigint, 'anon reads resource_links');
select is((select count(*) from public.content_blocks), 1::bigint, 'anon reads content_blocks');
select is((select count(*) from public.health_sections), 3::bigint, 'anon reads health_sections');
select is((select count(*) from public.health_points), 12::bigint, 'anon reads health_points');
select is((select count(*) from public.trade_categories), 5::bigint, 'anon reads trade_categories');

-- ---- anon writes -----------------------------------------------------------
select throws_ok($$insert into public.guides (slug, title, summary, category, time_estimate, cost)
  values ('x', 'x', 'x', 'Money', 'x', 'x')$$, '42501', null, 'anon cannot insert guides');
select throws_ok($$update public.guides set title = 'hacked'$$, '42501', null, 'anon cannot update guides');
select throws_ok($$delete from public.guide_steps$$, '42501', null, 'anon cannot delete guide_steps');
select throws_ok($$update public.content_blocks set body = 'hacked'$$, '42501', null, 'anon cannot update content_blocks');
select throws_ok($$insert into public.trade_categories (name) values ('Roofer')$$, '42501', null,
  'anon cannot add trade categories');

-- ---- authenticated ---------------------------------------------------------
reset role;
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"aaaaaaaa-0000-4000-8000-000000000001","role":"authenticated"}', true);

select is((select count(*) from public.guides), 8::bigint, 'authenticated sees published guides only');
select is((select count(*) from public.health_points), 12::bigint, 'authenticated reads content');
select throws_ok($$update public.ride_options set highlighted = true$$, '42501', null,
  'authenticated cannot update ride_options');
select throws_ok($$delete from public.purchase_fees$$, '42501', null, 'authenticated cannot delete purchase_fees');
select throws_ok($$insert into public.health_sections (id, title, intro) values ('x', 'x', 'x')$$, '42501', null,
  'authenticated cannot insert health_sections');

select * from finish();
rollback;
