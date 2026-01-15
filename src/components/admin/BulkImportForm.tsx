"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { ImportRow, type ImportRowData } from "./ImportRow";
import { Plus, Upload, Loader2 } from "lucide-react";

const createEmptyRow = (): ImportRowData => ({
  email: "",
  fullName: "",
  jobTitle: "",
  department: "",
  pdfFile: null,
});

interface BulkImportFormProps {
  onSubmit: (formData: FormData) => Promise<void>;
  isSubmitting: boolean;
}

export function BulkImportForm({ onSubmit, isSubmitting }: BulkImportFormProps) {
  const [rows, setRows] = useState<ImportRowData[]>([createEmptyRow()]);
  const [errors, setErrors] = useState<Record<number, Partial<Record<keyof ImportRowData, string>>>>({});

  const handleRowChange = useCallback(
    (index: number, field: keyof ImportRowData, value: string | File | null) => {
      setRows((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value };
        return updated;
      });
      // Clear error for this field when user types
      setErrors((prev) => {
        if (prev[index]?.[field]) {
          const updated = { ...prev };
          updated[index] = { ...updated[index] };
          delete updated[index][field];
          return updated;
        }
        return prev;
      });
    },
    []
  );

  const handleAddRow = useCallback(() => {
    if (rows.length < 50) {
      setRows((prev) => [...prev, createEmptyRow()]);
    }
  }, [rows.length]);

  const handleRemoveRow = useCallback((index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
    setErrors((prev) => {
      const updated: Record<number, Partial<Record<keyof ImportRowData, string>>> = {};
      Object.entries(prev).forEach(([key, value]) => {
        const idx = parseInt(key, 10);
        if (idx < index) {
          updated[idx] = value;
        } else if (idx > index) {
          updated[idx - 1] = value;
        }
      });
      return updated;
    });
  }, []);

  const validateRows = useCallback((): boolean => {
    const newErrors: Record<number, Partial<Record<keyof ImportRowData, string>>> = {};
    let isValid = true;

    // Check for duplicate emails
    const emails = rows.map((r) => r.email.toLowerCase().trim()).filter(Boolean);
    const duplicateEmails = emails.filter((email, idx) => emails.indexOf(email) !== idx);

    rows.forEach((row, index) => {
      const rowErrors: Partial<Record<keyof ImportRowData, string>> = {};

      // Required fields
      if (!row.email.trim()) {
        rowErrors.email = "Email is required";
        isValid = false;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email.trim())) {
        rowErrors.email = "Invalid email address";
        isValid = false;
      } else if (duplicateEmails.includes(row.email.toLowerCase().trim())) {
        rowErrors.email = "Duplicate email";
        isValid = false;
      }

      if (!row.fullName.trim()) {
        rowErrors.fullName = "Name is required";
        isValid = false;
      } else if (row.fullName.trim().length < 2) {
        rowErrors.fullName = "Name must be at least 2 characters";
        isValid = false;
      }

      if (Object.keys(rowErrors).length > 0) {
        newErrors[index] = rowErrors;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [rows]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateRows()) {
      return;
    }

    // Build FormData
    const formData = new FormData();
    rows.forEach((row, index) => {
      formData.append(`members[${index}].email`, row.email.trim());
      formData.append(`members[${index}].fullName`, row.fullName.trim());
      formData.append(`members[${index}].jobTitle`, row.jobTitle.trim());
      formData.append(`members[${index}].department`, row.department.trim());
      if (row.pdfFile) {
        formData.append(`members[${index}].pdf`, row.pdfFile);
      }
    });

    await onSubmit(formData);
  };

  const filledRows = rows.filter((r) => r.email.trim() || r.fullName.trim()).length;
  const rowsWithPdf = rows.filter((r) => r.pdfFile).length;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Rows */}
      <div className="space-y-4">
        {rows.map((row, index) => (
          <ImportRow
            key={index}
            index={index}
            data={row}
            onChange={handleRowChange}
            onRemove={handleRemoveRow}
            errors={errors[index]}
            disabled={isSubmitting}
            canRemove={rows.length > 1}
          />
        ))}
      </div>

      {/* Add Row Button */}
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleAddRow}
          disabled={isSubmitting || rows.length >= 50}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
        <span className="text-sm text-muted-foreground">
          {rows.length} / 50 rows
        </span>
      </div>

      {/* Summary & Submit */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{filledRows}</span> members to import
          {rowsWithPdf > 0 && (
            <span>
              {" "}
              • <span className="font-medium text-foreground">{rowsWithPdf}</span> with PDFs
            </span>
          )}
        </div>
        <Button
          type="submit"
          variant="executing"
          disabled={isSubmitting || filledRows === 0}
          className="min-w-[140px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Import Members
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
