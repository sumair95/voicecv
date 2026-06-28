"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { format } from "date-fns";
import { toast } from "sonner";
import { Plus, FileText, Sparkles, Loader2, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/LanguageProvider";
import { PremiumCard } from "@/components/PremiumCard";
import { UpsellModal } from "@/components/UpsellModal";
import { FREE_CV_LIMIT } from "@/lib/premium";
import { createClient } from "@/lib/supabase/client";
import type { CVRecord, Profile } from "@/types/cv";

const PAGE_SIZE = 20;

export default function DashboardPage() {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const [cvs, setCvs] = useState<CVRecord[]>([]);
  const [upsellOpen, setUpsellOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  // Surface the Stripe Checkout result, then strip the query param so a
  // refresh doesn't re-toast. Credits themselves are granted by the webhook.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const premium = params.get("premium");
    if (premium === "success") toast.success(t("premium.success"));
    else if (premium === "cancel") toast(t("premium.cancel"));
    if (premium) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [t]);

  const loadPage = useCallback(
    async (cursor?: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { rows: [], hasMore: false };
      let q = supabase
        .from("cvs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE + 1);
      if (cursor) q = q.lt("created_at", cursor);
      const { data } = await q;
      const rows = (data as CVRecord[]) ?? [];
      const trimmed = rows.slice(0, PAGE_SIZE);
      return { rows: trimmed, hasMore: rows.length > PAGE_SIZE };
    },
    [supabase],
  );

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: profileRow }, page] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        loadPage(),
      ]);
      setProfile(profileRow as Profile | null);
      setCvs(page.rows);
      setHasMore(page.hasMore);
      setLoading(false);
    })();
  }, [supabase, loadPage]);

  async function loadMore() {
    if (cvs.length === 0) return;
    setLoadingMore(true);
    const last = cvs[cvs.length - 1];
    const page = await loadPage(last.created_at);
    setCvs((prev) => [...prev, ...page.rows]);
    setHasMore(page.hasMore);
    setLoadingMore(false);
  }

  async function deleteCV(id: string) {
    setDeletingId(id);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setDeletingId(null);
      return;
    }
    // RLS (`own cvs` policy) also scopes this to the owner; the explicit
    // user_id filter is belt-and-suspenders.
    const { error } = await supabase
      .from("cvs")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    setDeletingId(null);
    setConfirmingId(null);
    if (error) {
      toast.error(t("dashboard.delete.error"));
      return;
    }
    setCvs((prev) => prev.filter((cv) => cv.id !== id));
    toast.success(t("dashboard.delete.success"));
  }

  async function downloadPdf(cv: CVRecord) {
    setDownloadingId(cv.id);
    try {
      const res = await fetch("/api/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvId: cv.id }),
      });
      if (!res.ok) {
        const ct = res.headers.get("content-type") ?? "";
        let detail = `HTTP ${res.status}`;
        if (ct.includes("application/json")) {
          const data = await res.json().catch(() => null);
          if (data?.error) detail = String(data.error);
        } else {
          const text = await res.text().catch(() => "");
          if (text) detail = text.slice(0, 200);
        }
        throw new Error(detail);
      }
      const blob = await res.blob();
      if (blob.size === 0) throw new Error("PDF was empty");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${cv.cv_data?.personal?.full_name || cv.title || "CV"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(t("dashboard.download.success"));
    } catch (err) {
      console.error("[downloadPdf]", err);
      toast.error(t("dashboard.download.error"));
    } finally {
      setDownloadingId(null);
    }
  }

  const greetingName = profile?.full_name?.split(" ")[0] ?? "";
  const cvAllowance = FREE_CV_LIMIT + (profile?.cv_credits ?? 0);
  const atCvLimit = (profile?.cvs_created ?? 0) >= cvAllowance;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-navy-900">
            {t("dashboard.welcome")}{greetingName ? `, ${greetingName}` : ""} 👋
          </h1>
          <p className="mt-1 text-navy-400">{t("dashboard.myCvs")}</p>
        </div>
        <Button
          size="lg"
          className="bg-teal hover:bg-teal-600"
          onClick={() => (atCvLimit ? setUpsellOpen(true) : router.push("/record"))}
        >
          <Plus className="me-2 h-5 w-5" />
          {t("dashboard.create")}
        </Button>
      </div>

      {!loading && (
        <PremiumCard
          cvCredits={profile?.premium_cv_credits ?? 0}
          letterCredits={profile?.cover_letter_credits ?? 0}
        />
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-navy-100/60">
              <CardContent className="h-40 animate-pulse bg-navy-50/40" />
            </Card>
          ))}
        </div>
      ) : cvs.length === 0 ? (
        <Card className="border-dashed border-navy-100">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-teal/10 text-teal">
              <Sparkles className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-semibold text-navy-900">{t("dashboard.empty.title")}</h2>
            <p className="max-w-md text-navy-400">{t("dashboard.empty.desc")}</p>
            <Button asChild size="lg" className="bg-teal hover:bg-teal-600">
              <Link href="/record">
                <Plus className="me-2 h-5 w-5" />
                {t("dashboard.create")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
          {cvs.map((cv, i) => (
            <motion.div
              key={cv.id}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: confirmingId || deletingId ? 0 : i * 0.04 }}
              className="relative"
            >
              <Link href={`/cv/${cv.id}`}>
                <Card className="h-full border-navy-100/60 transition hover:-translate-y-0.5 hover:border-teal/50 hover:shadow-md">
                  <CardContent className="space-y-3 p-6">
                    <div className="flex items-center justify-between gap-2">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal/10 text-teal">
                        <FileText className="h-5 w-5" />
                      </span>
                      <Badge variant={cv.status === "ready" || cv.status === "exported" ? "default" : "secondary"}>
                        {t(`status.${cv.status}`)}
                      </Badge>
                    </div>
                    <div>
                      <div className="line-clamp-1 pe-7 font-semibold text-navy-900">
                        {cv.title ?? cv.cv_data?.personal?.full_name ?? "Untitled CV"}
                      </div>
                      <div className="mt-1 text-sm text-navy-400">
                        {format(new Date(cv.created_at), lang === "ar" ? "yyyy/MM/dd" : "MMM d, yyyy")}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <div className="absolute bottom-4 end-4 flex items-center gap-1">
                {cv.cv_data && (
                  <button
                    type="button"
                    aria-label={t("cv.download")}
                    title={t("cv.download")}
                    disabled={downloadingId === cv.id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      downloadPdf(cv);
                    }}
                    className="grid h-8 w-8 place-items-center rounded-lg text-navy-300 transition hover:bg-teal/10 hover:text-teal disabled:opacity-60"
                  >
                    {downloadingId === cv.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </button>
                )}
                <button
                  type="button"
                  aria-label={t("dashboard.delete")}
                  title={t("dashboard.delete")}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setConfirmingId(cv.id);
                  }}
                  className="grid h-8 w-8 place-items-center rounded-lg text-navy-300 transition hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {confirmingId === cv.id && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 z-10 flex flex-col justify-center gap-3 rounded-xl border border-navy-100/60 bg-white/95 p-6 text-center backdrop-blur"
                >
                  <div>
                    <div className="font-semibold text-navy-900">
                      {t("dashboard.delete.confirmTitle")}
                    </div>
                    <div className="mt-1 text-sm text-navy-400">
                      {t("dashboard.delete.confirmDesc")}
                    </div>
                  </div>
                  <div className="flex justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmingId(null)}
                      disabled={deletingId === cv.id}
                    >
                      {t("common.cancel")}
                    </Button>
                    <Button
                      size="sm"
                      className="bg-red-600 hover:bg-red-700"
                      onClick={() => deleteCV(cv.id)}
                      disabled={deletingId === cv.id}
                    >
                      {deletingId === cv.id && (
                        <Loader2 className="me-2 h-4 w-4 animate-spin" />
                      )}
                      {t("dashboard.delete.confirm")}
                    </Button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
          </AnimatePresence>
        </div>
        {hasMore && (
          <div className="mt-6 flex justify-center">
            <Button
              variant="outline"
              onClick={loadMore}
              disabled={loadingMore}
            >
              {loadingMore && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              Load more
            </Button>
          </div>
        )}
        </>
      )}

      <UpsellModal open={upsellOpen} onClose={() => setUpsellOpen(false)} />
    </div>
  );
}
