-- Fixes a chicken-and-egg RLS bug in workspace creation, found by driving
-- the actual onboarding flow end-to-end against a live project (not
-- something the earlier unit tests could catch, since it only manifests
-- against real Postgres RLS evaluation):
--
-- lib/workspaces/service.ts creates a workspace with `.insert().select()`,
-- i.e. INSERT ... RETURNING. Postgres subjects a RETURNING clause to the
-- table's SELECT policy, same as a real SELECT — and workspaces_select
-- required is_workspace_member(id), which is only true once the
-- workspace_members row for the creator exists. That row is inserted in a
-- *second*, separate statement immediately after, so at the moment of the
-- RETURNING check the creator is not yet a member of the workspace they
-- just created, and Postgres raises the same
-- "new row violates row-level security policy" error as a genuine
-- unauthorized insert would.
--
-- Fix: let a workspace's creator always read it (semantically correct
-- regardless of the RLS quirk — the creator should never be locked out of
-- a workspace they created), and make creation atomic via a single
-- SECURITY INVOKER function so a failure inserting the owner's membership
-- row can never leave an orphaned, ownerless workspace behind.

drop policy if exists workspaces_select on workspaces;
create policy workspaces_select on workspaces
  for select using (is_workspace_member(id) or created_by = auth.uid());

create or replace function create_workspace_with_owner(p_name text, p_slug text)
returns workspaces
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_workspace workspaces;
begin
  insert into workspaces (name, slug, created_by)
  values (p_name, p_slug, auth.uid())
  returning * into v_workspace;

  insert into workspace_members (workspace_id, user_id, role)
  values (v_workspace.id, auth.uid(), 'OWNER');

  return v_workspace;
end;
$$;

revoke execute on function create_workspace_with_owner(text, text) from public, anon;
grant execute on function create_workspace_with_owner(text, text) to authenticated;
