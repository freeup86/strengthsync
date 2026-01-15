"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BulkImportForm } from "@/components/admin/BulkImportForm";
import { ImportResults } from "@/components/admin/ImportResults";
import { ArrowLeft, Users, FileText, Info } from "lucide-react";
import type { BulkImportResponse } from "@/lib/validation/bulk-import";

export default function AdminImportPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<BulkImportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/members/bulk", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to import members");
      }

      setResults(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setResults(null);
    setError(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/members">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Members
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="font-display text-3xl font-bold">Bulk Import Members</h1>
        <p className="text-muted-foreground mt-1">
          Add multiple team members at once, with optional CliftonStrengths PDFs
        </p>
      </div>

      {/* Info Card */}
      {!results && (
        <Card className="border-domain-relationship/30 bg-domain-relationship/5">
          <CardContent className="flex items-start gap-3 pt-4">
            <Info className="h-5 w-5 text-domain-relationship flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-domain-relationship">How it works</p>
              <ul className="mt-1 space-y-1 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Users className="h-3 w-3" /> Fill in member details (email and name required)
                </li>
                <li className="flex items-center gap-2">
                  <FileText className="h-3 w-3" /> Optionally attach a CliftonStrengths PDF for each member
                </li>
                <li>New users will receive temporary passwords you can share with them</li>
                <li>Existing users will be added to your organization without a new password</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-4">
            <p className="text-destructive font-medium">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-domain-executing" />
            {results ? "Import Results" : "Member Details"}
          </CardTitle>
          <CardDescription>
            {results
              ? "Review the results of your import below"
              : "Add up to 50 members per import. Each row can have an optional CliftonStrengths PDF attached."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {results ? (
            <ImportResults response={results} onReset={handleReset} />
          ) : (
            <BulkImportForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
