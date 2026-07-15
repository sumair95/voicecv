"use client";

/**
 * Profile tab — reusable personal details, a profile photo, and a way to push
 * the saved details into any of the user's CVs.
 *
 * Uploads go through /api/photo/upload (server + service-role) so browser
 * storage RLS can't block them. "Take photo" opens a live camera (getUserMedia).
 * The professional conversion (remove.bg) is a paid add-on shown as a placeholder.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, Upload, Trash2, Sparkles, Loader2, FileText } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { createClient } from "@/lib/supabase/client";
import { CameraCapture } from "@/components/CameraCapture";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCurrency, FORMAL_PHOTO_USD_CENTS } from "@/lib/pricing";
import { migrateCvData } from "@/lib/cv/migrate";
import type { CVData } from "@/types/cv";

type Fields = {
  full_name: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  nationality: string;
};

const EMPTY: Fields = {
  full_name: "",
  email: "",
  phone: "",
  city: "",
  country: "",
  nationality: "",
};

interface CvRow {
  id: string;
  title: string | null;
  cv_data: CVData | null;
}

export default function ProfilePage() {
  const { t } = useLanguage();
  const { price } = useCurrency();
  const supabase = useMemo(() => createClient(), []);
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [formalUrl, setFormalUrl] = useState<string | null>(null);
  const [choice, setChoice] = useState<"original" | "formal">("original");
  const [cvs, setCvs] = useState<CvRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const uploadRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const [{ data }, { data: cvRows }] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "full_name, email, phone, city, country, nationality, photo_url, photo_formal_url, photo_choice",
          )
          .eq("id", user.id)
          .single(),
        supabase
          .from("cvs")
          .select("id, title, cv_data")
          .eq("user_id", user.id)
          .not("cv_data", "is", null)
          .order("updated_at", { ascending: false }),
      ]);
      if (data) {
        setFields({
          full_name: data.full_name ?? "",
          email: data.email ?? "",
          phone: data.phone ?? "",
          city: data.city ?? "",
          country: data.country ?? "",
          nationality: data.nationality ?? "",
        });
        setPhotoUrl(data.photo_url ?? null);
        setFormalUrl(data.photo_formal_url ?? null);
        setChoice(data.photo_choice === "formal" ? "formal" : "original");
      }
      setCvs((cvRows as CvRow[]) ?? []);
      setLoading(false);
    })();
  }, [supabase]);

  function set(key: keyof Fields, value: string) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }
    const { error } = await supabase.from("profiles").update(fields).eq("id", user.id);
    setSaving(false);
    if (error) toast.error(t("profile.saveError"));
    else toast.success(t("profile.saved"));
  }

  // Upload via the server route (service-role storage write — no browser RLS).
  async function onFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/photo/upload", { method: "POST", body: fd });
      const json = (await res.json().catch(() => ({}))) as {
        photoUrl?: string;
        error?: string;
      };
      if (!res.ok || !json.photoUrl) {
        toast.error(json.error || t("photo.uploadError"));
        return;
      }
      setPhotoUrl(json.photoUrl);
      setFormalUrl(null);
      setChoice("original");
      toast.success(t("photo.uploaded"));
    } finally {
      setUploading(false);
    }
  }

  async function removePhoto() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("profiles")
      .update({ photo_url: null, photo_formal_url: null, photo_choice: "original" })
      .eq("id", user.id);
    setPhotoUrl(null);
    setFormalUrl(null);
    setChoice("original");
  }

  async function chooseVariant(next: "original" | "formal") {
    setChoice(next);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("profiles").update({ photo_choice: next }).eq("id", user.id);
  }

  // Paid AI conversion (background removal + white bg + crop).
  async function makeFormal() {
    setConverting(true);
    try {
      const res = await fetch("/api/photo/convert", { method: "POST" });
      const json = (await res.json().catch(() => ({}))) as {
        formalUrl?: string;
        error?: string;
      };
      if (!res.ok) {
        toast.error(json.error || t("photo.formalSoon"));
        return;
      }
      if (json.formalUrl) {
        setFormalUrl(json.formalUrl);
        setChoice("formal");
        toast.success(t("photo.formalDone"));
      }
    } finally {
      setConverting(false);
    }
  }

  // Push saved profile details into one CV (profile values win where present).
  async function applyToCv(cv: CvRow) {
    if (!cv.cv_data) return;
    setApplyingId(cv.id);
    try {
      const base = migrateCvData(cv.cv_data);
      const p = base.personal ?? {};
      const merged: CVData = {
        ...base,
        personal: {
          ...p,
          full_name: fields.full_name || p.full_name || "",
          email: fields.email || p.email || "",
          phone: fields.phone || p.phone || "",
          city: fields.city || p.city || "",
          country: fields.country || p.country || "",
          nationality: fields.nationality || p.nationality || "",
        },
      };
      const { error } = await supabase
        .from("cvs")
        .update({ cv_data: merged, updated_at: new Date().toISOString() })
        .eq("id", cv.id);
      if (error) toast.error(t("profile.saveError"));
      else {
        setCvs((list) => list.map((c) => (c.id === cv.id ? { ...c, cv_data: merged } : c)));
        toast.success(t("profile.applied"));
      }
    } finally {
      setApplyingId(null);
    }
  }

  const rows: [keyof Fields, string][] = [
    ["full_name", t("profile.fullName")],
    ["email", t("profile.email")],
    ["phone", t("profile.phone")],
    ["city", t("profile.city")],
    ["country", t("profile.country")],
    ["nationality", t("profile.nationality")],
  ];

  const isEmpty = Object.values(fields).every((v) => !v);
  const shown = choice === "formal" && formalUrl ? formalUrl : photoUrl;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {showCamera && (
        <CameraCapture
          onCapture={(file) => onFile(file)}
          onClose={() => setShowCamera(false)}
        />
      )}

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-navy-900">
          {t("profile.title")}
        </h1>
        <p className="mt-1 text-navy-400">{t("profile.subtitle")}</p>
      </div>

      {/* Photo */}
      <div className="space-y-4 rounded-xl border border-navy-100 bg-white p-6 shadow-sm">
        <div>
          <h2 className="font-semibold text-navy-900">{t("photo.title")}</h2>
          <p className="mt-0.5 text-sm text-navy-400">{t("photo.subtitle")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border border-navy-100 bg-navy-50">
            {shown ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shown} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-navy-300">
                <Camera className="h-8 w-8" />
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <input
              ref={uploadRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => onFile(e.target.files?.[0])}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => uploadRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="me-2 h-4 w-4" />
              )}
              {t("photo.upload")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => setShowCamera(true)}
            >
              <Camera className="me-2 h-4 w-4" />
              {t("photo.take")}
            </Button>
            {photoUrl && (
              <Button variant="ghost" size="sm" onClick={removePhoto}>
                <Trash2 className="me-2 h-4 w-4" />
                {t("photo.remove")}
              </Button>
            )}
          </div>
        </div>

        {photoUrl && (
          <>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={choice === "original" ? "default" : "outline"}
                size="sm"
                className={choice === "original" ? "bg-teal hover:bg-teal-600" : ""}
                onClick={() => chooseVariant("original")}
              >
                {t("photo.useOriginal")}
              </Button>
              <Button
                variant={choice === "formal" ? "default" : "outline"}
                size="sm"
                className={choice === "formal" ? "bg-teal hover:bg-teal-600" : ""}
                disabled={!formalUrl}
                onClick={() => chooseVariant("formal")}
              >
                {t("photo.useFormal")}
              </Button>
            </div>

            {!formalUrl && (
              <button
                onClick={makeFormal}
                disabled={converting}
                className="flex w-full items-center justify-between rounded-lg border border-teal/30 bg-teal-50 px-4 py-3 text-start transition hover:bg-teal-100 disabled:opacity-70"
              >
                <span className="flex items-center gap-2 font-medium text-teal-800">
                  {converting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {converting ? t("photo.converting") : t("photo.makeFormal")}
                </span>
                <span className="flex items-center gap-2 text-sm">
                  <span className="rounded-full bg-teal px-2 py-0.5 text-xs font-semibold text-white">
                    {t("photo.premium")}
                  </span>
                  <span className="text-teal-700">{price(FORMAL_PHOTO_USD_CENTS)}</span>
                </span>
              </button>
            )}
          </>
        )}
      </div>

      {/* Personal details */}
      <div className="space-y-4 rounded-xl border border-navy-100 bg-white p-6 shadow-sm">
        {loading ? (
          <p className="text-navy-400">…</p>
        ) : (
          <>
            {isEmpty && (
              <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-800">
                {t("profile.hint")}
              </p>
            )}
            {rows.map(([key, label]) => (
              <div key={key} className="space-y-1.5">
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  value={fields[key]}
                  onChange={(e) => set(key, e.target.value)}
                />
              </div>
            ))}
            <Button
              onClick={save}
              disabled={saving}
              className="bg-teal hover:bg-teal-600"
            >
              {t("profile.save")}
            </Button>
          </>
        )}
      </div>

      {/* Apply to CVs */}
      {!loading && (
        <div className="space-y-4 rounded-xl border border-navy-100 bg-white p-6 shadow-sm">
          <div>
            <h2 className="font-semibold text-navy-900">{t("profile.applyCvsTitle")}</h2>
            <p className="mt-0.5 text-sm text-navy-400">{t("profile.applyCvsHint")}</p>
          </div>
          {cvs.length === 0 ? (
            <p className="text-sm text-navy-400">{t("profile.noCvs")}</p>
          ) : (
            <ul className="divide-y divide-navy-100">
              {cvs.map((cv) => (
                <li key={cv.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="flex items-center gap-2 truncate text-navy-800">
                    <FileText className="h-4 w-4 shrink-0 text-navy-300" />
                    <span className="truncate">{cv.title || "My CV"}</span>
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={applyingId === cv.id}
                    onClick={() => applyToCv(cv)}
                  >
                    {applyingId === cv.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      t("profile.apply")
                    )}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
