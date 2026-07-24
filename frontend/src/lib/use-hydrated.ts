"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

// False on the server and for the hydration render, true ever after.
export function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
