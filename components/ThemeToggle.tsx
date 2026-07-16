"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme, type Theme } from "@/components/ThemeProvider";

const OPTS: { v: Theme; Icon: typeof Sun; label: string }[] = [
  { v: "light", Icon: Sun, label: "Light" },
  { v: "dark", Icon: Moon, label: "Dark" },
  { v: "system", Icon: Monitor, label: "System" },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <div
      className="inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5"
      role="group"
      aria-label="Theme"
    >
      {OPTS.map(({ v, Icon, label }) => (
        <button
          key={v}
          type="button"
          onClick={() => setTheme(v)}
          aria-pressed={theme === v}
          title={label}
          className={`grid h-7 w-7 place-items-center rounded-md transition ${
            theme === v
              ? "bg-card text-teal shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Icon className="h-[15px] w-[15px]" />
          <span className="sr-only">{label}</span>
        </button>
      ))}
    </div>
  );
}
