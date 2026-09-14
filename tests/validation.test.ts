import { describe, expect, it } from "vitest";
import { companySchema, directorSchema, directorResignationSchema, shareholdingSchema, loginSchema } from "@/lib/validation/schemas";

describe("validation schemas", () => {
  it("requires a valid email for login", () => {
    expect(loginSchema.safeParse({ email: "not-an-email", password: "x" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "a@b.com", password: "x" }).success).toBe(true);
  });

  it("requires a company legal name", () => {
    expect(companySchema.safeParse({ legal_name: "" }).success).toBe(false);
    expect(companySchema.safeParse({ legal_name: "Acme Ltd" }).success).toBe(true);
  });

  it("validates Pakistani CNIC format when provided", () => {
    expect(directorSchema.safeParse({ full_name: "Ali", cnic: "12345-1234567-1" }).success).toBe(true);
    expect(directorSchema.safeParse({ full_name: "Ali", cnic: "not-a-cnic" }).success).toBe(false);
    expect(directorSchema.safeParse({ full_name: "Ali", cnic: "" }).success).toBe(true);
  });

  it("requires a director id and resignation date", () => {
    expect(
      directorResignationSchema.safeParse({ director_id: "not-a-uuid", resignation_date: "2024-01-01" }).success,
    ).toBe(false);
    expect(
      directorResignationSchema.safeParse({
        director_id: "9d1a8f4e-1234-4a1b-9c2d-1234567890ab",
        resignation_date: "2024-01-01",
      }).success,
    ).toBe(true);
  });

  it("rejects non-positive share counts", () => {
    expect(
      shareholdingSchema.safeParse({
        shareholder_id: "9d1a8f4e-1234-4a1b-9c2d-1234567890ab",
        shares: 0,
        effective_from: "2024-01-01",
      }).success,
    ).toBe(false);
  });
});
