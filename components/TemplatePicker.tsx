"use client";

import { Check, Crown, Lock } from "lucide-react";
import { TEMPLATES } from "@/types/cv";
import type { TemplateId } from "@/types/cv";

interface Props {
  value: TemplateId;
  onChange: (next: TemplateId) => void;
  className?: string;
  /** When true, premium templates are selectable (parent handles unlock). */
  premiumEnabled?: boolean;
}

export function TemplatePicker({ value, onChange, className, premiumEnabled }: Props) {
  return (
    <div className={`no-print ${className ?? ""}`}>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Template
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="CV template">
        {TEMPLATES.map((tpl) => {
          const active = tpl.id === value;
          // Premium templates are locked only when premium isn't enabled.
          const locked = tpl.premium && !premiumEnabled;
          return (
            <button
              key={tpl.id}
              type="button"
              disabled={locked}
              onClick={() => !locked && onChange(tpl.id)}
              // The selected state is conveyed only by colour otherwise, and
              // "Premium"/"locked" only by a small icon (L3).
              aria-pressed={active}
              aria-label={
                locked
                  ? `${tpl.name} — Premium, locked`
                  : tpl.premium
                    ? `${tpl.name} — Premium`
                    : tpl.name
              }
              title={
                locked
                  ? `${tpl.name} — Premium (coming soon)`
                  : tpl.premium
                    ? `${tpl.name} — Premium · ${tpl.description}`
                    : tpl.description
              }
              className={`group relative flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                active
                  ? "border-teal bg-teal/10 text-teal-700"
                  : locked
                    ? "border-border bg-muted/40 text-muted-foreground opacity-60"
                    : "border-border text-foreground hover:border-teal/50 hover:bg-teal/5"
              }`}
            >
              {tpl.premium && (
                <span className="absolute -end-1.5 -top-1.5 grid h-4 w-4 place-items-center rounded-full bg-amber-400 text-[8px] font-bold text-white">
                  {locked ? <Lock className="h-2.5 w-2.5" /> : <Crown className="h-2.5 w-2.5" />}
                </span>
              )}
              {active && <Check className="h-3.5 w-3.5" />}
              {tpl.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
