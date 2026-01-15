"use client";

import { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

interface ConfettiPiece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  size: number;
  shape: "square" | "circle" | "star";
  life: number;
}

const DOMAIN_COLORS = [
  "#7B68EE", // Executing
  "#F5A623", // Influencing
  "#4A90D9", // Relationship
  "#7CB342", // Strategic
];

interface ConfettiProps {
  active: boolean;
  onComplete?: () => void;
  particleCount?: number;
  origin?: { x: number; y: number };
  spread?: number;
  duration?: number;
}

export function Confetti({
  active,
  onComplete,
  particleCount = 100,
  origin = { x: 0.5, y: 0.5 },
  spread = 60,
  duration = 3000,
}: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const piecesRef = useRef<ConfettiPiece[]>([]);
  const animationRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number>(0);

  const createPiece = useCallback(
    (originX: number, originY: number): ConfettiPiece => {
      const angle = (Math.random() - 0.5) * spread * (Math.PI / 180);
      const velocity = 15 + Math.random() * 10;

      return {
        x: originX,
        y: originY,
        vx: Math.sin(angle) * velocity * (Math.random() > 0.5 ? 1 : -1),
        vy: -Math.cos(angle) * velocity - Math.random() * 5,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        color: DOMAIN_COLORS[Math.floor(Math.random() * DOMAIN_COLORS.length)],
        size: 8 + Math.random() * 8,
        shape: ["square", "circle", "star"][Math.floor(Math.random() * 3)] as ConfettiPiece["shape"],
        life: 1,
      };
    },
    [spread]
  );

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const originX = canvas.width * origin.x;
    const originY = canvas.height * origin.y;

    // Create initial burst
    piecesRef.current = Array.from({ length: particleCount }, () =>
      createPiece(originX, originY)
    );
    startTimeRef.current = Date.now();

    const drawStar = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      const spikes = 5;
      const outerRadius = size;
      const innerRadius = size / 2;

      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i * Math.PI) / spikes - Math.PI / 2;
        const px = x + Math.cos(angle) * radius;
        const py = y + Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
    };

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      if (elapsed > duration) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onComplete?.();
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      piecesRef.current.forEach((piece) => {
        piece.x += piece.vx;
        piece.y += piece.vy;
        piece.vy += 0.5; // Gravity
        piece.vx *= 0.99; // Air resistance
        piece.rotation += piece.rotationSpeed;
        piece.life = Math.max(0, 1 - elapsed / duration);

        ctx.save();
        ctx.translate(piece.x, piece.y);
        ctx.rotate((piece.rotation * Math.PI) / 180);
        ctx.globalAlpha = piece.life;
        ctx.fillStyle = piece.color;

        switch (piece.shape) {
          case "square":
            ctx.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size);
            break;
          case "circle":
            ctx.beginPath();
            ctx.arc(0, 0, piece.size / 2, 0, Math.PI * 2);
            ctx.fill();
            break;
          case "star":
            drawStar(ctx, 0, 0, piece.size / 2);
            ctx.fill();
            break;
        }

        ctx.restore();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [active, particleCount, origin, spread, duration, createPiece, onComplete]);

  if (!active) return null;

  if (typeof document === "undefined") return null;

  return createPortal(
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
    />,
    document.body
  );
}
