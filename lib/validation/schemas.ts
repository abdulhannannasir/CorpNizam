import { z } from "zod";

export const emailSchema = z.string().trim().email("Enter a valid email address");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters");

export const signupSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const workspaceSchema = z.object({
  name: z.string().trim().min(2, "Workspace name is required"),
});

export const companyTypeValues = [
  "PRIVATE_LIMITED",
  "PUBLIC_LIMITED",
  "SINGLE_MEMBER",
  "PARTNERSHIP",
  "SOLE_PROPRIETORSHIP",
  "OTHER",
] as const;

export const provinceValues = [
  "PUNJAB",
  "SINDH",
  "KHYBER_PAKHTUNKHWA",
  "BALOCHISTAN",
  "ISLAMABAD_CAPITAL_TERRITORY",
  "GILGIT_BALTISTAN",
  "AZAD_JAMMU_KASHMIR",
] as const;

export const companySchema = z.object({
  legal_name: z.string().trim().min(2, "Legal name is required"),
  registration_number: z.string().trim().optional().or(z.literal("")),
  ntn: z.string().trim().optional().or(z.literal("")),
  company_type: z.enum(companyTypeValues).optional(),
  incorporation_date: z.string().optional().or(z.literal("")),
  registered_address: z.string().trim().optional().or(z.literal("")),
  province: z.enum(provinceValues).optional(),
  fiscal_year_end: z.string().trim().optional().or(z.literal("")),
});

export const directorSchema = z.object({
  full_name: z.string().trim().min(2, "Full name is required"),
  cnic: z
    .string()
    .trim()
    .regex(/^\d{5}-\d{7}-\d{1}$|^$/, "CNIC must look like 12345-1234567-1")
    .optional()
    .or(z.literal("")),
  designation: z.string().trim().optional().or(z.literal("")),
  appointment_date: z.string().optional().or(z.literal("")),
});

export const directorResignationSchema = z.object({
  director_id: z.string().uuid("Select a director"),
  resignation_date: z.string().min(1, "Resignation date is required"),
  reason: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
});

export const shareholderSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  entity_type: z.enum(["INDIVIDUAL", "COMPANY", "TRUST", "OTHER"]).default("INDIVIDUAL"),
  identifier: z.string().trim().optional().or(z.literal("")),
});

export const shareholdingSchema = z.object({
  shareholder_id: z.string().uuid("Select a shareholder"),
  shares: z.coerce.number().positive("Shares must be greater than zero"),
  effective_from: z.string().min(1, "Effective date is required"),
});

export const shareTransferSchema = z.object({
  from_shareholder_id: z.string().uuid("Select the transferring shareholder"),
  to_shareholder_id: z.string().uuid("Select the receiving shareholder"),
  shares: z.coerce.number().positive("Shares must be greater than zero"),
  effective_date: z.string().min(1, "Effective date is required"),
});

export const taskSchema = z.object({
  title: z.string().trim().min(2, "Title is required"),
  description: z.string().trim().optional().or(z.literal("")),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  due_date: z.string().optional().or(z.literal("")),
  assigned_to: z.string().uuid().optional().or(z.literal("")),
});

export const documentUploadSchema = z.object({
  name: z.string().trim().min(1, "Document name is required"),
  document_type: z.enum([
    "CORPORATE_DOCUMENT",
    "COMPLIANCE_EVIDENCE",
    "CONTRACT",
    "IDENTITY_RECORD",
    "OTHER",
  ]),
});

export const contractSchema = z.object({
  name: z.string().trim().min(2, "Contract name is required"),
  counterparty: z.string().trim().optional().or(z.literal("")),
  contract_type: z.string().trim().optional().or(z.literal("")),
  start_date: z.string().optional().or(z.literal("")),
  expiry_date: z.string().optional().or(z.literal("")),
  renewal_date: z.string().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CompanyInput = z.infer<typeof companySchema>;
export type DirectorInput = z.infer<typeof directorSchema>;
export type DirectorResignationInput = z.infer<typeof directorResignationSchema>;
export type ShareholderInput = z.infer<typeof shareholderSchema>;
export type ShareholdingInput = z.infer<typeof shareholdingSchema>;
export type ShareTransferInput = z.infer<typeof shareTransferSchema>;
export type TaskInput = z.infer<typeof taskSchema>;
export type ContractInput = z.infer<typeof contractSchema>;
