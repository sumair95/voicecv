"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Mail, Briefcase } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

/** Count up from 0 to `target` with an ease-out, starting when it scrolls in. */
function useCountUp(target: number, active: boolean, ms = 1400) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!active || target <= 0) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / ms);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, ms]);
  return n;
}

function Stat({
  icon: Icon,
  value,
  label,
  active,
}: {
  icon: typeof FileText;
  value: number;
  label: string;
  active: boolean;
}) {
  const n = useCountUp(value, active);
  return (
    <div className="flex flex-col items-center text-center">
      <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-teal/10 text-teal">
        <Icon className="h-6 w-6" />
      </span>
      <div className="text-4xl font-extrabold tracking-tight text-foreground tabular-nums md:text-5xl">
        {n.toLocaleString()}
        <span className="text-teal">+</span>
      </div>
      <div className="mt-1 text-sm font-medium text-muted-foreground">{label}</div>
    </div>
  );
}

export function ImpactCounters() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<{ cvs: number; coverLetters: number; jobs: number } | null>(
    null,
  );
  const [active, setActive] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => setStats({ cvs: d.cvs ?? 0, coverLetters: d.coverLetters ?? 0, jobs: d.jobs ?? 0 }))
      .catch(() => {});
  }, []);

  // Trigger the count-up when the band scrolls into view.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && setActive(true),
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const items = [
    { icon: FileText, value: stats?.cvs ?? 0, label: t("landing.impact.cvs") },
    { icon: Mail, value: stats?.coverLetters ?? 0, label: t("landing.impact.letters") },
    { icon: Briefcase, value: stats?.jobs ?? 0, label: t("landing.impact.jobs") },
  ];

  return (
    <section className="border-y border-border/60 bg-card">
      <div ref={ref} className="container py-14">
        <h2 className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">
          {t("landing.impact.title")}
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-muted-foreground">
          {t("landing.impact.subtitle")}
        </p>
        <div className="mt-10 grid grid-cols-1 gap-10 sm:grid-cols-3">
          {items.map((it) => (
            <Stat key={it.label} icon={it.icon} value={it.value} label={it.label} active={active} />
          ))}
        </div>
      </div>
    </section>
  );
}
