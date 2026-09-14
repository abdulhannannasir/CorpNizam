-- Addresses two Supabase security-advisor warnings raised against 0001_init:
--
-- 1. function_search_path_mutable: set_updated_at() didn't pin search_path,
--    so it could resolve objects from a different schema depending on the
--    caller's search_path.
-- 2. anon_security_definer_function_executable /
--    authenticated_security_definer_function_executable: the RLS helper
--    functions are SECURITY DEFINER (required so RLS policies can look up
--    the owning workspace of a row without themselves being blocked by
--    RLS) and are therefore directly callable as public RPC endpoints by
--    default. None of our tables are meant to be reachable by anonymous
--    (logged-out) requests, so anon has no legitimate reason to call these
--    directly — revoke it there while keeping EXECUTE for `authenticated`,
--    since Postgres still needs that grant to evaluate the RLS policies
--    that reference these functions during normal authenticated queries.

create or replace function set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function is_workspace_member(uuid) from public, anon;
revoke execute on function workspace_role_of(uuid) from public, anon;
revoke execute on function is_workspace_admin(uuid) from public, anon;
revoke execute on function company_workspace_id(uuid) from public, anon;
revoke execute on function workflow_workspace_id(uuid) from public, anon;

grant execute on function is_workspace_member(uuid) to authenticated;
grant execute on function workspace_role_of(uuid) to authenticated;
grant execute on function is_workspace_admin(uuid) to authenticated;
grant execute on function company_workspace_id(uuid) to authenticated;
grant execute on function workflow_workspace_id(uuid) to authenticated;
