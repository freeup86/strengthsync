"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  User,
  Mail,
  ArrowRight,
  Sparkles,
  Search,
  ChevronDown,
  UserPlus,
  Loader2,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { Breadcrumbs } from "@/components/ui/Breadcrumb";
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

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  jobTitle: string | null;
  hasStrengths: boolean;
}

export default function UploadPage() {
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
  const [previewThemes, setPreviewThemes] = useState<ParsedThemePreview[]>([]);

  // Team members for selector
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const memberDropdownRef = useRef<HTMLDivElement>(null);

  // Form for assigning to user
  const [assignMode, setAssignMode] = useState<"select" | "manual">("select");
  const [assignEmail, setAssignEmail] = useState("");
  const [assignName, setAssignName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Check admin access
  const isAdmin = session?.user?.role === "OWNER" || session?.user?.role === "ADMIN";

  // Fetch team members on mount
  useEffect(() => {
    const fetchMembers = async () => {
      setLoadingMembers(true);
      try {
        const res = await fetch("/api/members?limit=100");
        if (res.ok) {
          const data = await res.json();
          // Transform API response to include hasStrengths
          const transformed = (data.data || []).map((m: { id: string; name: string; email: string; avatarUrl: string | null; jobTitle: string | null; topStrengths?: unknown[] }) => ({
            id: m.id,
            name: m.name,
            email: m.email,
            avatarUrl: m.avatarUrl,
            jobTitle: m.jobTitle,
            hasStrengths: (m.topStrengths?.length || 0) > 0,
          }));
          setMembers(transformed);
        }
      } catch (err) {
        console.error("Failed to fetch members:", err);
      } finally {
        setLoadingMembers(false);
      }
    };

    if (isAdmin) {
      fetchMembers();
    }
  }, [isAdmin]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (memberDropdownRef.current && !memberDropdownRef.current.contains(event.target as Node)) {
        setShowMemberDropdown(false);
      }
    }

    if (showMemberDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showMemberDropdown]);

  // Filter members based on search
  const filteredMembers = members.filter((m) => {
    const search = memberSearch.toLowerCase();
    return (
      m.name.toLowerCase().includes(search) ||
      m.email.toLowerCase().includes(search) ||
      (m.jobTitle && m.jobTitle.toLowerCase().includes(search))
    );
  });

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

      // Use selected member or manual entry
      if (assignMode === "select" && selectedMember) {
        formData.append("forUserEmail", selectedMember.email);
        formData.append("forUserName", selectedMember.name);
      } else if (assignMode === "manual" && assignEmail) {
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
        setErrorDetails({
          errors: data.error?.details?.errors,
          warnings: data.error?.details?.warnings,
          parsedThemes: data.error?.details?.parsedThemes,
          diagnostics: data.error?.details?.diagnostics,
        });
        setPreviewThemes([]);
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
    setErrorDetails(null);
    setAssignEmail("");
    setAssignName("");
    setPreviewThemes([]);
    setSelectedMember(null);
    setMemberSearch("");
    setAssignMode("select");
  };

  if (!isAdmin) {
    return (
      <div className="max-w-7xl mx-auto text-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h1 className="font-display text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground">
          Only organization admins can upload strength reports.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Upload Strengths" },
        ]}
      />

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
                {/* Mode toggle */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={assignMode === "select" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setAssignMode("select");
                      setAssignEmail("");
                      setAssignName("");
                    }}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Select Existing
                  </Button>
                  <Button
                    type="button"
                    variant={assignMode === "manual" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setAssignMode("manual");
                      setSelectedMember(null);
                      setMemberSearch("");
                    }}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    New Member
                  </Button>
                </div>

                {/* Member selector */}
                {assignMode === "select" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Team Member</label>
                    <div className="relative" ref={memberDropdownRef}>
                      {/* Selected member display or search input */}
                      {selectedMember ? (
                        <button
                          type="button"
                          className="w-full flex items-center justify-between p-3 border rounded-lg bg-muted/50 cursor-pointer hover:bg-muted text-left"
                          onClick={() => {
                            setSelectedMember(null);
                            setShowMemberDropdown(true);
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar size="sm">
                              <AvatarImage src={selectedMember.avatarUrl || undefined} />
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                {getInitials(selectedMember.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{selectedMember.name}</p>
                              <p className="text-xs text-muted-foreground">{selectedMember.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {selectedMember.hasStrengths && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                Has Strengths
                              </span>
                            )}
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </button>
                      ) : (
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={memberSearch}
                            onChange={(e) => {
                              setMemberSearch(e.target.value);
                              setShowMemberDropdown(true);
                            }}
                            onFocus={() => setShowMemberDropdown(true)}
                            autoComplete="off"
                            data-lpignore="true"
                            data-form-type="other"
                            className="w-full pl-10 pr-4 py-2.5 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                          {loadingMembers && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                          )}
                        </div>
                      )}

                      {/* Dropdown */}
                      {showMemberDropdown && !selectedMember && (
                        <div className="absolute z-dropdown w-full mt-1 bg-card border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                          {filteredMembers.length === 0 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                              {memberSearch ? (
                                <>
                                  No members found.{" "}
                                  <button
                                    type="button"
                                    className="text-primary hover:underline"
                                    onClick={() => {
                                      setAssignMode("manual");
                                      setAssignEmail(memberSearch.includes("@") ? memberSearch : "");
                                      setAssignName(memberSearch.includes("@") ? "" : memberSearch);
                                      setShowMemberDropdown(false);
                                    }}
                                  >
                                    Add manually
                                  </button>
                                </>
                              ) : (
                                "Type to search team members"
                              )}
                            </div>
                          ) : (
                            filteredMembers.slice(0, 10).map((member) => (
                              <button
                                key={member.id}
                                type="button"
                                className="w-full flex items-center gap-3 p-3 hover:bg-muted text-left transition-colors"
                                onClick={() => {
                                  setSelectedMember(member);
                                  setShowMemberDropdown(false);
                                  setMemberSearch("");
                                }}
                              >
                                <Avatar size="sm">
                                  <AvatarImage src={member.avatarUrl || undefined} />
                                  <AvatarFallback className="bg-primary text-primary-foreground">
                                    {getInitials(member.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{member.name}</p>
                                  <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                                </div>
                                {member.hasStrengths && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 flex-shrink-0">
                                    Has Strengths
                                  </span>
                                )}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                    {selectedMember?.hasStrengths && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        This member already has strengths. Uploading will replace their existing data.
                      </p>
                    )}
                  </div>
                )}

                {/* Manual entry */}
                {assignMode === "manual" && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email Address</label>
                      <Input
                        type="email"
                        placeholder="teammate@company.com"
                        value={assignEmail}
                        onChange={(e) => setAssignEmail(e.target.value)}
                        icon={<Mail className="h-4 w-4" />}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Full Name</label>
                      <Input
                        type="text"
                        placeholder="Jane Smith"
                        value={assignName}
                        onChange={(e) => setAssignName(e.target.value)}
                        icon={<User className="h-4 w-4" />}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

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
                            <p className="font-medium">📄 Image-based PDF Detected</p>
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
          <CardTitle className="text-lg">About CliftonStrengths Reports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">
            Upload the PDF export from Gallup&apos;s CliftonStrengths assessment. The system will
            automatically extract:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1 text-sm">
            <li>Participant name (when available)</li>
            <li>Top 5, Top 10, or all 34 strength themes</li>
            <li>Theme rankings in order of strength</li>
          </ul>
          <p className="text-sm text-muted-foreground">
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
