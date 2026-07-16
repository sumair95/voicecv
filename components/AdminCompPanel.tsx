"use client";

/**
 * Comp-access control panel. A master switch plus the reviewer email allowlist.
 * Effective free access = switch ON *and* email on the list. Everything is
 * server-enforced via /api/admin/comp; this is just the UI.
 */

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Trash2, Plus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CompEmail {
  email: string;
  note: string | null;
  created_at: string;
}

export function AdminCompPanel() {
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [emails, setEmails] = useState<CompEmail[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newNote, setNewNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/comp");
    if (!res.ok) {
      toast.error("Couldn't load comp settings");
      setLoading(false);
      return;
    }
    const json = (await res.json()) as { comp_enabled: boolean; emails: CompEmail[] };
    setEnabled(json.comp_enabled);
    setEmails(json.emails ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function post(body: Record<string, unknown>) {
    const res = await fetch("/api/admin/comp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) throw new Error(json.error || "Request failed");
    return json;
  }

  async function toggle() {
    const next = !enabled;
    setBusy(true);
    setEnabled(next); // optimistic
    try {
      await post({ action: "toggle", enabled: next });
      toast.success(next ? "Comp access ON" : "Comp access OFF");
    } catch (e) {
      setEnabled(!next); // revert
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function add() {
    const email = newEmail.trim().toLowerCase();
    if (!email.includes("@")) {
      toast.error("Enter a valid email");
      return;
    }
    setBusy(true);
    try {
      await post({ action: "add", email, note: newNote });
      setNewEmail("");
      setNewNote("");
      await load();
      toast.success(`${email} added`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove(email: string) {
    setBusy(true);
    try {
      await post({ action: "remove", email });
      setEmails((list) => list.filter((e) => e.email !== email));
      toast.success(`${email} removed`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="grid place-items-center rounded-xl border border-navy-100 bg-white p-10">
        <Loader2 className="h-5 w-5 animate-spin text-navy-300" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Master switch */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-navy-100 bg-white p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 font-semibold text-navy-900">
            <ShieldCheck className={`h-5 w-5 ${enabled ? "text-teal" : "text-navy-300"}`} />
            Comp access {enabled ? "ON" : "OFF"}
          </div>
          <p className="mt-0.5 text-sm text-navy-400">
            {enabled
              ? "Listed emails below get all premium features free."
              : "Everyone is charged normally, even emails on the list."}
          </p>
        </div>
        <button
          role="switch"
          aria-checked={enabled}
          disabled={busy}
          onClick={toggle}
          className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-60 ${
            enabled ? "bg-teal" : "bg-navy-200"
          }`}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
              enabled ? "left-6" : "left-1"
            }`}
          />
        </button>
      </div>

      {/* Allowlist */}
      <div className="space-y-4 rounded-xl border border-navy-100 bg-white p-6 shadow-sm">
        <div>
          <h2 className="font-semibold text-navy-900">Reviewer allowlist</h2>
          <p className="mt-0.5 text-sm text-navy-400">
            Add the email a reviewer signs in with. Remove it to charge them again.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[12rem] flex-1 space-y-1">
            <label className="text-xs text-navy-500">Email</label>
            <Input
              type="email"
              placeholder="reviewer@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
            />
          </div>
          <div className="min-w-[8rem] flex-1 space-y-1">
            <label className="text-xs text-navy-500">Note (optional)</label>
            <Input
              placeholder="e.g. Italy partner"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
            />
          </div>
          <Button onClick={add} disabled={busy} className="bg-teal hover:bg-teal-600">
            <Plus className="me-1 h-4 w-4" /> Add
          </Button>
        </div>

        {emails.length === 0 ? (
          <p className="text-sm text-navy-400">No comp emails yet.</p>
        ) : (
          <ul className="divide-y divide-navy-100">
            {emails.map((e) => (
              <li key={e.email} className="flex items-center justify-between gap-3 py-2.5">
                <span className="min-w-0">
                  <span className="block truncate text-navy-800">{e.email}</span>
                  {e.note && <span className="block truncate text-xs text-navy-400">{e.note}</span>}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  onClick={() => remove(e.email)}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
