-- Minimal stand-in for the pieces of Supabase (auth schema, storage schema,
-- auth.uid(), the supabase_realtime publication) that this migration
-- assumes exist, so it can be exercised against a vanilla local Postgres.
create schema if not exists auth;
create table if not exists auth.users (
  id                        uuid primary key default gen_random_uuid(),
  instance_id               uuid,
  aud                       varchar(255),
  role                      varchar(255),
  email                     varchar(255),
  encrypted_password        varchar(255),
  email_confirmed_at        timestamptz,
  invited_at                timestamptz,
  confirmation_token        varchar(255),
  confirmation_sent_at      timestamptz,
  recovery_token            varchar(255),
  recovery_sent_at          timestamptz,
  email_change_token_new    varchar(255),
  email_change              varchar(255),
  email_change_sent_at      timestamptz,
  last_sign_in_at           timestamptz,
  raw_app_meta_data         jsonb not null default '{}'::jsonb,
  raw_user_meta_data        jsonb not null default '{}'::jsonb,
  is_super_admin            boolean,
  created_at                timestamptz,
  updated_at                timestamptz
);

create or replace function auth.uid() returns uuid
language sql stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

create schema if not exists storage;
create table if not exists storage.buckets (
  id text primary key,
  name text not null,
  public boolean not null default false
);
create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets (id),
  name text
);
create or replace function storage.foldername(name text) returns text[]
language sql immutable
as $$
  select string_to_array(name, '/')
$$;

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon;
  end if;
end $$;

-- Replicates the baseline grants a real Supabase project already has in
-- place before any of *this app's* migrations run (schema usage, RLS-gated
-- table access, function execution). This app's own migration only adds
-- policies/column-grants on top of this baseline, same as it would on real
-- Supabase.
grant usage on schema auth to authenticated, anon;
grant execute on function auth.uid() to authenticated, anon;
grant usage on schema public to authenticated, anon;
alter default privileges for role postgres in schema public grant all on tables to authenticated, anon;
alter default privileges for role postgres in schema public grant all on sequences to authenticated, anon;
alter default privileges for role postgres in schema public grant execute on functions to authenticated, anon;
alter default privileges for role postgres in schema storage grant all on tables to authenticated, anon;
