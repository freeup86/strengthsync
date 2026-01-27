"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ErrorBoundary } from "@/components/effects/ErrorBoundary";

export interface StreamingTextProps {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
  cursor?: boolean;
}

export function StreamingText({
  text,
  speed = 20,
  className,
  onComplete,
  cursor = true,
}: StreamingTextProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!text) {
      setDisplayedText("");
      setIsComplete(false);
      return;
    }

    let currentIndex = 0;
    setDisplayedText("");
    setIsComplete(false);

    const interval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(interval);
        setIsComplete(true);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, onComplete]);

  return (
    <ErrorBoundary
      fallback={
        <span className={cn("text-sm text-destructive", className)}>
          Failed to render text content.
        </span>
      }
    >
      <span className={cn("whitespace-pre-wrap", className)}>
        {displayedText}
        {cursor && !isComplete && (
          <span className="inline-block w-2 h-4 ml-0.5 bg-current animate-pulse" />
        )}
      </span>
    </ErrorBoundary>
  );
}

// Component for displaying already-streamed text (from AI SDK)
export function AIStreamedText({
  text,
  isStreaming = false,
  className,
}: {
  text: string;
  isStreaming?: boolean;
  className?: string;
}) {
  return (
    <ErrorBoundary
      fallback={
        <span className={cn("text-sm text-destructive", className)}>
          Failed to render text content.
        </span>
      }
    >
      <span className={cn("whitespace-pre-wrap", className)}>
        {text}
        {isStreaming && (
          <span className="inline-block w-2 h-4 ml-0.5 bg-current animate-pulse" />
        )}
      </span>
    </ErrorBoundary>
  );
}
