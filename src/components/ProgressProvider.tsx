"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { SessionUser } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { clearLocalProgress, readLocalProgress, setLocalStep, useLocalProgress } from "@/lib/progress";

type ProgressContextValue = {
  /** The signed-in user, or null when signed out. */
  user: SessionUser | null;
  /** Completed step ids from the active source. */
  done: ReadonlySet<number>;
  setStepDone: (stepId: number, done: boolean) => void;
  /** "account" = user_progress table, "browser" = localStorage. */
  source: "account" | "browser";
  error: string | null;
  dismissError: () => void;
};

const ProgressContext = createContext<ProgressContextValue | null>(null);

type Remote = { userId: string | null; done: ReadonlySet<number>; loaded: boolean };

const SAVE_ERROR = "We couldn't save that to your account. Check your connection and try again.";
const SYNC_ERROR = "We couldn't sync your progress with your account. It's kept in this browser for now.";

/**
 * Pushes any progress ticked while signed out into user_progress, clears it locally once saved,
 * and returns the account's full progress.
 */
async function syncAccountProgress(): Promise<{ done?: Set<number>; error?: string }> {
  const supabase = createClient();
  const pending = readLocalProgress();

  if (pending.length) {
    const options = { onConflict: "user_id,step_id", ignoreDuplicates: true, defaultToNull: false } as const;
    let { error } = await supabase.from("user_progress").upsert(
      pending.map((step_id) => ({ step_id })),
      options,
    );
    if (error?.code === "23503") {
      // A ticked step no longer exists (FK violation). Save the others one at a time.
      error = null;
      for (const step_id of pending) {
        const result = await supabase.from("user_progress").upsert({ step_id }, options);
        if (result.error && result.error.code !== "23503") error = result.error;
      }
    }
    if (error) {
      console.error("[progress] merge failed", error);
      return { error: SYNC_ERROR };
    }
    clearLocalProgress(pending);
  }

  const { data, error } = await supabase.from("user_progress").select("step_id");
  if (error) {
    console.error("[progress] load failed", error);
    return { error: SYNC_ERROR };
  }
  return { done: new Set(data.map((r) => r.step_id)) };
}

export function ProgressProvider({
  user,
  initialDone,
  children,
}: {
  user: SessionUser | null;
  /** Server-loaded account progress; null if it couldn't be loaded (the client then fetches it). */
  initialDone: number[] | null;
  children: ReactNode;
}) {
  const userId = user?.id ?? null;
  const local = useLocalProgress();
  const [remote, setRemote] = useState<Remote>(() => ({
    userId,
    done: new Set(initialDone ?? []),
    loaded: initialDone !== null,
  }));
  const [error, setError] = useState<string | null>(null);

  // Signed in or out since the last render (the layout re-rendered): start from the new snapshot.
  if (remote.userId !== userId) {
    setRemote({ userId, done: new Set(initialDone ?? []), loaded: initialDone !== null });
  }

  // Signed in: merge anything ticked while signed out, and load progress if the server couldn't.
  const hasLocal = local.size > 0;
  const needsLoad = userId !== null && !remote.loaded;
  const syncing = useRef(false);
  useEffect(() => {
    if (!userId || syncing.current || (!hasLocal && !needsLoad)) return;
    syncing.current = true;
    syncAccountProgress().then((result) => {
      syncing.current = false;
      if (result.error) setError(result.error);
      if (result.done) {
        const done = result.done;
        setRemote((prev) => (prev.userId === userId ? { userId, done, loaded: true } : prev));
      }
    });
  }, [userId, hasLocal, needsLoad]);

  // Writes are chained so a quick tick/untick reaches the database in order.
  const queue = useRef<Promise<unknown>>(Promise.resolve());

  const setStepDone = useCallback(
    (stepId: number, isDone: boolean) => {
      if (!userId) {
        setLocalStep(stepId, isDone);
        return;
      }

      const apply = (value: boolean) =>
        setRemote((prev) => {
          if (prev.userId !== userId) return prev;
          const next = new Set(prev.done);
          if (value) next.add(stepId);
          else next.delete(stepId);
          return { ...prev, done: next };
        });

      apply(isDone); // optimistic
      if (!isDone) setLocalStep(stepId, false); // in case it was a not-yet-merged local tick
      setError(null);

      queue.current = queue.current.then(async () => {
        const supabase = createClient();
        const { error: writeError } = isDone
          ? await supabase
              .from("user_progress")
              .upsert({ step_id: stepId }, { onConflict: "user_id,step_id", ignoreDuplicates: true })
          : await supabase.from("user_progress").delete().eq("user_id", userId).eq("step_id", stepId);
        if (writeError) {
          console.error("[progress] save failed", writeError);
          apply(!isDone); // roll back
          setError(SAVE_ERROR);
        }
      });
    },
    [userId],
  );

  const dismissError = useCallback(() => setError(null), []);

  const done = useMemo<ReadonlySet<number>>(() => {
    if (!userId) return local;
    // While a merge is in flight, show local ticks too so nothing flickers.
    return local.size ? new Set([...remote.done, ...local]) : remote.done;
  }, [userId, local, remote.done]);

  const value = useMemo<ProgressContextValue>(
    () => ({ user, done, setStepDone, source: userId ? "account" : "browser", error, dismissError }),
    [user, userId, done, setStepDone, error, dismissError],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const value = useContext(ProgressContext);
  if (!value) throw new Error("useProgress must be used inside <ProgressProvider>");
  return value;
}
