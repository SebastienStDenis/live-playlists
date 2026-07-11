import { useEffect, useState } from "react";

import type { ActionState } from "./actions";

// Must match the animate-fade-in-out duration: the animation ends at
// opacity 0 and this timeout unmounts the message.
export const ERROR_DISMISS_MS = 4000;
// Must match animate-fade-in-out-slow, for longer, instructional messages.
export const SLOW_ERROR_DISMISS_MS = 8000;

// The action's error, shown for one fade-in-out window per failed attempt.
// Dismissal is tracked by state-object identity, so a retry that fails with
// the same message still restarts the animation.
export function useTransientError(
  state: ActionState,
  dismissMs: number = ERROR_DISMISS_MS,
): string | null {
  const [dismissed, setDismissed] = useState<ActionState | null>(null);

  useEffect(() => {
    if (!state.error) {
      return;
    }
    const timer = setTimeout(() => setDismissed(state), dismissMs);
    return () => clearTimeout(timer);
  }, [state, dismissMs]);

  return state.error && dismissed !== state ? state.error : null;
}
