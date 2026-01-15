"use client";

import { useRef } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { X, Upload, FileText, Check } from "lucide-react";

export interface ImportRowData {
  email: string;
  fullName: string;
  jobTitle: string;
  department: string;
  pdfFile: File | null;
}

interface ImportRowProps {
  index: number;
  data: ImportRowData;
  onChange: (index: number, field: keyof ImportRowData, value: string | File | null) => void;
  onRemove: (index: number) => void;
  errors?: Partial<Record<keyof ImportRowData, string>>;
  disabled?: boolean;
  canRemove?: boolean;
}

export function ImportRow({
  index,
  data,
  onChange,
  onRemove,
  errors = {},
  disabled = false,
  canRemove = true,
}: ImportRowProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && file.type !== "application/pdf") {
      return; // Only accept PDFs
    }
    onChange(index, "pdfFile", file);
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      onChange(index, "pdfFile", file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const clearFile = () => {
    onChange(index, "pdfFile", null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="relative p-4 border border-border rounded-xl bg-card">
      {/* Row number badge */}
      <div className="absolute -top-2.5 left-4 px-2 py-0.5 bg-muted text-muted-foreground text-xs font-medium rounded">
        Member {index + 1}
      </div>

      {/* Remove button */}
      {canRemove && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onRemove(index)}
          disabled={disabled}
          className="absolute top-2 right-2 h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-2">
        {/* Email */}
        <div className="space-y-1">
          <label className="text-sm font-medium">
            Email <span className="text-destructive">*</span>
          </label>
          <Input
            type="email"
            placeholder="john@company.com"
            value={data.email}
            onChange={(e) => onChange(index, "email", e.target.value)}
            disabled={disabled}
            className={cn(errors.email && "border-destructive")}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>

        {/* Full Name */}
        <div className="space-y-1">
          <label className="text-sm font-medium">
            Full Name <span className="text-destructive">*</span>
          </label>
          <Input
            type="text"
            placeholder="John Smith"
            value={data.fullName}
            onChange={(e) => onChange(index, "fullName", e.target.value)}
            disabled={disabled}
            className={cn(errors.fullName && "border-destructive")}
          />
          {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
        </div>

        {/* Job Title */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Job Title</label>
          <Input
            type="text"
            placeholder="Software Engineer"
            value={data.jobTitle}
            onChange={(e) => onChange(index, "jobTitle", e.target.value)}
            disabled={disabled}
          />
        </div>

        {/* Department */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Department</label>
          <Input
            type="text"
            placeholder="Engineering"
            value={data.department}
            onChange={(e) => onChange(index, "department", e.target.value)}
            disabled={disabled}
          />
        </div>

        {/* PDF Upload */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Strengths PDF</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            disabled={disabled}
            className="hidden"
          />

          {data.pdfFile ? (
            <div className="flex items-center gap-2 p-2 border border-border rounded-lg bg-muted/50">
              <div className="p-1.5 rounded bg-domain-executing/10">
                <FileText className="h-4 w-4 text-domain-executing" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{data.pdfFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(data.pdfFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Check className="h-4 w-4 text-green-500" />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearFile}
                  disabled={disabled}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ) : (
            <div
              onDrop={handleFileDrop}
              onDragOver={handleDragOver}
              onClick={() => !disabled && fileInputRef.current?.click()}
              className={cn(
                "flex items-center justify-center gap-2 p-2 border-2 border-dashed border-border rounded-lg cursor-pointer",
                "hover:border-primary hover:bg-muted/50 transition-colors",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <Upload className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Drop PDF or click</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
