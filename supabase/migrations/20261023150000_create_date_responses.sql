-- Initial database migration for the date course picker.
create table if not exists public.date_responses (
  id uuid primary key default gen_random_uuid(),
  restaurant_id text not null check (restaurant_id in ('badagot', 'moseon', 'yukhwatan', 'jackpasta')),
  movie boolean not null,
  comment text check (comment is null or char_length(comment) <= 300),
  created_at timestamptz not null default now()
);

alter table public.date_responses enable row level security;

-- Anyone with the shared link can submit one response. The table has no public read policy.
drop policy if exists "Anyone can submit a date response" on public.date_responses;
create policy "Anyone can submit a date response"
  on public.date_responses for insert to anon, authenticated
  with check (
    restaurant_id in ('badagot', 'moseon', 'yukhwatan', 'jackpasta')
    and movie in (true, false)
    and (comment is null or char_length(comment) <= 300)
  );

-- Only users with a trusted app_metadata role claim can read responses.
-- Assign this claim to the admin account from a trusted server / Supabase dashboard;
-- never let clients write app_metadata.
drop policy if exists "Authenticated admins can read responses" on public.date_responses;
create policy "Authenticated admins can read responses"
  on public.date_responses for select to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- No update/delete policies are intentionally provided.
grant usage on schema public to anon, authenticated;
grant insert on public.date_responses to anon, authenticated;
grant select on public.date_responses to authenticated;

-- Enable Postgres Changes for the admin live inbox.
do $$
begin
  alter publication supabase_realtime add table public.date_responses;
exception when duplicate_object then null;
end $$;
