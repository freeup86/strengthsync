"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

export default function SelfUploadStrengthsPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<{
    errors?: string[];
    warnings?: string[];
    parsedThemes?: number;
    diagnostics?: {
      textExtracted: boolean;
      textLength: number;
      textPreview: string;
      participantName: string | null;
      isLikelyImagePdf?: boolean;
    };
  } | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
      setErrorDetails(null);
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
        setErrorDetails(null);
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
    setErrorDetails(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      // Self-upload: no forUserEmail, API will assign to current user
      formData.append("selfUpload", "true");

      const response = await fetch("/api/strengths/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error?.message || "Upload failed");
        setErrorDetails({
          errors: data.error?.details?.errors,
          warnings: data.error?.details?.warnings,
          parsedThemes: data.error?.details?.parsedThemes,
          diagnostics: data.error?.details?.diagnostics,
        });
        return;
      }

      setResult(data.data);
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
    setErrorDetails(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Upload Your Strengths</h1>
        <p className="text-muted-foreground mt-1">
          Import your CliftonStrengths report to unlock personalized insights
        </p>
      </div>

      {/* Success state */}
      {result && (
        <Card variant="strategic" className="overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <CheckCircle2 className="h-6 w-6 text-domain-strategic mt-1" />
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
                    Upload Different File
                  </Button>
                  <Button
                    variant="strategic"
                    onClick={() => router.push("/strengths")}
                  >
                    View My Strengths
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
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
                    ? "border-primary bg-primary/5 dark:bg-primary/10"
                    : selectedFile
                    ? "border-domain-strategic bg-domain-strategic-light/50 dark:bg-domain-strategic/20"
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
                    <FileText className="h-10 w-10 text-domain-strategic mb-4" />
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                    <p className="font-medium">Drop your PDF here</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      or click to browse files
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Error */}
          {error && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-xl space-y-3">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Upload Failed</p>
                  <p className="text-sm mt-0.5">{error}</p>
                </div>
              </div>

              {errorDetails && (
                <div className="border-t border-destructive/20 pt-3 space-y-2 text-sm">
                  {errorDetails.parsedThemes !== undefined && (
                    <p>
                      <span className="font-medium">Themes found:</span> {errorDetails.parsedThemes}
                    </p>
                  )}

                  {errorDetails.errors && errorDetails.errors.length > 0 && (
                    <div>
                      <p className="font-medium">Errors:</p>
                      <ul className="list-disc list-inside ml-2 mt-1">
                        {errorDetails.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {errorDetails.warnings && errorDetails.warnings.length > 0 && (
                    <div>
                      <p className="font-medium">Warnings:</p>
                      <ul className="list-disc list-inside ml-2 mt-1">
                        {errorDetails.warnings.map((warn, i) => (
                          <li key={i}>{warn}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {errorDetails.diagnostics && (
                    <div className="mt-3 p-3 bg-background/50 rounded-lg border border-destructive/20">
                      <p className="font-medium mb-2">Diagnostics:</p>
                      <div className="space-y-1 text-xs">
                        {errorDetails.diagnostics.isLikelyImagePdf && (
                          <div className="mb-3 p-2 bg-amber-100 dark:bg-amber-900/30 rounded text-amber-800 dark:text-amber-200">
                            <p className="font-medium">Image-based PDF Detected</p>
                            <p className="mt-1">
                              This PDF appears to be scanned or image-based. The system can only read PDFs with actual text content.
                            </p>
                            <p className="mt-2">
                              <strong>Solution:</strong> Download the original PDF from{" "}
                              <a
                                href="https://my.gallup.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline hover:no-underline"
                              >
                                my.gallup.com
                              </a>
                            </p>
                          </div>
                        )}
                        <p>
                          <span className="opacity-70">Text extracted:</span>{" "}
                          {errorDetails.diagnostics.textExtracted ? "Yes" : "No (PDF may be image-based)"}
                        </p>
                        <p>
                          <span className="opacity-70">Characters found:</span>{" "}
                          {errorDetails.diagnostics.textLength.toLocaleString()}
                        </p>
                        {errorDetails.diagnostics.participantName && (
                          <p>
                            <span className="opacity-70">Participant detected:</span>{" "}
                            {errorDetails.diagnostics.participantName}
                          </p>
                        )}
                        {errorDetails.diagnostics.textPreview && (
                          <div className="mt-2">
                            <p className="opacity-70">Text preview:</p>
                            <p className="mt-1 p-2 bg-muted/50 rounded text-[10px] font-mono break-all">
                              {errorDetails.diagnostics.textPreview}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
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
          <CardTitle className="text-lg">How to Get Your CliftonStrengths Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex-shrink-0">
                1
              </div>
              <div>
                <p className="text-sm font-medium">Take the Assessment</p>
                <p className="text-sm text-muted-foreground">
                  Complete the CliftonStrengths assessment at{" "}
                  <a
                    href="https://www.gallup.com/cliftonstrengths"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    gallup.com/cliftonstrengths
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex-shrink-0">
                2
              </div>
              <div>
                <p className="text-sm font-medium">Download Your Report</p>
                <p className="text-sm text-muted-foreground">
                  Log in to{" "}
                  <a
                    href="https://my.gallup.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    my.gallup.com
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  {" "}and download your Signature Themes report as PDF
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex-shrink-0">
                3
              </div>
              <div>
                <p className="text-sm font-medium">Upload Here</p>
                <p className="text-sm text-muted-foreground">
                  Drag and drop your PDF above or click to browse
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t">
            <p className="text-sm text-muted-foreground">
              <strong>What gets imported:</strong> Your top 5, top 10, or all 34 strength themes with personalized insights and descriptions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
