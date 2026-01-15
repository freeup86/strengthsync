"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  FileText,
  Plus,
  Download,
} from "lucide-react";
import type { ImportRowResult, BulkImportResponse } from "@/lib/validation/bulk-import";

interface ImportResultsProps {
  response: BulkImportResponse;
  onReset: () => void;
}

export function ImportResults({ response, onReset }: ImportResultsProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const copyPassword = async (password: string, index: number) => {
    await navigator.clipboard.writeText(password);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyAllCredentials = async () => {
    const credentials = response.results
      .filter((r) => r.success && r.data?.tempPassword)
      .map((r) => `${r.email}: ${r.data!.tempPassword}`)
      .join("\n");

    if (credentials) {
      await navigator.clipboard.writeText(credentials);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    }
  };

  const downloadCredentials = () => {
    const credentials = response.results
      .filter((r) => r.success && r.data?.tempPassword)
      .map((r) => `Email: ${r.email}\nPassword: ${r.data!.tempPassword}\n`)
      .join("\n---\n\n");

    if (credentials) {
      const blob = new Blob([credentials], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `member-credentials-${new Date().toISOString().split("T")[0]}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const successCount = response.successful;
  const failCount = response.failed;
  const withPasswords = response.results.filter((r) => r.success && r.data?.tempPassword).length;
  const withStrengths = response.results.filter((r) => r.success && r.data?.strengthsImported).length;

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className={cn(failCount === 0 ? "border-green-500/50" : "border-amber-500/50")}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            {failCount === 0 ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Import Completed Successfully
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-amber-500" />
                Import Completed with Issues
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-green-600">{successCount}</p>
              <p className="text-sm text-muted-foreground">Imported</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-red-600">{failCount}</p>
              <p className="text-sm text-muted-foreground">Failed</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-domain-executing">{withPasswords}</p>
              <p className="text-sm text-muted-foreground">New Users</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-domain-strategic">{withStrengths}</p>
              <p className="text-sm text-muted-foreground">With Strengths</p>
            </div>
          </div>

          {/* Password actions */}
          {withPasswords > 0 && (
            <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={copyAllCredentials}>
                {copiedAll ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy All Passwords
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={downloadCredentials}>
                <Download className="h-4 w-4 mr-2" />
                Download Credentials
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results List */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Import Details</h3>
        <div className="space-y-2">
          {response.results.map((result, index) => (
            <ResultRow
              key={index}
              result={result}
              copied={copiedIndex === index}
              onCopyPassword={(pwd) => copyPassword(pwd, index)}
            />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onReset}>
          <Plus className="h-4 w-4 mr-2" />
          Import More Members
        </Button>
      </div>
    </div>
  );
}

interface ResultRowProps {
  result: ImportRowResult;
  copied: boolean;
  onCopyPassword: (password: string) => void;
}

function ResultRow({ result, copied, onCopyPassword }: ResultRowProps) {
  if (result.success) {
    return (
      <div className="flex items-center gap-3 p-3 border border-border rounded-lg bg-green-500/5">
        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{result.email}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{result.data?.isNewUser ? "New user created" : "Existing user added"}</span>
            {result.data?.strengthsImported && (
              <span className="flex items-center gap-1 text-domain-executing">
                <FileText className="h-3 w-3" />
                {result.data.themesFound} themes
              </span>
            )}
          </div>
        </div>
        {result.data?.tempPassword && (
          <div className="flex items-center gap-2">
            <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
              {result.data.tempPassword}
            </code>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCopyPassword(result.data!.tempPassword!)}
              className="h-8 w-8 p-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 border border-destructive/50 rounded-lg bg-destructive/5">
      <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{result.email}</p>
        <p className="text-sm text-destructive">{result.error}</p>
      </div>
    </div>
  );
}
