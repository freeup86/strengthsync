"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Lock, AlertCircle, CheckCircle, ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Verify token on mount
  useEffect(() => {
    async function verifyToken() {
      if (!token) {
        setError("No reset token provided");
        setIsVerifying(false);
        return;
      }

      try {
        const response = await fetch(`/api/auth/reset-password?token=${token}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.message || "Invalid or expired reset link");
          setTokenValid(false);
        } else {
          setTokenValid(true);
          setUserEmail(data.data?.email || null);
        }
      } catch (err) {
        setError("Failed to verify reset link");
        setTokenValid(false);
      } finally {
        setIsVerifying(false);
      }
    }

    verifyToken();
  }, [token]);

  const validatePassword = () => {
    if (password.length < 8) {
      return "Password must be at least 8 characters";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number";
    }
    if (password !== confirmPassword) {
      return "Passwords do not match";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validatePassword();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to reset password");
        return;
      }

      setIsSuccess(true);
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while verifying token
  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 mesh-gradient">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="floating-orb w-[400px] h-[400px] -top-24 -left-24 bg-domain-executing opacity-30" />
          <div className="floating-orb w-[300px] h-[300px] top-1/2 -right-20 bg-domain-influencing opacity-30" style={{ animationDelay: "2s" }} />
          <div className="floating-orb w-[350px] h-[350px] -bottom-24 left-1/4 bg-domain-strategic opacity-30" style={{ animationDelay: "4s" }} />
        </div>
        <div className="relative w-full max-w-md">
          <div className="flex items-center justify-center mb-8">
            <Logo size="lg" showText />
          </div>
          <Card className="shadow-soft-lg dark:shadow-soft-lg-dark">
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Verifying reset link...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 mesh-gradient">
      {/* Floating orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="floating-orb w-[400px] h-[400px] -top-24 -left-24 bg-domain-executing opacity-30" />
        <div className="floating-orb w-[300px] h-[300px] top-1/2 -right-20 bg-domain-influencing opacity-30" style={{ animationDelay: "2s" }} />
        <div className="floating-orb w-[350px] h-[350px] -bottom-24 left-1/4 bg-domain-strategic opacity-30" style={{ animationDelay: "4s" }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <Logo size="lg" showText />
        </div>

        <Card className="shadow-soft-lg dark:shadow-soft-lg-dark">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {isSuccess ? "Password reset!" : tokenValid ? "Create new password" : "Invalid link"}
            </CardTitle>
            <CardDescription>
              {isSuccess
                ? "Your password has been successfully reset"
                : tokenValid
                ? userEmail
                  ? `Enter a new password for ${userEmail}`
                  : "Enter your new password below"
                : "This reset link is invalid or has expired"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {isSuccess ? (
              <div className="space-y-6">
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="w-16 h-16 rounded-full bg-domain-strategic-light flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-domain-strategic" />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    You can now sign in with your new password.
                  </p>
                </div>
                <Button className="w-full" onClick={() => router.push("/auth/login")}>
                  Sign in
                </Button>
              </div>
            ) : tokenValid ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    New password
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      icon={<Lock className="h-4 w-4" />}
                      required
                      autoComplete="new-password"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Must be at least 8 characters with uppercase, lowercase, and number
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirm password
                  </label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    icon={<Lock className="h-4 w-4" />}
                    required
                    autoComplete="new-password"
                  />
                </div>

                <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                  Reset password
                </Button>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                    <AlertCircle className="h-8 w-8 text-destructive" />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    {error || "This password reset link is invalid or has expired. Please request a new one."}
                  </p>
                </div>
                <Link href="/auth/forgot-password" className="block">
                  <Button className="w-full">Request new reset link</Button>
                </Link>
                <Link href="/auth/login" className="block">
                  <Button variant="ghost" className="w-full">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to sign in
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ResetPasswordFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 mesh-gradient">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="floating-orb w-[400px] h-[400px] -top-24 -left-24 bg-domain-executing opacity-30" />
        <div className="floating-orb w-[300px] h-[300px] top-1/2 -right-20 bg-domain-influencing opacity-30" style={{ animationDelay: "2s" }} />
        <div className="floating-orb w-[350px] h-[350px] -bottom-24 left-1/4 bg-domain-strategic opacity-30" style={{ animationDelay: "4s" }} />
      </div>
      <div className="relative w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <Logo size="lg" showText />
        </div>
        <Card className="shadow-soft-lg dark:shadow-soft-lg-dark">
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
