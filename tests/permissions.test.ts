import { describe, expect, it } from "vitest";
import { canManageTasks, canManageWorkspace, canWriteCompanyData, isViewer } from "@/lib/permissions/roles";
import type { WorkspaceRole } from "@/lib/types";

const ALL_ROLES: WorkspaceRole[] = ["OWNER", "ADMIN", "LAWYER", "MANAGER", "MEMBER", "VIEWER"];

describe("permission helpers", () => {
  it("only OWNER/ADMIN/LAWYER/MANAGER can write company data", () => {
    const allowed = ALL_ROLES.filter(canWriteCompanyData);
    expect(allowed.sort()).toEqual(["ADMIN", "LAWYER", "MANAGER", "OWNER"].sort());
  });

  it("MEMBER can manage tasks assigned to them but VIEWER cannot", () => {
    expect(canManageTasks("MEMBER")).toBe(true);
    expect(canManageTasks("VIEWER")).toBe(false);
  });

  it("only OWNER/ADMIN can manage the workspace", () => {
    expect(canManageWorkspace("OWNER")).toBe(true);
    expect(canManageWorkspace("ADMIN")).toBe(true);
    expect(canManageWorkspace("MANAGER")).toBe(false);
  });

  it("treats null/undefined role as no permissions", () => {
    expect(canWriteCompanyData(null)).toBe(false);
    expect(canWriteCompanyData(undefined)).toBe(false);
    expect(canManageWorkspace(null)).toBe(false);
  });

  it("identifies VIEWER role", () => {
    expect(isViewer("VIEWER")).toBe(true);
    expect(isViewer("MEMBER")).toBe(false);
  });
});
