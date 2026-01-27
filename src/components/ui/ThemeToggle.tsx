"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const label = theme === "dark" ? "Dark" : "Light";

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
        className
      )}
      title={`Theme: ${label} (click to toggle)`}
      aria-label={`Toggle theme, current: ${label}`}
    >
      {theme === "dark" ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
      {showLabel && <span className="text-sm">{label}</span>}
    </button>
  );
}

// Alternative: Dropdown version for more control
export function ThemeToggleDropdown({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className={cn("relative group", className)}>
      <button
        className="inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        title="Change theme"
        aria-label="Change theme"
      >
        {theme === "dark" ? (
          <Moon className="h-4 w-4" />
        ) : (
          <Sun className="h-4 w-4" />
        )}
      </button>

      <div className="absolute right-0 top-full mt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-dropdown">
        <div className="bg-card border border-border rounded-xl shadow-soft-lg dark:shadow-soft-lg-dark p-1 min-w-[100px]">
          <button
            onClick={() => setTheme("light")}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors",
              theme === "light"
                ? "bg-primary/10 text-primary"
                : "hover:bg-muted text-foreground"
            )}
          >
            <Sun className="h-4 w-4" />
            Light
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors",
              theme === "dark"
                ? "bg-primary/10 text-primary"
                : "hover:bg-muted text-foreground"
            )}
          >
            <Moon className="h-4 w-4" />
            Dark
          </button>
        </div>
      </div>
    </div>
  );
}
