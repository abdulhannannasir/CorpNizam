-- Private storage bucket for the document vault (lib/documents/service.ts).
-- Objects are stored at "<company_id>/<document_id>/<filename>" — the RLS
-- policies below parse the leading path segment as the company_id and reuse
-- the same workspace-membership check as every other company-scoped table,
-- so tenant isolation holds for storage the same way it does for Postgres
-- rows. The bucket is not public: every read goes through a short-lived
-- signed URL (see lib/documents/service.ts getSignedUrl()), never a public
-- URL, so these policies gate both signed-URL issuance and direct access.

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy documents_storage_select on storage.objects
  for select using (
    bucket_id = 'documents'
    and is_workspace_member(private.company_workspace_id((storage.foldername(name))[1]::uuid))
  );

create policy documents_storage_insert on storage.objects
  for insert with check (
    bucket_id = 'documents'
    and workspace_role_of(private.company_workspace_id((storage.foldername(name))[1]::uuid)) in
      ('OWNER', 'ADMIN', 'LAWYER', 'MANAGER', 'MEMBER')
  );

create policy documents_storage_update on storage.objects
  for update using (
    bucket_id = 'documents'
    and workspace_role_of(private.company_workspace_id((storage.foldername(name))[1]::uuid)) in
      ('OWNER', 'ADMIN', 'LAWYER', 'MANAGER', 'MEMBER')
  );

create policy documents_storage_delete on storage.objects
  for delete using (
    bucket_id = 'documents'
    and workspace_role_of(private.company_workspace_id((storage.foldername(name))[1]::uuid)) in ('OWNER', 'ADMIN')
  );
