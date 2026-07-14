"use client";

/**
 * Profile tab — reusable personal details, seeded from the user's first CV and
 * editable here. Saved to the profiles row; used to pre-fill the personal
 * fields of a CV via the "Use my profile details" button on the CV page.
 */

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/components/LanguageProvider";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const supabase = useMemo(() => createClient(), []);
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
        .select("full_name, email, phone, city, country, nationality")
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

  const rows: [keyof Fields, string][] = [
    ["full_name", t("profile.fullName")],
    ["email", t("profile.email")],
    ["phone", t("profile.phone")],
    ["city", t("profile.city")],
    ["country", t("profile.country")],
    ["nationality", t("profile.nationality")],
  ];

  const isEmpty = Object.values(fields).every((v) => !v);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-navy-900">
          {t("profile.title")}
        </h1>
        <p className="mt-1 text-navy-400">{t("profile.subtitle")}</p>
      </div>

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
