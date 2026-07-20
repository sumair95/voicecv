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
  const [denied, setDenied] = useState(false);
  const [freeMode, setFreeMode] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [emails, setEmails] = useState<CompEmail[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newNote, setNewNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/comp");
    if (res.status === 401 || res.status === 403) {
      setDenied(true);
      setLoading(false);
      return;
    }
    if (!res.ok) {
      toast.error("Couldn't load comp settings");
      setLoading(false);
      return;
    }
    const json = (await res.json()) as {
      comp_enabled: boolean;
      free_mode: boolean;
      emails: CompEmail[];
    };
    setEnabled(json.comp_enabled);
    setFreeMode(json.free_mode);
    setEmails(json.emails ?? []);
    setLoading(false);
  }

  async function toggleFree() {
    const next = !freeMode;
    setBusy(true);
    setFreeMode(next); // optimistic
    try {
      await post({ action: "freemode", enabled: next });
      toast.success(next ? "Free mode ON — all premium is free for everyone" : "Free mode OFF");
    } catch (e) {
      setFreeMode(!next);
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
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
      <div className="grid place-items-center rounded-xl border border-border bg-card p-10">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (denied) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-6 text-center">
        <p className="font-semibold text-foreground">You don&apos;t have admin access</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          This account isn&apos;t on the <code className="rounded bg-card px-1 py-0.5 text-xs">ADMIN_EMAILS</code>{" "}
          list. Add your email to that variable on Railway, redeploy, then reload this page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Free / testing mode — all premium free for everyone, pricing hidden */}
      <div className="flex items-center justify-between gap-4 rounded-xl border-2 border-amber-300 bg-amber-50/60 p-6 shadow-sm dark:border-amber-800/50 dark:bg-amber-950/20">
        <div>
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <ShieldCheck className={`h-5 w-5 ${freeMode ? "text-amber-500" : "text-muted-foreground"}`} />
            Free mode — {freeMode ? "payments OFF (everything free)" : "payments LIVE"}
          </div>
          <p className="mt-0.5 max-w-md text-sm text-muted-foreground">
            {freeMode
              ? "The one switch for all payments is OFF: every premium feature — CVs, cover letters, tailoring, photos — is FREE for everyone and all pricing is hidden. Overrides the allowlist below."
              : "This is THE single payment switch. Turn it ON to make every premium feature free for any tester (no email needed) and hide all pricing. (The comp allowlist below only matters while this is OFF.)"}
          </p>
        </div>
        <button
          role="switch"
          aria-checked={freeMode}
          disabled={busy}
          onClick={toggleFree}
          className={`relative h-7 w-12 shrink-0 rounded-full ring-1 ring-inset ring-black/10 transition disabled:opacity-60 ${
            freeMode ? "bg-amber-500" : "bg-navy-300"
          }`}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-card shadow transition-all ${
              freeMode ? "left-6" : "left-1"
            }`}
          />
        </button>
      </div>

      {/* Master switch */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <ShieldCheck className={`h-5 w-5 ${enabled ? "text-teal" : "text-muted-foreground"}`} />
            Comp access {enabled ? "ON" : "OFF"}
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
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
          className={`relative h-7 w-12 shrink-0 rounded-full ring-1 ring-inset ring-black/10 transition disabled:opacity-60 ${
            enabled ? "bg-teal" : "bg-navy-300"
          }`}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-card shadow transition-all ${
              enabled ? "left-6" : "left-1"
            }`}
          />
        </button>
      </div>

      {/* Allowlist */}
      <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
        <div>
          <h2 className="font-semibold text-foreground">Reviewer allowlist</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Add the email a reviewer signs in with. Remove it to charge them again.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[12rem] flex-1 space-y-1">
            <label className="text-xs text-muted-foreground">Email</label>
            <Input
              type="email"
              placeholder="reviewer@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
            />
          </div>
          <div className="min-w-[8rem] flex-1 space-y-1">
            <label className="text-xs text-muted-foreground">Note (optional)</label>
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
          <p className="text-sm text-muted-foreground">No comp emails yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {emails.map((e) => (
              <li key={e.email} className="flex items-center justify-between gap-3 py-2.5">
                <span className="min-w-0">
                  <span className="block truncate text-foreground">{e.email}</span>
                  {e.note && <span className="block truncate text-xs text-muted-foreground">{e.note}</span>}
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
