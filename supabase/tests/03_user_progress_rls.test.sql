-- user_progress: each signed-in user sees and changes only their own rows; anon gets nothing.
begin;
create extension if not exists pgtap with schema extensions;

select plan(17);

insert into auth.users (id, email, aud, role) values
  ('cccccccc-0000-4000-8000-00000000000a', 'user-a@example.com', 'authenticated', 'authenticated'),
  ('cccccccc-0000-4000-8000-00000000000b', 'user-b@example.com', 'authenticated', 'authenticated');

create temp table ids on commit drop as
select
  (select id from public.guide_steps where guide_slug = 'nie' and position = 1) as s1,
  (select id from public.guide_steps where guide_slug = 'nie' and position = 2) as s2,
  (select id from public.guide_steps where guide_slug = 'padron' and position = 1) as s3;
grant select on ids to anon, authenticated;

-- User B already has progress.
insert into public.user_progress (user_id, step_id)
select 'cccccccc-0000-4000-8000-00000000000b'::uuid, s1 from ids
union all
select 'cccccccc-0000-4000-8000-00000000000b'::uuid, s3 from ids;

-- ---- user A ----------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-4000-8000-00000000000a","role":"authenticated"}', true);

select is((select count(*) from public.user_progress), 0::bigint, 'user A cannot see user B progress');

select lives_ok($$insert into public.user_progress (step_id) select s1 from ids$$,
  'user A can mark a step done (user_id defaults to auth.uid())');
select lives_ok($$insert into public.user_progress (user_id, step_id)
  select 'cccccccc-0000-4000-8000-00000000000a'::uuid, s2 from ids$$,
  'user A can mark a step done with an explicit own user_id');
select is((select count(*) from public.user_progress), 2::bigint, 'user A sees exactly their own 2 rows');
select is(
  (select count(*) from public.user_progress where user_id <> 'cccccccc-0000-4000-8000-00000000000a'),
  0::bigint, 'user A sees no other user rows');

select throws_ok($$insert into public.user_progress (user_id, step_id)
  select 'cccccccc-0000-4000-8000-00000000000b'::uuid, s2 from ids$$,
  '42501', 'new row violates row-level security policy for table "user_progress"',
  'user A cannot write progress for user B');
select throws_ok($$update public.user_progress set completed_at = now()$$, '42501', null,
  'user A cannot update progress rows');

select lives_ok($$delete from public.user_progress where user_id = 'cccccccc-0000-4000-8000-00000000000b'$$,
  'deleting user B rows as user A is a silent no-op');
select lives_ok($$delete from public.user_progress where step_id = (select s2 from ids)$$,
  'user A can un-mark their own step');
select is((select count(*) from public.user_progress), 1::bigint, 'user A has 1 row left');

-- ---- anon ------------------------------------------------------------------
reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select throws_ok($$select count(*) from public.user_progress$$, '42501', null, 'anon cannot read user_progress');
select throws_ok($$insert into public.user_progress (user_id, step_id)
  select 'cccccccc-0000-4000-8000-00000000000b'::uuid, s2 from ids$$, '42501', null, 'anon cannot insert user_progress');
select throws_ok($$delete from public.user_progress$$, '42501', null, 'anon cannot delete user_progress');

-- ---- user B, then verify as admin ------------------------------------------
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-4000-8000-00000000000b","role":"authenticated"}', true);
select is((select count(*) from public.user_progress), 2::bigint, 'user B still sees exactly their own 2 rows');

reset role;
select is(
  (select count(*) from public.user_progress where user_id = 'cccccccc-0000-4000-8000-00000000000b'),
  2::bigint, 'user B rows survived user A delete attempt');
select is(
  (select count(*) from public.user_progress where user_id = 'cccccccc-0000-4000-8000-00000000000a'),
  1::bigint, 'user A has one stored row');

delete from auth.users where id = 'cccccccc-0000-4000-8000-00000000000a';
select is(
  (select count(*) from public.user_progress where user_id = 'cccccccc-0000-4000-8000-00000000000a'),
  0::bigint, 'progress is removed when the user is deleted');

select * from finish();
rollback;
