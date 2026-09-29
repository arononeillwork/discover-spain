-- Tradespeople: only approved rows are public; visitors can only add pending suggestions.
begin;
create extension if not exists pgtap with schema extensions;

select plan(30);

insert into auth.users (id, email, aud, role) values
  ('bbbbbbbb-0000-4000-8000-00000000000a', 'suggester-a@example.com', 'authenticated', 'authenticated'),
  ('bbbbbbbb-0000-4000-8000-00000000000b', 'suggester-b@example.com', 'authenticated', 'authenticated');

-- Non-public rows created by an admin.
insert into public.tradespeople (name, trade, phone, status) values
  ('Pending Pete', 'Plumber', '+34 611 111 111', 'pending'),
  ('Rejected Rita', 'Cleaner', '+34 622 222 222', 'rejected');

-- ---- anon ------------------------------------------------------------------
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select is((select count(*) from public.tradespeople), 5::bigint, 'anon sees only the 5 approved entries');
select is((select count(*) from public.tradespeople where status <> 'approved'), 0::bigint,
  'anon cannot see pending or rejected entries');
select is((select count(*) from public.tradespeople where name = 'Pending Pete'), 0::bigint,
  'anon cannot see a pending entry by name');
select throws_ok($$select recommended_by from public.tradespeople$$, '42501', null,
  'anon cannot read who recommended an approved entry');

select lives_ok($$
  insert into public.tradespeople (name, trade, areas, phone, whatsapp, languages, notes, recommended_by)
  values ('Anon Suggestion', 'Electrician', array['Marbella'], '+34 633 333 333', '34633333333',
          array['English'], 'Great work on our boletín.', 'jane@example.com')
$$, 'anon can insert a pending suggestion');

select is((select count(*) from public.tradespeople where name = 'Anon Suggestion'), 0::bigint,
  'anon cannot read back its own pending suggestion');

-- Smuggling moderation flags is blocked by column privileges...
select throws_ok($$insert into public.tradespeople (name, trade, phone, status)
  values ('Sneaky', 'Plumber', '+34 644 444 444', 'approved')$$, '42501', null,
  'anon cannot insert with status=approved');
select throws_ok($$insert into public.tradespeople (name, trade, phone, verified)
  values ('Sneaky', 'Plumber', '+34 644 444 444', true)$$, '42501', null,
  'anon cannot insert with verified=true');
select throws_ok($$insert into public.tradespeople (name, trade, phone, is_placeholder)
  values ('Sneaky', 'Plumber', '+34 644 444 444', true)$$, '42501', null,
  'anon cannot insert with is_placeholder=true');
select throws_ok($$insert into public.tradespeople (name, trade, phone, submitted_by)
  values ('Sneaky', 'Plumber', '+34 644 444 444', 'bbbbbbbb-0000-4000-8000-00000000000a')$$,
  '42501', 'new row violates row-level security policy for table "tradespeople"',
  'anon cannot attribute a suggestion to a user');

-- Sanity limits.
select throws_ok($$insert into public.tradespeople (name, trade, phone) values (repeat('x', 101), 'Plumber', '+34 655 555 555')$$,
  '23514', null, 'overlong name is rejected');
select throws_ok($$insert into public.tradespeople (name, trade, phone) values ('ab' || repeat(' ', 1000), 'Plumber', '+34 655 555 555')$$,
  '23514', null, 'whitespace-padded name is rejected (raw length is bounded)');
select throws_ok($$insert into public.tradespeople (name, trade, phone) values ('   ', 'Plumber', '+34 655 555 555')$$,
  '23514', null, 'blank name is rejected');
select throws_ok($$insert into public.tradespeople (name, trade, phone, recommended_by)
  values ('Padded rec', 'Plumber', '+34 655 555 555', 'a' || repeat(' ', 1000))$$,
  '23514', null, 'whitespace-padded recommended_by is rejected (raw length is bounded)');
select throws_ok($$insert into public.tradespeople (name, trade, phone, recommended_by)
  values ('Blank rec', 'Plumber', '+34 655 555 555', '  ')$$,
  '23514', null, 'blank recommended_by is rejected');
select throws_ok($$insert into public.tradespeople (name, trade, phone, whatsapp) values ('Bad WA', 'Plumber', '+34 655 555 555', '+34 655')$$,
  '23514', null, 'non-digit whatsapp is rejected');
select throws_ok($$insert into public.tradespeople (name, trade, phone, notes) values ('Long notes', 'Plumber', '+34 655 555 555', repeat('x', 1001))$$,
  '23514', null, 'overlong notes are rejected');
select throws_ok($$insert into public.tradespeople (name, trade, phone) values ('Bad trade', 'Astronaut', '+34 655 555 555')$$,
  '23503', null, 'unknown trade is rejected');

-- No updates or deletes.
select throws_ok($$update public.tradespeople set status = 'approved'$$, '42501', null, 'anon cannot update tradespeople');
select throws_ok($$delete from public.tradespeople$$, '42501', null, 'anon cannot delete tradespeople');

-- ---- RLS WITH CHECK is a second, independent layer -----------------------
-- Temporarily grant the flag columns so only the policy stands in the way.
reset role;
grant insert (status, verified, is_placeholder) on public.tradespeople to anon, authenticated;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select throws_ok($$insert into public.tradespeople (name, trade, phone, status)
  values ('Sneaky', 'Plumber', '+34 644 444 444', 'approved')$$,
  '42501', 'new row violates row-level security policy for table "tradespeople"',
  'RLS blocks status=approved even with column privilege');
select throws_ok($$insert into public.tradespeople (name, trade, phone, verified)
  values ('Sneaky', 'Plumber', '+34 644 444 444', true)$$,
  '42501', 'new row violates row-level security policy for table "tradespeople"',
  'RLS blocks verified=true even with column privilege');
select throws_ok($$insert into public.tradespeople (name, trade, phone, is_placeholder)
  values ('Sneaky', 'Plumber', '+34 644 444 444', true)$$,
  '42501', 'new row violates row-level security policy for table "tradespeople"',
  'RLS blocks is_placeholder=true even with column privilege');
reset role;
revoke insert (status, verified, is_placeholder) on public.tradespeople from anon, authenticated;

-- ---- authenticated ---------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-4000-8000-00000000000a","role":"authenticated"}', true);

select lives_ok($$insert into public.tradespeople (name, trade, phone, submitted_by)
  values ('User A Suggestion', 'Handyman', '+34 666 666 666', 'bbbbbbbb-0000-4000-8000-00000000000a')$$,
  'user A can submit a suggestion attributed to themselves');
select throws_ok($$insert into public.tradespeople (name, trade, phone, submitted_by)
  values ('Forged', 'Handyman', '+34 666 666 666', 'bbbbbbbb-0000-4000-8000-00000000000b')$$,
  '42501', 'new row violates row-level security policy for table "tradespeople"',
  'user A cannot attribute a suggestion to user B');
select is((select count(*) from public.tradespeople), 5::bigint, 'authenticated sees only approved entries');
select throws_ok($$select submitted_by from public.tradespeople$$, '42501', null,
  'authenticated cannot read the submitter account of an entry');
select throws_ok($$update public.tradespeople set verified = true$$, '42501', null, 'authenticated cannot update tradespeople');

-- ---- stored values ---------------------------------------------------------
reset role;
select results_eq(
  $$select status, verified, is_placeholder from public.tradespeople where name = 'Anon Suggestion'$$,
  $$values ('pending'::text, false, false)$$,
  'anon suggestion is stored as pending / unverified / not a placeholder'
);
select results_eq(
  $$select status, submitted_by from public.tradespeople where name = 'User A Suggestion'$$,
  $$values ('pending'::text, 'bbbbbbbb-0000-4000-8000-00000000000a'::uuid)$$,
  'user A suggestion is pending and attributed'
);

select * from finish();
rollback;
