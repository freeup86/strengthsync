"use client";

import { useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  FileSpreadsheet,
  Upload,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  AlertTriangle,
  Users,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Breadcrumbs } from "@/components/ui/Breadcrumb";

// Domain color mapping for theme badges
const domainColors: Record<string, string> = {
  executing: "bg-domain-executing/10 text-domain-executing border-domain-executing/30",
  influencing: "bg-domain-influencing/10 text-domain-influencing border-domain-influencing/30",
  relationship: "bg-domain-relationship/10 text-domain-relationship border-domain-relationship/30",
  strategic: "bg-domain-strategic/10 text-domain-strategic border-domain-strategic/30",
};

interface ImportRowResult {
  rowNumber: number;
  participantName: string;
  participantEmail: string | null;
  status: "success" | "skipped" | "error";
  message: string;
  memberId?: string;
  memberName?: string;
  themeCount: number;
  hasExistingStrengths: boolean;
  topFiveThemes: string[];
  warnings: string[];
}

interface ImportResponse {
  preview: boolean;
  totalProcessed: number;
  successful: number;
  failed: number;
  validRows: number;
  warnings: string[];
  results: ImportRowResult[];
}

type Stage = "upload" | "preview" | "importing" | "results";

export default function ExcelImportPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stage, setStage] = useState<Stage>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<ImportResponse | null>(null);
  const [importResults, setImportResults] = useState<ImportResponse | null>(null);

  const isAdmin = session?.user?.role === "OWNER" || session?.user?.role === "ADMIN";

  // Redirect non-admins
  if (!isAdmin && session) {
    router.replace("/dashboard");
    return null;
  }

  const handleFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setLoading(true);

    try {
      // Preview mode
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/admin/members/excel-import?preview=true", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error?.message || "Failed to parse file");
        setStage("upload");
        return;
      }

      setPreviewData(result.data);
      setStage("preview");
    } catch (err) {
      setError("Failed to upload file. Please try again.");
      setStage("upload");
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && /\.xlsx?$/i.test(droppedFile.name)) {
      handleFile(droppedFile);
    } else {
      setError("Please drop an .xlsx or .xls file");
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFile(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setStage("importing");
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/members/excel-import", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error?.message || "Import failed");
        setStage("preview");
        return;
      }

      setImportResults(result.data);
      setStage("results");
    } catch (err) {
      setError("Import failed. Please try again.");
      setStage("preview");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStage("upload");
    setFile(null);
    setPreviewData(null);
    setImportResults(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Excel Import" },
        ]}
      />

      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold flex items-center gap-3">
          <FileSpreadsheet className="h-8 w-8 text-primary" />
          Excel Import
        </h1>
        <p className="text-muted-foreground mt-1">
          Import CliftonStrengths from a Gallup Access Excel export for your entire team at once.
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-destructive/10 text-destructive rounded-xl">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Error</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-destructive/20 rounded">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Upload Stage */}
      {stage === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Gallup Access Export</CardTitle>
            <CardDescription>
              Export your team&apos;s strengths from Gallup Access as an Excel file (.xlsx), then upload it here.
              The system will auto-detect the header row and match members by email or name.
            </CardDescription>
          </CardHeader>
          {/* Overwrite Warning */}
          <div className="mx-6 mb-2 flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 rounded-lg border border-amber-200 dark:border-amber-800/50">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">
              Members who already have strengths imported will have their data replaced with the new values from this file.
            </p>
          </div>
          <CardContent>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200",
                isDragOver
                  ? "border-primary bg-primary/5 scale-[1.02]"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              )}
            >
              {loading ? (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-12 w-12 text-primary animate-spin" />
                  <div>
                    <p className="font-medium text-lg">Parsing Excel file...</p>
                    <p className="text-sm text-muted-foreground mt-1">Detecting themes and matching members</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 rounded-2xl bg-primary/10">
                    <Upload className="h-10 w-10 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-lg">
                      Drop your Gallup Access Excel file here
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      or click to browse. Accepts .xlsx and .xls files up to 10MB.
                    </p>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileInput}
                className="hidden"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Stage */}
      {stage === "preview" && previewData && (
        <>
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>Preview Import</CardTitle>
              <CardDescription>
                Review the detected data before importing. File: <strong>{file?.name}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-muted/50 rounded-xl text-center">
                  <p className="text-2xl font-bold">{previewData.totalProcessed}</p>
                  <p className="text-sm text-muted-foreground">Total Rows</p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl text-center">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{previewData.successful}</p>
                  <p className="text-sm text-muted-foreground">Ready to Import</p>
                </div>
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-center">
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{previewData.failed}</p>
                  <p className="text-sm text-muted-foreground">Skipped</p>
                </div>
              </div>

              {/* Warnings */}
              {previewData.warnings.length > 0 && (
                <div className="mb-6 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    Warnings
                  </div>
                  <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                    {previewData.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Results table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-2 pr-4 font-medium text-muted-foreground">Row</th>
                      <th className="py-2 pr-4 font-medium text-muted-foreground">Participant</th>
                      <th className="py-2 pr-4 font-medium text-muted-foreground">Matched To</th>
                      <th className="py-2 pr-4 font-medium text-muted-foreground">Top 5 Themes</th>
                      <th className="py-2 pr-4 font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.results.map((row) => (
                      <tr key={row.rowNumber} className="border-b border-border/50">
                        <td className="py-3 pr-4 text-muted-foreground">{row.rowNumber}</td>
                        <td className="py-3 pr-4">
                          <div className="font-medium">{row.participantName}</div>
                          {row.participantEmail && (
                            <div className="text-xs text-muted-foreground">{row.participantEmail}</div>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          {row.memberName ? (
                            <div className="flex items-center gap-1.5">
                              <Users className="h-3.5 w-3.5 text-primary" />
                              <span>{row.memberName}</span>
                              {row.hasExistingStrengths && (
                                <span className="text-xs px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded">
                                  Overwrite
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">No match</span>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex flex-wrap gap-1">
                            {row.topFiveThemes.map((theme) => (
                              <span
                                key={theme}
                                className="text-xs px-1.5 py-0.5 rounded border bg-muted/50"
                              >
                                {theme}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          {row.status === "success" ? (
                            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                              <CheckCircle2 className="h-4 w-4" />
                              Ready
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                              <AlertTriangle className="h-4 w-4" />
                              {row.message}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Choose Different File
            </Button>
            <Button
              onClick={handleImport}
              disabled={previewData.successful === 0}
            >
              Import {previewData.successful} Members
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </>
      )}

      {/* Importing Stage */}
      {stage === "importing" && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <div className="text-center">
                <p className="font-medium text-lg">Importing strengths...</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Creating member strength records and checking badges.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Stage */}
      {stage === "results" && importResults && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                Import Complete
              </CardTitle>
              <CardDescription>
                Successfully imported strengths for {importResults.successful} member{importResults.successful !== 1 ? "s" : ""}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-muted/50 rounded-xl text-center">
                  <p className="text-2xl font-bold">{importResults.totalProcessed}</p>
                  <p className="text-sm text-muted-foreground">Total Processed</p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl text-center">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{importResults.successful}</p>
                  <p className="text-sm text-muted-foreground">Imported</p>
                </div>
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-center">
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{importResults.failed}</p>
                  <p className="text-sm text-muted-foreground">Skipped/Failed</p>
                </div>
              </div>

              {/* Result details */}
              <div className="space-y-2">
                {importResults.results.map((row) => (
                  <div
                    key={row.rowNumber}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg",
                      row.status === "success"
                        ? "bg-green-50 dark:bg-green-900/10"
                        : row.status === "error"
                        ? "bg-destructive/10"
                        : "bg-muted/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {row.status === "success" ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      ) : row.status === "error" ? (
                        <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-medium">{row.memberName || row.participantName}</p>
                        <p className="text-xs text-muted-foreground">{row.message}</p>
                      </div>
                    </div>
                    {row.status === "success" && (
                      <span className="text-xs text-muted-foreground">
                        {row.themeCount} themes
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Import Another File
            </Button>
            <Button onClick={() => router.push("/admin/members")}>
              View Members
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
