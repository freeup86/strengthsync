"use client";

import { useState, useCallback } from "react";

export function useConfetti() {
  const [isActive, setIsActive] = useState(false);
  const [origin, setOrigin] = useState({ x: 0.5, y: 0.5 });

  const fire = useCallback((options?: { origin?: { x: number; y: number } }) => {
    if (options?.origin) setOrigin(options.origin);
    setIsActive(true);
  }, []);

  const fireFromElement = useCallback((element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;
    setOrigin({ x, y });
    setIsActive(true);
  }, []);

  const reset = useCallback(() => setIsActive(false), []);

  return {
    isActive,
    origin,
    fire,
    fireFromElement,
    reset,
  };
}
