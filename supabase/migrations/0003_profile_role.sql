-- =============================================================================
-- R'SPACE — add artist/listener role, chosen at signup
-- =============================================================================

alter table public.profiles
  add column role text not null default 'listener' check (role in ('artist', 'listener'));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, handle, display_name, role)
  values (
    new.id,
    'user_' || substr(replace(new.id::text, '-', ''), 1, 12),
    coalesce(new.raw_user_meta_data ->> 'display_name', 'New Space'),
    case when new.raw_user_meta_data ->> 'role' = 'artist' then 'artist' else 'listener' end
  );
  return new;
end;
$$;
