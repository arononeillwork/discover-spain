"use client";

import { useMemo, useSyncExternalStore } from "react";

// Signed-out checklist progress lives in localStorage as a JSON array of guide_steps ids.
// (Signed-in progress lives in the user_progress table; see components/ProgressProvider.tsx.)
// The key changed from "discover-spain:progress" when steps moved from array indexes to ids.
const KEY = "discover-spain:progress:v2";
const EMPTY = "[]";
const listeners = new Set<() => void>();

function parse(raw: string | null): number[] {
  try {
    const value: unknown = JSON.parse(raw ?? EMPTY);
    return Array.isArray(value) ? value.filter((v): v is number => Number.isSafeInteger(v)) : [];
  } catch {
    return [];
  }
}

function snapshot() {
  try {
    return localStorage.getItem(KEY) ?? EMPTY;
  } catch {
    return EMPTY;
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

function write(ids: Iterable<number>) {
  try {
    const list = [...new Set(ids)];
    if (list.length) localStorage.setItem(KEY, JSON.stringify(list));
    else localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable: progress just won't persist */
  }
  listeners.forEach((l) => l());
}

/** Completed step ids saved in this browser. */
export function useLocalProgress(): ReadonlySet<number> {
  const raw = useSyncExternalStore(subscribe, snapshot, () => EMPTY);
  return useMemo(() => new Set(parse(raw)), [raw]);
}

export function readLocalProgress(): number[] {
  return parse(snapshot());
}

export function setLocalStep(stepId: number, done: boolean) {
  const ids = new Set(readLocalProgress());
  if (done) ids.add(stepId);
  else ids.delete(stepId);
  write(ids);
}

/** Forget the given ids (or everything), e.g. after merging them into the signed-in account. */
export function clearLocalProgress(stepIds?: Iterable<number>) {
  if (!stepIds) return write([]);
  const remove = new Set(stepIds);
  write(readLocalProgress().filter((id) => !remove.has(id)));
}
