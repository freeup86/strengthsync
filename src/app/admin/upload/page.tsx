"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ThemeBadge } from "@/components/strengths/ThemeBadge";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  User,
  Mail,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DomainSlug } from "@/constants/strengths-data";

interface UploadResult {
  documentId: string;
  participantName: string | null;
  themesFound: number;
  reportType: string;
  confidence: number;
  warnings: string[];
  assignedTo: {
    memberId: string;
    name: string;
    email: string;
  } | null;
}

interface ParsedThemePreview {
  name: string;
  slug: string;
  domain: DomainSlug;
  rank: number;
}

export default function UploadPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [previewThemes, setPreviewThemes] = useState<ParsedThemePreview[]>([]);

  // Form for assigning to user
  const [assignMode, setAssignMode] = useState<"existing" | "new">("new");
  const [assignEmail, setAssignEmail] = useState("");
  const [assignName, setAssignName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Check admin access
  const isAdmin = session?.user?.role === "OWNER" || session?.user?.role === "ADMIN";

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
      setError(null);
      setResult(null);
    } else {
      setError("Please upload a PDF file");
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === "application/pdf") {
        setSelectedFile(file);
        setError(null);
        setResult(null);
      } else {
        setError("Please upload a PDF file");
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      if (assignEmail) {
        formData.append("forUserEmail", assignEmail);
        if (assignName) {
          formData.append("forUserName", assignName);
        }
      }

      const response = await fetch("/api/strengths/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error?.message || "Upload failed");
        if (data.error?.details?.parsedThemes !== undefined) {
          setPreviewThemes([]);
        }
        return;
      }

      setResult(data.data);
      setPreviewThemes([]);
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setResult(null);
    setError(null);
    setAssignEmail("");
    setAssignName("");
    setPreviewThemes([]);
  };

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h1 className="font-display text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground">
          Only organization admins can upload strength reports.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Upload CliftonStrengths</h1>
        <p className="text-muted-foreground mt-1">
          Import team members&apos; CliftonStrengths reports (PDF format)
        </p>
      </div>

      {/* Success state */}
      {result && (
        <Card variant="strategic" className="overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-domain-strategic-light flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-domain-strategic" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-semibold text-lg">Upload Successful!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Found {result.themesFound} strength themes ({result.reportType.replace("_", " ")})
                </p>

                {result.participantName && (
                  <p className="text-sm mt-2">
                    <span className="text-muted-foreground">Participant:</span>{" "}
                    <span className="font-medium">{result.participantName}</span>
                  </p>
                )}

                {result.assignedTo && (
                  <p className="text-sm mt-1">
                    <span className="text-muted-foreground">Assigned to:</span>{" "}
                    <span className="font-medium">{result.assignedTo.name}</span>
                    <span className="text-muted-foreground"> ({result.assignedTo.email})</span>
                  </p>
                )}

                {result.warnings.length > 0 && (
                  <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                      Warnings:
                    </p>
                    <ul className="text-xs text-amber-600 dark:text-amber-300 mt-1 space-y-1">
                      {result.warnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex gap-3 mt-4">
                  <Button onClick={resetForm} variant="outline">
                    Upload Another
                  </Button>
                  {result.assignedTo && (
                    <Button
                      variant="strategic"
                      onClick={() => router.push(`/team/${result.assignedTo!.memberId}`)}
                    >
                      View Profile
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload form */}
      {!result && (
        <div className="space-y-6">
          {/* Drop zone */}
          <Card>
            <CardContent className="pt-6">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "relative border-2 border-dashed rounded-2xl p-8 transition-all duration-200 text-center",
                  isDragging
                    ? "border-primary bg-primary/5"
                    : selectedFile
                    ? "border-domain-strategic bg-domain-strategic-light/50"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                )}
              >
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                {selectedFile ? (
                  <div className="flex flex-col items-center">
                    <div className="h-16 w-16 rounded-2xl bg-domain-strategic-light flex items-center justify-center mb-4">
                      <FileText className="h-8 w-8 text-domain-strategic" />
                    </div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedFile(null);
                      }}
                      className="mt-3 text-sm text-muted-foreground hover:text-foreground"
                    >
                      Choose a different file
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="font-medium">Drop your PDF here</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      or click to browse files
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Assign to user */}
          {selectedFile && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Assign to Team Member</CardTitle>
                <CardDescription>
                  Link this report to a team member (optional)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address</label>
                  <Input
                    type="email"
                    placeholder="teammate@company.com"
                    value={assignEmail}
                    onChange={(e) => setAssignEmail(e.target.value)}
                    icon={<Mail className="h-4 w-4" />}
                  />
                  <p className="text-xs text-muted-foreground">
                    If this email doesn&apos;t exist, a new team member will be created
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name (for new members)</label>
                  <Input
                    type="text"
                    placeholder="Jane Smith"
                    value={assignName}
                    onChange={(e) => setAssignName(e.target.value)}
                    icon={<User className="h-4 w-4" />}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-destructive/10 text-destructive rounded-xl">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-medium">Upload Failed</p>
                <p className="text-sm mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Upload button */}
          {selectedFile && (
            <Button
              onClick={handleUpload}
              isLoading={isUploading}
              size="lg"
              className="w-full"
              variant="executing"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Upload & Process
            </Button>
          )}
        </div>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">About CliftonStrengths Reports</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert">
          <p>
            Upload the PDF export from Gallup&apos;s CliftonStrengths assessment. The system will
            automatically extract:
          </p>
          <ul>
            <li>Participant name (when available)</li>
            <li>Top 5, Top 10, or all 34 strength themes</li>
            <li>Theme rankings in order of strength</li>
          </ul>
          <p className="text-muted-foreground">
            Team members can take the CliftonStrengths assessment at{" "}
            <a
              href="https://www.gallup.com/cliftonstrengths"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              gallup.com/cliftonstrengths
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
