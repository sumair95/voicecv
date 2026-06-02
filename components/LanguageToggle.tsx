"use client";

import { useEffect, useRef, useState } from "react";
import { Globe, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/LanguageProvider";
import { LANGUAGES } from "@/lib/i18n";
import type { Language } from "@/types/cv";

export function LanguageToggle({ className }: { className?: string }) {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  return (
    <div ref={ref} className={`relative ${className ?? ""}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle language"
        aria-expanded={open}
      >
        <Globe className="h-4 w-4 me-2" />
        {current.label}
      </Button>
      {open && (
        <div
          role="menu"
          className="absolute end-0 z-50 mt-2 w-44 overflow-hidden rounded-xl border border-navy-100 bg-white shadow-lg"
        >
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              role="menuitem"
              onClick={() => {
                setLang(l.code as Language);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-sm transition hover:bg-teal/5 ${
                l.code === lang ? "bg-teal/5 text-teal-700" : "text-navy-900"
              }`}
              dir={l.dir}
            >
              <span>{l.label}</span>
              {l.code === lang && <Check className="h-4 w-4 text-teal" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
