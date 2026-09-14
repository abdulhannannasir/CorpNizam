-- CorpNizam initial schema
-- Corporate Legal & Compliance Operating System for Pakistani businesses
--
-- Hierarchy: auth.users -> workspaces -> companies -> company data ->
--            corporate_events -> workflows -> workflow_tasks
--            + documents/document_versions, compliance, audit_logs

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- ENUM TYPES
-- ---------------------------------------------------------------------------

create type workspace_role as enum ('OWNER', 'ADMIN', 'LAWYER', 'MANAGER', 'MEMBER', 'VIEWER');

create type company_status as enum ('ACTIVE', 'INACTIVE', 'DISSOLVED', 'UNDER_LIQUIDATION');

create type director_status as enum ('ACTIVE', 'RESIGNED', 'REMOVED');

create type corporate_event_type as enum (
  'DIRECTOR_APPOINTED',
  'DIRECTOR_RESIGNED',
  'SHARE_TRANSFER',
  'NEW_SHAREHOLDER',
  'NEW_INVESTMENT'
);

create type corporate_event_status as enum ('PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED');

create type workflow_status as enum ('ACTIVE', 'COMPLETED', 'CANCELLED');

create type task_status as enum ('TODO', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED');

create type task_priority as enum ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

create type document_status as enum ('ACTIVE', 'ARCHIVED', 'SUPERSEDED');

create type document_category as enum (
  'CORPORATE_DOCUMENT',
  'COMPLIANCE_EVIDENCE',
  'CONTRACT',
  'IDENTITY_RECORD',
  'OTHER'
);

create type verification_status as enum ('VERIFIED', 'REQUIRES_REVIEW', 'DRAFT');

create type obligation_status as enum (
  'UPCOMING',
  'DUE_SOON',
  'OVERDUE',
  'COMPLETED',
  'NOT_APPLICABLE',
  'REQUIRES_REVIEW'
);

create type contract_status as enum ('DRAFT', 'ACTIVE', 'EXPIRING', 'EXPIRED', 'TERMINATED');

-- ---------------------------------------------------------------------------
-- WORKSPACES
-- ---------------------------------------------------------------------------

create table workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role workspace_role not null default 'MEMBER',
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create index idx_workspace_members_workspace_id on workspace_members(workspace_id);
create index idx_workspace_members_user_id on workspace_members(user_id);

-- Helper function: does the current user belong to a workspace, optionally with a minimum role?
create or replace function is_workspace_member(p_workspace_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from workspace_members
    where workspace_id = p_workspace_id and user_id = auth.uid()
  );
$$;

create or replace function workspace_role_of(p_workspace_id uuid)
returns workspace_role
language sql
security definer
stable
set search_path = public
as $$
  select role from workspace_members
  where workspace_id = p_workspace_id and user_id = auth.uid()
  limit 1;
$$;

create or replace function is_workspace_admin(p_workspace_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from workspace_members
    where workspace_id = p_workspace_id and user_id = auth.uid()
      and role in ('OWNER', 'ADMIN')
  );
$$;

-- ---------------------------------------------------------------------------
-- COMPANIES
-- ---------------------------------------------------------------------------

create table companies (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  legal_name text not null,
  registration_number text,
  ntn text,
  company_type text,
  incorporation_date date,
  registered_address text,
  province text,
  status company_status not null default 'ACTIVE',
  fiscal_year_end text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_companies_workspace_id on companies(workspace_id);

-- Helper: workspace id that owns a given company (used by RLS on child tables)
create or replace function company_workspace_id(p_company_id uuid)
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select workspace_id from companies where id = p_company_id;
$$;

-- ---------------------------------------------------------------------------
-- DIRECTORS
-- ---------------------------------------------------------------------------

create table directors (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  full_name text not null,
  cnic text,
  designation text,
  appointment_date date,
  resignation_date date,
  status director_status not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_directors_company_id on directors(company_id);

-- ---------------------------------------------------------------------------
-- SHAREHOLDERS / SHAREHOLDINGS
-- ---------------------------------------------------------------------------

create table shareholders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  entity_type text not null default 'INDIVIDUAL',
  identifier text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_shareholders_company_id on shareholders(company_id);

create table shareholdings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  shareholder_id uuid not null references shareholders(id) on delete cascade,
  shares numeric not null check (shares >= 0),
  effective_from date not null default current_date,
  effective_to date,
  created_at timestamptz not null default now()
);

create index idx_shareholdings_company_id on shareholdings(company_id);
create index idx_shareholdings_shareholder_id on shareholdings(shareholder_id);

-- Ownership percentage is derived (never stored) — see lib/ownership/service.ts

-- ---------------------------------------------------------------------------
-- CORPORATE EVENTS
-- ---------------------------------------------------------------------------

create table corporate_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  event_type corporate_event_type not null,
  title text not null,
  description text,
  event_date date not null default current_date,
  status corporate_event_status not null default 'PENDING',
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create index idx_corporate_events_company_id on corporate_events(company_id);
create index idx_corporate_events_created_at on corporate_events(created_at);

-- ---------------------------------------------------------------------------
-- WORKFLOWS / TASKS
-- ---------------------------------------------------------------------------

create table workflows (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  event_id uuid references corporate_events(id) on delete set null,
  name text not null,
  description text,
  status workflow_status not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index idx_workflows_company_id on workflows(company_id);
create index idx_workflows_event_id on workflows(event_id);

create table workflow_tasks (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references workflows(id) on delete cascade,
  title text not null,
  description text,
  status task_status not null default 'TODO',
  priority task_priority not null default 'MEDIUM',
  assigned_to uuid references auth.users(id),
  requires_evidence boolean not null default false,
  evidence_document_id uuid,
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_workflow_tasks_workflow_id on workflow_tasks(workflow_id);
create index idx_workflow_tasks_due_date on workflow_tasks(due_date);
create index idx_workflow_tasks_status on workflow_tasks(status);

-- Helper: workspace id that owns a given workflow (via company)
create or replace function workflow_workspace_id(p_workflow_id uuid)
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

-- ---------------------------------------------------------------------------
-- DOCUMENTS
-- ---------------------------------------------------------------------------

create table documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  workflow_id uuid references workflows(id) on delete set null,
  name text not null,
  document_type document_category not null default 'OTHER',
  storage_path text not null,
  status document_status not null default 'ACTIVE',
  uploaded_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create index idx_documents_company_id on documents(company_id);
create index idx_documents_workflow_id on documents(workflow_id);

create table document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  version_number integer not null,
  storage_path text not null,
  uploaded_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (document_id, version_number)
);

create index idx_document_versions_document_id on document_versions(document_id);

alter table workflow_tasks
  add constraint fk_workflow_tasks_evidence_document
  foreign key (evidence_document_id) references documents(id) on delete set null;

-- ---------------------------------------------------------------------------
-- COMPLIANCE
-- ---------------------------------------------------------------------------

create table compliance_rules (
  id uuid primary key default gen_random_uuid(),
  jurisdiction text not null default 'PK',
  authority text not null,
  rule_code text,
  title text not null,
  description text,
  source_reference text,
  effective_from date,
  effective_to date,
  verification_status verification_status not null default 'REQUIRES_REVIEW',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table compliance_obligations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  rule_id uuid references compliance_rules(id) on delete set null,
  title text not null,
  description text,
  due_date date,
  status obligation_status not null default 'UPCOMING',
  owner_id uuid references auth.users(id),
  evidence_document_id uuid references documents(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_compliance_obligations_company_id on compliance_obligations(company_id);
create index idx_compliance_obligations_due_date on compliance_obligations(due_date);
create index idx_compliance_obligations_status on compliance_obligations(status);

-- ---------------------------------------------------------------------------
-- CONTRACTS
-- ---------------------------------------------------------------------------

create table contracts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  counterparty text,
  contract_type text,
  start_date date,
  expiry_date date,
  renewal_date date,
  owner_id uuid references auth.users(id),
  status contract_status not null default 'DRAFT',
  document_id uuid references documents(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_contracts_company_id on contracts(company_id);
create index idx_contracts_expiry_date on contracts(expiry_date);

-- ---------------------------------------------------------------------------
-- AUDIT LOGS (append-only)
-- ---------------------------------------------------------------------------

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  company_id uuid references companies(id) on delete cascade,
  user_id uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_audit_logs_workspace_id on audit_logs(workspace_id);
create index idx_audit_logs_company_id on audit_logs(company_id);
create index idx_audit_logs_created_at on audit_logs(created_at);

-- No update/delete privileges are ever granted to authenticated role (see RLS below):
-- audit_logs is insert + select only, enforced at the RLS layer.

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_workspaces_updated_at before update on workspaces
  for each row execute function set_updated_at();
create trigger trg_companies_updated_at before update on companies
  for each row execute function set_updated_at();
create trigger trg_directors_updated_at before update on directors
  for each row execute function set_updated_at();
create trigger trg_shareholders_updated_at before update on shareholders
  for each row execute function set_updated_at();
create trigger trg_compliance_rules_updated_at before update on compliance_rules
  for each row execute function set_updated_at();
create trigger trg_compliance_obligations_updated_at before update on compliance_obligations
  for each row execute function set_updated_at();
create trigger trg_contracts_updated_at before update on contracts
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------

alter table workspaces enable row level security;
alter table workspace_members enable row level security;
alter table companies enable row level security;
alter table directors enable row level security;
alter table shareholders enable row level security;
alter table shareholdings enable row level security;
alter table corporate_events enable row level security;
alter table workflows enable row level security;
alter table workflow_tasks enable row level security;
alter table documents enable row level security;
alter table document_versions enable row level security;
alter table compliance_rules enable row level security;
alter table compliance_obligations enable row level security;
alter table contracts enable row level security;
alter table audit_logs enable row level security;

-- workspaces: members can read; creation is open to any authenticated user
-- (they become OWNER via the workspace_members insert done in the same
-- transaction by the application layer); only OWNER/ADMIN can update.
create policy workspaces_select on workspaces
  for select using (is_workspace_member(id));

create policy workspaces_insert on workspaces
  for insert with check (created_by = auth.uid());

create policy workspaces_update on workspaces
  for update using (is_workspace_admin(id));

-- workspace_members: members can see the roster of their own workspace.
-- Only OWNER/ADMIN can manage membership. A user can always see their own row
-- (needed to resolve their own membership during onboarding races).
create policy workspace_members_select on workspace_members
  for select using (is_workspace_member(workspace_id) or user_id = auth.uid());

create policy workspace_members_insert on workspace_members
  for insert with check (
    is_workspace_admin(workspace_id)
    or (user_id = auth.uid() and not exists (
      select 1 from workspace_members wm where wm.workspace_id = workspace_members.workspace_id
    ))
  );

create policy workspace_members_update on workspace_members
  for update using (is_workspace_admin(workspace_id));

create policy workspace_members_delete on workspace_members
  for delete using (is_workspace_admin(workspace_id));

-- companies: any workspace member can read; MANAGER and above can write.
create policy companies_select on companies
  for select using (is_workspace_member(workspace_id));

create policy companies_insert on companies
  for insert with check (
    workspace_role_of(workspace_id) in ('OWNER', 'ADMIN', 'LAWYER', 'MANAGER')
  );

create policy companies_update on companies
  for update using (
    workspace_role_of(workspace_id) in ('OWNER', 'ADMIN', 'LAWYER', 'MANAGER')
  );

create policy companies_delete on companies
  for delete using (workspace_role_of(workspace_id) in ('OWNER', 'ADMIN'));

-- Generic pattern for company-scoped tables: readable by workspace members,
-- writable by MANAGER and above (of the owning workspace).
create policy directors_select on directors
  for select using (is_workspace_member(company_workspace_id(company_id)));
create policy directors_write on directors
  for all using (
    workspace_role_of(company_workspace_id(company_id)) in ('OWNER', 'ADMIN', 'LAWYER', 'MANAGER')
  ) with check (
    workspace_role_of(company_workspace_id(company_id)) in ('OWNER', 'ADMIN', 'LAWYER', 'MANAGER')
  );

create policy shareholders_select on shareholders
  for select using (is_workspace_member(company_workspace_id(company_id)));
create policy shareholders_write on shareholders
  for all using (
    workspace_role_of(company_workspace_id(company_id)) in ('OWNER', 'ADMIN', 'LAWYER', 'MANAGER')
  ) with check (
    workspace_role_of(company_workspace_id(company_id)) in ('OWNER', 'ADMIN', 'LAWYER', 'MANAGER')
  );

create policy shareholdings_select on shareholdings
  for select using (is_workspace_member(company_workspace_id(company_id)));
create policy shareholdings_write on shareholdings
  for all using (
    workspace_role_of(company_workspace_id(company_id)) in ('OWNER', 'ADMIN', 'LAWYER', 'MANAGER')
  ) with check (
    workspace_role_of(company_workspace_id(company_id)) in ('OWNER', 'ADMIN', 'LAWYER', 'MANAGER')
  );

create policy corporate_events_select on corporate_events
  for select using (is_workspace_member(company_workspace_id(company_id)));
create policy corporate_events_write on corporate_events
  for all using (
    workspace_role_of(company_workspace_id(company_id)) in ('OWNER', 'ADMIN', 'LAWYER', 'MANAGER')
  ) with check (
    workspace_role_of(company_workspace_id(company_id)) in ('OWNER', 'ADMIN', 'LAWYER', 'MANAGER')
  );

create policy workflows_select on workflows
  for select using (is_workspace_member(company_workspace_id(company_id)));
create policy workflows_write on workflows
  for all using (
    workspace_role_of(company_workspace_id(company_id)) in ('OWNER', 'ADMIN', 'LAWYER', 'MANAGER')
  ) with check (
    workspace_role_of(company_workspace_id(company_id)) in ('OWNER', 'ADMIN', 'LAWYER', 'MANAGER')
  );

-- workflow_tasks: readable by workspace members; writable by MEMBER and above
-- (assignees who are plain MEMBERs must be able to update their own tasks).
create policy workflow_tasks_select on workflow_tasks
  for select using (is_workspace_member(workflow_workspace_id(workflow_id)));
create policy workflow_tasks_write on workflow_tasks
  for all using (
    workspace_role_of(workflow_workspace_id(workflow_id)) in
      ('OWNER', 'ADMIN', 'LAWYER', 'MANAGER', 'MEMBER')
  ) with check (
    workspace_role_of(workflow_workspace_id(workflow_id)) in
      ('OWNER', 'ADMIN', 'LAWYER', 'MANAGER', 'MEMBER')
  );

create policy documents_select on documents
  for select using (is_workspace_member(company_workspace_id(company_id)));
create policy documents_write on documents
  for all using (
    workspace_role_of(company_workspace_id(company_id)) in
      ('OWNER', 'ADMIN', 'LAWYER', 'MANAGER', 'MEMBER')
  ) with check (
    workspace_role_of(company_workspace_id(company_id)) in
      ('OWNER', 'ADMIN', 'LAWYER', 'MANAGER', 'MEMBER')
  );

create policy document_versions_select on document_versions
  for select using (
    is_workspace_member((select company_workspace_id(d.company_id) from documents d where d.id = document_id))
  );
create policy document_versions_write on document_versions
  for insert with check (
    workspace_role_of((select company_workspace_id(d.company_id) from documents d where d.id = document_id)) in
      ('OWNER', 'ADMIN', 'LAWYER', 'MANAGER', 'MEMBER')
  );

-- compliance_rules are global reference data: readable by any authenticated
-- user, writable only by service-role (application admin tooling).
create policy compliance_rules_select on compliance_rules
  for select using (auth.role() = 'authenticated');

create policy compliance_obligations_select on compliance_obligations
  for select using (is_workspace_member(company_workspace_id(company_id)));
create policy compliance_obligations_write on compliance_obligations
  for all using (
    workspace_role_of(company_workspace_id(company_id)) in ('OWNER', 'ADMIN', 'LAWYER', 'MANAGER')
  ) with check (
    workspace_role_of(company_workspace_id(company_id)) in ('OWNER', 'ADMIN', 'LAWYER', 'MANAGER')
  );

create policy contracts_select on contracts
  for select using (is_workspace_member(company_workspace_id(company_id)));
create policy contracts_write on contracts
  for all using (
    workspace_role_of(company_workspace_id(company_id)) in ('OWNER', 'ADMIN', 'LAWYER', 'MANAGER')
  ) with check (
    workspace_role_of(company_workspace_id(company_id)) in ('OWNER', 'ADMIN', 'LAWYER', 'MANAGER')
  );

-- audit_logs: append-only. Any workspace member can read; any workspace
-- member can insert (server-side service writes on their behalf); nobody
-- gets update/delete policies, so those operations are always denied.
create policy audit_logs_select on audit_logs
  for select using (is_workspace_member(workspace_id));
create policy audit_logs_insert on audit_logs
  for insert with check (is_workspace_member(workspace_id));
