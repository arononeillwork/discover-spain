-- Schema contract: tables, columns, RLS switched on everywhere, privileges locked down.
begin;
create extension if not exists pgtap with schema extensions;

select plan(33);

select tables_are('public', array[
  'guides', 'guide_steps', 'ride_options', 'airport_options', 'purchase_fees', 'mortgage_facts',
  'rate_types', 'resource_links', 'content_blocks', 'health_sections', 'health_points',
  'trade_categories', 'tradespeople', 'user_progress'
], 'public schema has exactly the contract tables');

select columns_are('public', 'guides', array[
  'slug', 'title', 'summary', 'category', 'time_estimate', 'cost', 'reviewed_on', 'documents', 'tips',
  'links', 'path_position', 'sort_order', 'published', 'created_at', 'updated_at'
]);
select columns_are('public', 'guide_steps', array['id', 'guide_slug', 'position', 'title', 'detail', 'link_label', 'link_url']);
select columns_are('public', 'ride_options', array[
  'id', 'name', 'kind', 'pricing', 'airport', 'booking', 'best_for', 'pros', 'cons', 'url', 'highlighted', 'sort_order'
]);
select columns_are('public', 'airport_options', array['id', 'name', 'detail', 'url', 'sort_order']);
select columns_are('public', 'purchase_fees', array[
  'id', 'name', 'resale_pct', 'new_build_pct', 'fixed_min', 'fixed_max', 'plus_vat', 'note', 'sort_order'
]);
select columns_are('public', 'mortgage_facts', array['id', 'label', 'value', 'sort_order']);
select columns_are('public', 'rate_types', array['id', 'name', 'detail', 'sort_order']);
select columns_are('public', 'resource_links', array['id', 'section', 'label', 'url', 'note', 'sort_order']);
select columns_are('public', 'content_blocks', array['key', 'body']);
select columns_are('public', 'health_sections', array['id', 'title', 'intro', 'links', 'sort_order']);
select columns_are('public', 'health_points', array['id', 'section_id', 'title', 'detail', 'sort_order']);
select columns_are('public', 'trade_categories', array['name', 'sort_order']);
select columns_are('public', 'tradespeople', array[
  'id', 'name', 'trade', 'areas', 'phone', 'whatsapp', 'languages', 'notes', 'verified', 'is_placeholder',
  'status', 'recommended_by', 'submitted_by', 'created_at'
]);
select columns_are('public', 'user_progress', array['user_id', 'step_id', 'completed_at']);

select is(
  (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity),
  0::bigint,
  'RLS is enabled on every public table'
);

-- anon/authenticated hold no write privileges anywhere except the two deliberate exceptions.
select is(
  (select count(*) from information_schema.role_table_grants
    where table_schema = 'public' and grantee in ('anon', 'authenticated')
      and privilege_type <> 'SELECT'
      and not (table_name = 'user_progress' and grantee = 'authenticated' and privilege_type in ('INSERT', 'DELETE'))),
  0::bigint,
  'no table-level write privileges for anon/authenticated (except own progress)'
);
select ok(not has_table_privilege('anon', 'public.user_progress', 'SELECT'), 'anon has no access to user_progress');

-- Column-level insert whitelist on tradespeople.
select ok(has_column_privilege('anon', 'public.tradespeople', 'name', 'INSERT'), 'anon may supply name');
select ok(has_column_privilege('anon', 'public.tradespeople', 'recommended_by', 'INSERT'), 'anon may supply recommended_by');
select ok(not has_column_privilege('anon', 'public.tradespeople', 'status', 'INSERT'), 'anon may not supply status');
select ok(not has_column_privilege('anon', 'public.tradespeople', 'verified', 'INSERT'), 'anon may not supply verified');
select ok(not has_column_privilege('authenticated', 'public.tradespeople', 'is_placeholder', 'INSERT'),
  'authenticated may not supply is_placeholder');
select ok(not has_column_privilege('anon', 'public.tradespeople', 'id', 'INSERT'), 'anon may not supply id');

-- Column-level read whitelist on tradespeople: the recommender's contact and account stay private.
select ok(has_column_privilege('anon', 'public.tradespeople', 'name', 'SELECT'), 'anon may read name');
select ok(not has_table_privilege('anon', 'public.tradespeople', 'SELECT'), 'anon has no table-wide SELECT on tradespeople');
select ok(not has_column_privilege('anon', 'public.tradespeople', 'recommended_by', 'SELECT'), 'anon may not read recommended_by');
select ok(not has_column_privilege('anon', 'public.tradespeople', 'submitted_by', 'SELECT'), 'anon may not read submitted_by');
select ok(not has_column_privilege('authenticated', 'public.tradespeople', 'recommended_by', 'SELECT'),
  'authenticated may not read recommended_by');
select ok(not has_column_privilege('authenticated', 'public.tradespeople', 'submitted_by', 'SELECT'),
  'authenticated may not read submitted_by');

-- New objects created by later migrations are not exposed to the API roles by default.
create table public.pgtap_default_privs_probe (id int);
select ok(
  not has_table_privilege('anon', 'public.pgtap_default_privs_probe', 'SELECT')
    and not has_table_privilege('authenticated', 'public.pgtap_default_privs_probe', 'INSERT'),
  'new public tables are not granted to anon/authenticated by default'
);

-- updated_at trigger on guides.
update public.guides set title = title || '' where slug = 'nie';
select is((select updated_at from public.guides where slug = 'nie'), now(), 'guides.updated_at is bumped on update');
select ok(
  (select created_at < updated_at from public.guides where slug = 'nie'),
  'created_at is preserved on update'
);

select * from finish();
rollback;
