"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Mail, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to send reset email");
        return;
      }

      setIsSubmitted(true);
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

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
            <CardTitle className="text-2xl">Reset your password</CardTitle>
            <CardDescription>
              {isSubmitted
                ? "Check your email for the reset link"
                : "Enter your email and we'll send you a reset link"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {isSubmitted ? (
              <div className="space-y-6">
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="w-16 h-16 rounded-full bg-domain-strategic-light flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-domain-strategic" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      If an account exists for <strong>{email}</strong>, you will receive a password reset email shortly.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setIsSubmitted(false);
                      setEmail("");
                    }}
                  >
                    Try another email
                  </Button>
                  <Link href="/auth/login" className="block">
                    <Button variant="ghost" className="w-full">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to sign in
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    icon={<Mail className="h-4 w-4" />}
                    required
                    autoComplete="email"
                    autoFocus
                  />
                </div>

                <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                  Send reset link
                </Button>

                <div className="text-center">
                  <Link
                    href="/auth/login"
                    className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Back to sign in
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
