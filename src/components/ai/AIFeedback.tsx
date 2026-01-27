"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ThumbsUp, ThumbsDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AIFeedbackProps {
  onFeedback?: (feedback: "positive" | "negative") => void;
  className?: string;
  disabled?: boolean;
  showLabels?: boolean;
}

export function AIFeedback({
  onFeedback,
  className,
  disabled = false,
  showLabels = false,
}: AIFeedbackProps) {
  const [selectedFeedback, setSelectedFeedback] = useState<"positive" | "negative" | null>(null);

  const handleFeedback = (feedback: "positive" | "negative") => {
    if (disabled || selectedFeedback) return;
    setSelectedFeedback(feedback);
    onFeedback?.(feedback);
  };

  if (selectedFeedback) {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
        <Check className="h-4 w-4 text-domain-strategic" />
        <span>Thanks for your feedback!</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showLabels && (
        <span className="text-xs text-muted-foreground mr-1">Was this helpful?</span>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleFeedback("positive")}
        disabled={disabled}
        className="h-8 px-2 text-muted-foreground hover:text-domain-strategic hover:bg-domain-strategic-light"
      >
        <ThumbsUp className="h-4 w-4" />
        {showLabels && <span className="ml-1 text-xs">Yes</span>}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleFeedback("negative")}
        disabled={disabled}
        className="h-8 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
      >
        <ThumbsDown className="h-4 w-4" />
        {showLabels && <span className="ml-1 text-xs">No</span>}
      </Button>
    </div>
  );
}

// Compact inline feedback
export function AIFeedbackInline({
  onFeedback,
  className,
}: {
  onFeedback?: (feedback: "positive" | "negative") => void;
  className?: string;
}) {
  const [submitted, setSubmitted] = useState(false);

  const handleFeedback = (feedback: "positive" | "negative") => {
    if (submitted) return;
    setSubmitted(true);
    onFeedback?.(feedback);
  };

  if (submitted) {
    return (
      <span className={cn("text-xs text-muted-foreground", className)}>
        Thanks!
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <button
        onClick={() => handleFeedback("positive")}
        className="p-0.5 hover:text-domain-strategic transition-colors"
        title="Helpful"
        aria-label="Helpful"
      >
        <ThumbsUp className="h-3 w-3" />
      </button>
      <button
        onClick={() => handleFeedback("negative")}
        className="p-0.5 hover:text-destructive transition-colors"
        title="Not helpful"
        aria-label="Not helpful"
      >
        <ThumbsDown className="h-3 w-3" />
      </button>
    </span>
  );
}
