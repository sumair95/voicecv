"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/components/LanguageProvider";

// L1: 3 minutes was far too aggressive for this audience — a user reading their
// finished CV on a phone, or part-way through recording a spoken answer without
// touching the screen, got silently signed out. That was fixed with a 60-second
// warning and a timer that pauses while the recorder is active.
//
// Given both of those, the duration itself no longer has to carry the whole
// job, so it's back down to 5 minutes: this audience often works on shared or
// public devices (internet cafés, borrowed phones), where a long-lived signed-in
// session is the bigger risk. The two mechanisms above are what keep 5 minutes
// from cutting anyone off mid-flow — don't remove them without raising this.
const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const WARN_BEFORE_MS = 60 * 1000; // warn 60s before logout

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  "mousemove",
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
  "click",
];

// Custom event the recorder dispatches to pause/resume the idle timer while a
// recording is in progress (no pointer/keyboard activity happens then).
const REFRESH_EVENT = "voicecv:inactivity-refresh";

let paused = false;

/**
 * Pause or resume the inactivity timer — call `setInactivityPaused(true)` when a
 * voice recording starts and `false` when it stops, so a user speaking for a few
 * minutes is never logged out mid-answer.
 */
export function setInactivityPaused(value: boolean) {
  paused = value;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(REFRESH_EVENT));
  }
}

export function useInactivityLogout() {
  const router = useRouter();
  const { t } = useLanguage();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedRef = useRef(false);

  // Read through a ref so the effect doesn't tear down and restart (resetting
  // the idle countdown) every time `t` changes identity on a language switch.
  const tRef = useRef(t);
  tRef.current = t;

  useEffect(() => {
    function clearTimers() {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (warnRef.current) clearTimeout(warnRef.current);
    }

    async function logout() {
      if (firedRef.current) return;
      firedRef.current = true;
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch {
        // ignore — push to /login regardless
      }
      toast.error(tRef.current("auth.idle.signedOut"));
      router.push("/login");
      router.refresh();
    }

    function resetTimer() {
      if (firedRef.current) return;
      clearTimers();
      // While recording, don't count idle time toward a logout.
      if (paused) return;
      warnRef.current = setTimeout(() => {
        if (!firedRef.current) {
          toast(tRef.current("auth.idle.warning"), {
            duration: WARN_BEFORE_MS,
          });
        }
      }, TIMEOUT_MS - WARN_BEFORE_MS);
      timerRef.current = setTimeout(logout, TIMEOUT_MS);
    }

    ACTIVITY_EVENTS.forEach((evt) =>
      window.addEventListener(evt, resetTimer, { passive: true }),
    );
    window.addEventListener(REFRESH_EVENT, resetTimer);
    resetTimer();

    return () => {
      clearTimers();
      ACTIVITY_EVENTS.forEach((evt) =>
        window.removeEventListener(evt, resetTimer),
      );
      window.removeEventListener(REFRESH_EVENT, resetTimer);
    };
  }, [router]);
}
