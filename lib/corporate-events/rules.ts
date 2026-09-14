import type { CorporateEventType, TaskPriority } from "@/lib/types";

/**
 * Reusable event -> workflow definitions. This is the architecture that lets
 * new corporate event types be added later without touching UI components:
 * add an entry here (and a form in the "record event" flow) and the engine
 * in lib/corporate-events/service.ts will generate the workflow for it.
 *
 * IMPORTANT — legal-data safety: task titles here describe generic corporate
 * housekeeping (updating internal records, filing what's required, seeking
 * evidence) and deliberately do NOT cite specific SECP/FBR forms, statutory
 * deadlines, or penalties, because none of those have been verified against
 * an official source in this codebase. Any task whose legal basis is not
 * verified is flagged `requiresLegalVerification: true` and must render the
 * "Requires legal verification" badge — never a fabricated law or deadline.
 */
export interface WorkflowTaskTemplate {
  title: string;
  description: string;
  priority: TaskPriority;
  requiresEvidence: boolean;
  requiresLegalVerification: boolean;
  /** Days after the event date this task is suggested to be due, if any. */
  dueInDays?: number;
}

export interface WorkflowTemplate {
  name: string;
  description: string;
  tasks: WorkflowTaskTemplate[];
}

export const WORKFLOW_TEMPLATES: Record<CorporateEventType, WorkflowTemplate> = {
  DIRECTOR_RESIGNED: {
    name: "Director Resignation",
    description:
      "Standard housekeeping workflow triggered when a director resigns from the company.",
    tasks: [
      {
        title: "Record resignation",
        description: "Confirm the resignation date and reason are captured on the director's record.",
        priority: "HIGH",
        requiresEvidence: false,
        requiresLegalVerification: false,
      },
      {
        title: "Update company records",
        description: "Update the company's internal register of directors to reflect the resignation.",
        priority: "MEDIUM",
        requiresEvidence: false,
        requiresLegalVerification: false,
      },
      {
        title: "Prepare required regulatory filing",
        description:
          "Requirement identified — the applicable SECP filing and statutory deadline for a director resignation have not been verified against an official source in this system.",
        priority: "URGENT",
        requiresEvidence: false,
        requiresLegalVerification: true,
      },
      {
        title: "Upload supporting evidence",
        description: "Upload the director's resignation letter or equivalent supporting document.",
        priority: "HIGH",
        requiresEvidence: true,
        requiresLegalVerification: false,
        dueInDays: 7,
      },
      {
        title: "Review",
        description: "A workspace admin or lawyer reviews the completed workflow before closing it out.",
        priority: "MEDIUM",
        requiresEvidence: false,
        requiresLegalVerification: false,
      },
      {
        title: "Complete",
        description: "Mark the workflow complete once all prior steps are finished.",
        priority: "LOW",
        requiresEvidence: false,
        requiresLegalVerification: false,
      },
    ],
  },
  DIRECTOR_APPOINTED: {
    name: "Director Appointment",
    description: "Workflow triggered when a new director is appointed to the company.",
    tasks: [
      {
        title: "Record appointment",
        description: "Confirm the appointment date and designation are captured on the director's record.",
        priority: "HIGH",
        requiresEvidence: false,
        requiresLegalVerification: false,
      },
      {
        title: "Collect director identification documents",
        description: "Upload CNIC and consent-to-act documentation for the new director.",
        priority: "HIGH",
        requiresEvidence: true,
        requiresLegalVerification: false,
        dueInDays: 7,
      },
      {
        title: "Prepare required regulatory filing",
        description:
          "Requirement identified — the applicable SECP filing and statutory deadline for a director appointment have not been verified against an official source in this system.",
        priority: "URGENT",
        requiresEvidence: false,
        requiresLegalVerification: true,
      },
      {
        title: "Review",
        description: "A workspace admin or lawyer reviews the completed workflow before closing it out.",
        priority: "MEDIUM",
        requiresEvidence: false,
        requiresLegalVerification: false,
      },
    ],
  },
  SHARE_TRANSFER: {
    name: "Share Transfer",
    description: "Workflow triggered when shares are transferred between existing shareholders.",
    tasks: [
      {
        title: "Record share transfer",
        description: "Confirm the transfer amount and effective date are captured in shareholding records.",
        priority: "HIGH",
        requiresEvidence: false,
        requiresLegalVerification: false,
      },
      {
        title: "Upload share transfer instrument",
        description: "Upload the signed share transfer deed / instrument evidencing the transfer.",
        priority: "HIGH",
        requiresEvidence: true,
        requiresLegalVerification: false,
        dueInDays: 7,
      },
      {
        title: "Update statutory register of members",
        description:
          "Requirement identified — the applicable statutory filing and deadline for a share transfer have not been verified against an official source in this system.",
        priority: "URGENT",
        requiresEvidence: false,
        requiresLegalVerification: true,
      },
      {
        title: "Review",
        description: "A workspace admin or lawyer reviews the completed workflow before closing it out.",
        priority: "MEDIUM",
        requiresEvidence: false,
        requiresLegalVerification: false,
      },
    ],
  },
  NEW_SHAREHOLDER: {
    name: "New Shareholder",
    description: "Workflow triggered when a new shareholder is admitted to the company.",
    tasks: [
      {
        title: "Record new shareholder",
        description: "Confirm the shareholder's identity and initial shareholding are recorded.",
        priority: "HIGH",
        requiresEvidence: false,
        requiresLegalVerification: false,
      },
      {
        title: "Collect shareholder identification documents",
        description: "Upload identity/incorporation documents for the new shareholder.",
        priority: "HIGH",
        requiresEvidence: true,
        requiresLegalVerification: false,
        dueInDays: 7,
      },
      {
        title: "Update statutory register of members",
        description:
          "Requirement identified — the applicable statutory filing and deadline have not been verified against an official source in this system.",
        priority: "URGENT",
        requiresEvidence: false,
        requiresLegalVerification: true,
      },
      {
        title: "Review",
        description: "A workspace admin or lawyer reviews the completed workflow before closing it out.",
        priority: "MEDIUM",
        requiresEvidence: false,
        requiresLegalVerification: false,
      },
    ],
  },
  NEW_INVESTMENT: {
    name: "New Investment",
    description: "Workflow triggered when the company receives a new investment.",
    tasks: [
      {
        title: "Record investment details",
        description: "Confirm the investment amount, investor, and instrument are captured.",
        priority: "HIGH",
        requiresEvidence: false,
        requiresLegalVerification: false,
      },
      {
        title: "Upload investment agreement",
        description: "Upload the signed investment/subscription agreement.",
        priority: "HIGH",
        requiresEvidence: true,
        requiresLegalVerification: false,
        dueInDays: 7,
      },
      {
        title: "Assess regulatory filing requirements",
        description:
          "Requirement identified — applicable SECP/FBR filings triggered by a new investment have not been verified against an official source in this system.",
        priority: "URGENT",
        requiresEvidence: false,
        requiresLegalVerification: true,
      },
      {
        title: "Review",
        description: "A workspace admin or lawyer reviews the completed workflow before closing it out.",
        priority: "MEDIUM",
        requiresEvidence: false,
        requiresLegalVerification: false,
      },
    ],
  },
};
