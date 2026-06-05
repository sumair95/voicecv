"use client";

import { Check, Crown, Lock } from "lucide-react";
import { TEMPLATES } from "@/types/cv";
import type { TemplateId } from "@/types/cv";

interface Props {
  value: TemplateId;
  onChange: (next: TemplateId) => void;
  className?: string;
}

export function TemplatePicker({ value, onChange, className }: Props) {
  return (
    <div className={`no-print ${className ?? ""}`}>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-navy-400">
        Template
      </div>
      <div className="flex flex-wrap gap-2">
        {TEMPLATES.map((tpl) => {
          const active = tpl.id === value;
          const disabled = tpl.premium;
          return (
            <button
              key={tpl.id}
              type="button"
              disabled={disabled}
              onClick={() => !disabled && onChange(tpl.id)}
              title={
                disabled
                  ? `${tpl.name} — Premium (coming soon)`
                  : tpl.description
              }
              className={`group relative flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                active
                  ? "border-teal bg-teal/10 text-teal-700"
                  : disabled
                    ? "border-navy-100 bg-navy-50/40 text-navy-400 opacity-60"
                    : "border-navy-100 text-navy-700 hover:border-teal/50 hover:bg-teal/5"
              }`}
            >
              {tpl.premium && (
                <span className="absolute -end-1.5 -top-1.5 grid h-4 w-4 place-items-center rounded-full bg-amber-400 text-[8px] font-bold text-white">
                  {disabled ? <Lock className="h-2.5 w-2.5" /> : <Crown className="h-2.5 w-2.5" />}
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
