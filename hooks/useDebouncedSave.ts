"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Schedule a save callback after `delayMs` of inactivity.
 * Each call to the returned `schedule(payload)` resets the timer.
 *
 * - Holds the latest payload in a ref so the timer fires with whatever
 *   was *most recently* scheduled, not whatever was first captured —
 *   fixes the stale closure where `handleChange` saved an old title
 *   because the setTimeout body captured `cv?.title` at scheduling time.
 *
 * - Flushes pending work on unmount so navigating away during a typing
 *   burst doesn't drop the edit.
 *
 * Usage:
 *   const schedule = useDebouncedSave<CVData>(async (data) => {
 *     await supabase.from("cvs").update({ cv_data: data, ... });
 *   });
 *   // on every edit:
 *   schedule(updated);
 */
export function useDebouncedSave<T>(
  save: (payload: T) => void | Promise<void>,
  delayMs = 1000,
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<T | null>(null);
  const saveRef = useRef(save);

  // Always run the *latest* save function — supports closure-free callers.
  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (pendingRef.current !== null) {
      const payload = pendingRef.current;
      pendingRef.current = null;
      void Promise.resolve(saveRef.current(payload)).catch(() => {});
    }
  }, []);

  const schedule = useCallback(
    (payload: T) => {
      pendingRef.current = payload;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(flush, delayMs);
    },
    [delayMs, flush],
  );

  // Flush on unmount.
  useEffect(() => {
    return () => {
      flush();
    };
  }, [flush]);

  return schedule;
}
