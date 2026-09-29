// Domain types shared across the application. These mirror the database
// schema in supabase/migrations/0001_init.sql.

export type WorkspaceRole = "OWNER" | "ADMIN" | "LAWYER" | "MANAGER" | "MEMBER" | "VIEWER";

export type CompanyStatus = "ACTIVE" | "INACTIVE" | "DISSOLVED" | "UNDER_LIQUIDATION";

export type DirectorStatus = "ACTIVE" | "RESIGNED" | "REMOVED";

export type CorporateEventType =
  | "DIRECTOR_APPOINTED"
  | "DIRECTOR_RESIGNED"
  | "SHARE_TRANSFER"
  | "NEW_SHAREHOLDER"
  | "NEW_INVESTMENT";

export type CorporateEventStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "CANCELLED";

export type WorkflowStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type DocumentStatus = "ACTIVE" | "ARCHIVED" | "SUPERSEDED";

export type DocumentCategory =
  | "CORPORATE_DOCUMENT"
  | "COMPLIANCE_EVIDENCE"
  | "CONTRACT"
  | "IDENTITY_RECORD"
  | "OTHER";

export type VerificationStatus = "VERIFIED" | "REQUIRES_REVIEW" | "DRAFT";

export type ObligationStatus =
  | "UPCOMING"
  | "DUE_SOON"
  | "OVERDUE"
  | "COMPLETED"
  | "NOT_APPLICABLE"
  | "REQUIRES_REVIEW";

export type ContractStatus = "DRAFT" | "ACTIVE" | "EXPIRING" | "EXPIRED" | "TERMINATED";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  created_at: string;
}

export interface Company {
  id: string;
  workspace_id: string;
  legal_name: string;
  registration_number: string | null;
  ntn: string | null;
  company_type: string | null;
  incorporation_date: string | null;
  registered_address: string | null;
  province: string | null;
  status: CompanyStatus;
  fiscal_year_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface Director {
  id: string;
  company_id: string;
  full_name: string;
  cnic: string | null;
  designation: string | null;
  appointment_date: string | null;
  resignation_date: string | null;
  status: DirectorStatus;
  created_at: string;
  updated_at: string;
}

export interface Shareholder {
  id: string;
  company_id: string;
  name: string;
  entity_type: string;
  identifier: string | null;
  created_at: string;
  updated_at: string;
}

export interface Shareholding {
  id: string;
  company_id: string;
  shareholder_id: string;
  shares: number;
  effective_from: string;
  effective_to: string | null;
  created_at: string;
}

export interface CorporateEvent {
  id: string;
  company_id: string;
  event_type: CorporateEventType;
  title: string;
  description: string | null;
  event_date: string;
  status: CorporateEventStatus;
  metadata: Record<string, unknown>;
  created_by: string;
  created_at: string;
}

export interface Workflow {
  id: string;
  company_id: string;
  event_id: string | null;
  name: string;
  description: string | null;
  status: WorkflowStatus;
  created_at: string;
  completed_at: string | null;
}

export interface WorkflowTask {
  id: string;
  workflow_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to: string | null;
  requires_evidence: boolean;
  requires_legal_verification: boolean;
  evidence_document_id: string | null;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface DocumentRecord {
  id: string;
  company_id: string;
  workflow_id: string | null;
  name: string;
  document_type: DocumentCategory;
  storage_path: string;
  status: DocumentStatus;
  uploaded_by: string;
  created_at: string;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  storage_path: string;
  uploaded_by: string;
  created_at: string;
}

export interface ComplianceRule {
  id: string;
  jurisdiction: string;
  authority: string;
  rule_code: string | null;
  title: string;
  description: string | null;
  source_reference: string | null;
  effective_from: string | null;
  effective_to: string | null;
  verification_status: VerificationStatus;
  created_at: string;
  updated_at: string;
}

export interface ComplianceObligation {
  id: string;
  company_id: string;
  rule_id: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  status: ObligationStatus;
  owner_id: string | null;
  evidence_document_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Contract {
  id: string;
  company_id: string;
  name: string;
  counterparty: string | null;
  contract_type: string | null;
  start_date: string | null;
  expiry_date: string | null;
  renewal_date: string | null;
  owner_id: string | null;
  status: ContractStatus;
  document_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  workspace_id: string;
  company_id: string | null;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

/** Roles allowed to write company-scoped operational data (mirrors RLS policies). */
export const WRITE_ROLES: WorkspaceRole[] = ["OWNER", "ADMIN", "LAWYER", "MANAGER"];
/** Roles allowed to manage workspace membership. */
export const ADMIN_ROLES: WorkspaceRole[] = ["OWNER", "ADMIN"];
/** Roles allowed to update/complete tasks (includes plain members who get assigned work). */
export const TASK_ROLES: WorkspaceRole[] = ["OWNER", "ADMIN", "LAWYER", "MANAGER", "MEMBER"];
