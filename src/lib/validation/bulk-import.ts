import { z } from "zod";

export const importRowSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .transform((email) => email.toLowerCase().trim()),
  fullName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .transform((name) => name.trim()),
  jobTitle: z
    .string()
    .max(100, "Job title must be less than 100 characters")
    .optional()
    .default("")
    .transform((title) => title?.trim() || ""),
  department: z
    .string()
    .max(100, "Department must be less than 100 characters")
    .optional()
    .default("")
    .transform((dept) => dept?.trim() || ""),
});

export const bulkImportSchema = z.object({
  members: z
    .array(importRowSchema)
    .min(1, "At least one member is required")
    .max(50, "Maximum 50 members per import")
    .refine(
      (members) => {
        const emails = members.map((m) => m.email.toLowerCase());
        return new Set(emails).size === emails.length;
      },
      { message: "Duplicate email addresses found in import" }
    ),
});

export type ImportRowData = z.infer<typeof importRowSchema>;
export type BulkImportInput = z.infer<typeof bulkImportSchema>;

export interface ImportRowResult {
  rowIndex: number;
  email: string;
  success: boolean;
  data?: {
    memberId: string;
    userId: string;
    tempPassword?: string;
    isNewUser: boolean;
    strengthsImported: boolean;
    themesFound?: number;
  };
  error?: string;
}

export interface BulkImportResponse {
  totalProcessed: number;
  successful: number;
  failed: number;
  results: ImportRowResult[];
}
