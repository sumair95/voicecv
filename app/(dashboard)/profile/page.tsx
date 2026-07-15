"use client";

/**
 * Profile tab — reusable personal details + a profile photo.
 *
 * Details are seeded from the user's first CV and editable here. The photo is
 * uploaded or captured (mobile camera), stored in the `avatars` bucket, and the
 * user chooses whether their CV uses the ORIGINAL or a paid "professional"
 * (AI-enhanced) version. The professional conversion is a Premium placeholder
 * for now — the AI provider gets wired in Phase 2.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, Upload, Trash2, Sparkles, Loader2 } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCurrency } from "@/lib/pricing";
import { FORMAL_PHOTO_USD_CENTS } from "@/lib/pricing";

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

export default function ProfilePage() {
  const { t } = useLanguage();
  const { price } = useCurrency();
  const supabase = useMemo(() => createClient(), []);
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [formalUrl, setFormalUrl] = useState<string | null>(null);
  const [choice, setChoice] = useState<"original" | "formal">("original");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [converting, setConverting] = useState(false);

  const uploadRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select(
          "full_name, email, phone, city, country, nationality, photo_url, photo_formal_url, photo_choice",
        )
        .eq("id", user.id)
        .single();
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

  async function onFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type || "image/jpeg" });
      if (upErr) {
        toast.error(t("photo.uploadError"));
        return;
      }
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = pub.publicUrl;
      // New upload replaces the original and invalidates the old professional
      // version (it was made from the previous photo).
      await supabase
        .from("profiles")
        .update({ photo_url: url, photo_formal_url: null, photo_choice: "original" })
        .eq("id", user.id);
      setPhotoUrl(url);
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

  // Paid AI "professional" conversion (background removal + white bg + crop).
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
            {/* `capture` opens the camera directly on mobile. */}
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="user"
              hidden
              onChange={(e) => onFile(e.target.files?.[0])}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => uploadRef.current?.click()}
            >
              <Upload className="me-2 h-4 w-4" />
              {t("photo.upload")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => cameraRef.current?.click()}
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
            {/* Keep original vs. use professional */}
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

            {/* Paid AI conversion (placeholder) */}
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
    </div>
  );
}
