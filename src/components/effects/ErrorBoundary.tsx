"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("[ErrorBoundary] Component error caught:", error);
    console.error("[ErrorBoundary] Component stack:", errorInfo.componentStack);

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isDev = process.env.NODE_ENV === "development";

      return (
        <Card className="border-destructive/30">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center py-6">
              <div className="p-3 rounded-full bg-destructive/10 mb-4">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-1">
                Something went wrong
              </h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-md">
                This section encountered an unexpected error. Please try again.
              </p>
              {isDev && this.state.error && (
                <pre className="text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded-lg p-3 mb-4 max-w-full overflow-x-auto text-left whitespace-pre-wrap break-words">
                  {this.state.error.message}
                </pre>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleReset}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try again
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
