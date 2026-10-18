"use client";

import { useCallback, useEffect, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";

// App-wide count of in-flight navigations started through
// usePendingNavigation, read by <NavigationProgress /> to show a top bar.
// Most pages await auth()/the API before rendering, so without this a
// router.push to one of them just looks frozen.
let pendingCount = 0;
const listeners = new Set<() => void>();

function setPending(delta: number) {
  pendingCount = Math.max(0, pendingCount + delta);
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useIsNavigating(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => pendingCount > 0,
    () => false
  );
}

// router.push/replace wrapped in a transition: `isNavigating` stays true
// until the destination has rendered (its server data included), so a
// button can keep its spinner across the whole wait instead of re-enabling
// the moment its API call succeeds.
export function usePendingNavigation() {
  const router = useRouter();
  const [isNavigating, startTransition] = useTransition();

  useEffect(() => {
    if (!isNavigating) return;
    setPending(1);
    return () => setPending(-1);
  }, [isNavigating]);

  const push = useCallback(
    (href: string) => startTransition(() => router.push(href)),
    [router]
  );
  const replace = useCallback(
    (href: string, options?: { scroll?: boolean }) =>
      startTransition(() => router.replace(href, options)),
    [router]
  );

  return { push, replace, isNavigating };
}
