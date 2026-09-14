-- company_workspace_id() and workflow_workspace_id() are plain lookups that
-- do NOT check the caller's membership (unlike is_workspace_member /
-- is_workspace_admin / workspace_role_of, which check against auth.uid()
-- and are therefore safe to leave callable directly). Left in `public`,
-- any authenticated user could call them as RPC endpoints
-- (/rest/v1/rpc/company_workspace_id) to learn which workspace owns an
-- arbitrary company/workflow id they are not a member of — a minor
-- cross-tenant metadata leak the security advisor flagged.
--
-- Moving them to a schema PostgREST doesn't expose (only `public` is
-- exposed in this project's API settings) removes the RPC route entirely.
-- RLS policy evaluation happens inside Postgres itself, not through
-- PostgREST, so policies can still call the schema-qualified function as
-- long as the querying role has USAGE + EXECUTE on it — which we grant
-- below without granting the PostgREST-exposed route.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create function private.company_workspace_id(p_company_id uuid)
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select workspace_id from companies where id = p_company_id;
$$;

create function private.workflow_workspace_id(p_workflow_id uuid)
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select c.workspace_id from workflows w
  join companies c on c.id = w.company_id
  where w.id = p_workflow_id;
$$;

revoke execute on function private.company_workspace_id(uuid) from public, anon;
revoke execute on function private.workflow_workspace_id(uuid) from public, anon;
grant execute on function private.company_workspace_id(uuid) to authenticated;
grant execute on function private.workflow_workspace_id(uuid) to authenticated;

-- Repoint every RLS policy that referenced the old public.* lookups.
drop policy if exists directors_select on directors;
create policy directors_select on directors
  for select using (is_workspace_member(private.company_workspace_id(company_id)));
drop policy if exists directors_write on directors;
create policy directors_write on directors
  for all using (
    workspace_role_of(private.company_workspace_id(company_id)) in ('OWNER', 'ADMIN', 'LAWYER', 'MANAGER')
  ) with check (
    workspace_role_of(private.company_workspace_id(company_id)) in ('OWNER', 'ADMIN', 'LAWYER', 'MANAGER')
  );

drop policy if exists shareholders_select on shareholders;
create policy shareholders_select on shareholders
  for select using (is_workspace_member(private.company_workspace_id(company_id)));
drop policy if exists shareholders_write on shareholders;
create policy shareholders_write on shareholders
  for all using (
    workspace_role_of(private.company_workspace_id(company_id)) in ('OWNER', 'ADMIN', 'LAWYER', 'MANAGER')
  ) with check (
    workspace_role_of(private.company_workspace_id(company_id)) in ('OWNER', 'ADMIN', 'LAWYER', 'MANAGER')
  );

drop policy if exists shareholdings_select on shareholdings;
create policy shareholdings_select on shareholdings
  for select using (is_workspace_member(private.company_workspace_id(company_id)));
drop policy if exists shareholdings_write on shareholdings;
create policy shareholdings_write on shareholdings
  for all using (
    workspace_role_of(private.company_workspace_id(company_id)) in ('OWNER', 'ADMIN', 'LAWYER', 'MANAGER')
  ) with check (
    workspace_role_of(private.company_workspace_id(company_id)) in ('OWNER', 'ADMIN', 'LAWYER', 'MANAGER')
  );

drop policy if exists corporate_events_select on corporate_events;
create policy corporate_events_select on corporate_events
  for select using (is_workspace_member(private.company_workspace_id(company_id)));
drop policy if exists corporate_events_write on corporate_events;
create policy corporate_events_write on corporate_events
  for all using (
    workspace_role_of(private.company_workspace_id(company_id)) in ('OWNER', 'ADMIN', 'LAWYER', 'MANAGER')
  ) with check (
    workspace_role_of(private.company_workspace_id(company_id)) in ('OWNER', 'ADMIN', 'LAWYER', 'MANAGER')
  );

drop policy if exists workflows_select on workflows;
create policy workflows_select on workflows
  for select using (is_workspace_member(private.company_workspace_id(company_id)));
drop policy if exists workflows_write on workflows;
create policy workflows_write on workflows
  for all using (
    workspace_role_of(private.company_workspace_id(company_id)) in ('OWNER', 'ADMIN', 'LAWYER', 'MANAGER')
  ) with check (
    workspace_role_of(private.company_workspace_id(company_id)) in ('OWNER', 'ADMIN', 'LAWYER', 'MANAGER')
  );

drop policy if exists workflow_tasks_select on workflow_tasks;
create policy workflow_tasks_select on workflow_tasks
  for select using (is_workspace_member(private.workflow_workspace_id(workflow_id)));
drop policy if exists workflow_tasks_write on workflow_tasks;
create policy workflow_tasks_write on workflow_tasks
  for all using (
    workspace_role_of(private.workflow_workspace_id(workflow_id)) in
      ('OWNER', 'ADMIN', 'LAWYER', 'MANAGER', 'MEMBER')
  ) with check (
    workspace_role_of(private.workflow_workspace_id(workflow_id)) in
      ('OWNER', 'ADMIN', 'LAWYER', 'MANAGER', 'MEMBER')
  );

drop policy if exists documents_select on documents;
create policy documents_select on documents
  for select using (is_workspace_member(private.company_workspace_id(company_id)));
drop policy if exists documents_write on documents;
create policy documents_write on documents
  for all using (
    workspace_role_of(private.company_workspace_id(company_id)) in
      ('OWNER', 'ADMIN', 'LAWYER', 'MANAGER', 'MEMBER')
  ) with check (
    workspace_role_of(private.company_workspace_id(company_id)) in
      ('OWNER', 'ADMIN', 'LAWYER', 'MANAGER', 'MEMBER')
  );

drop policy if exists document_versions_select on document_versions;
create policy document_versions_select on document_versions
  for select using (
    is_workspace_member((select private.company_workspace_id(d.company_id) from documents d where d.id = document_id))
  );
drop policy if exists document_versions_write on document_versions;
create policy document_versions_write on document_versions
  for insert with check (
    workspace_role_of((select private.company_workspace_id(d.company_id) from documents d where d.id = document_id)) in
      ('OWNER', 'ADMIN', 'LAWYER', 'MANAGER', 'MEMBER')
  );

drop policy if exists compliance_obligations_select on compliance_obligations;
create policy compliance_obligations_select on compliance_obligations
  for select using (is_workspace_member(private.company_workspace_id(company_id)));
drop policy if exists compliance_obligations_write on compliance_obligations;
create policy compliance_obligations_write on compliance_obligations
  for all using (
    workspace_role_of(private.company_workspace_id(company_id)) in ('OWNER', 'ADMIN', 'LAWYER', 'MANAGER')
  ) with check (
    workspace_role_of(private.company_workspace_id(company_id)) in ('OWNER', 'ADMIN', 'LAWYER', 'MANAGER')
  );

drop policy if exists contracts_select on contracts;
create policy contracts_select on contracts
  for select using (is_workspace_member(private.company_workspace_id(company_id)));
drop policy if exists contracts_write on contracts;
create policy contracts_write on contracts
  for all using (
    workspace_role_of(private.company_workspace_id(company_id)) in ('OWNER', 'ADMIN', 'LAWYER', 'MANAGER')
  ) with check (
    workspace_role_of(private.company_workspace_id(company_id)) in ('OWNER', 'ADMIN', 'LAWYER', 'MANAGER')
  );

drop function if exists public.company_workspace_id(uuid);
drop function if exists public.workflow_workspace_id(uuid);
