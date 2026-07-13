import type { AuthError } from "@supabase/supabase-js";

// Supabase auth errors carry a stable `code`; their human `message` can be
// blank or a raw JSON blob (auth-js falls back to JSON.stringify, which shows
// up as "{}"), so key off the code and fall back to our own copy instead of
// ever surfacing the raw message. Only codes whose wording is identical across
// every flow live here; context-specific ones (bad credentials, invalid email,
// ...) are passed as overrides by each caller.
const SHARED_COPY: Record<string, string> = {
  over_request_rate_limit: "Too many attempts. Wait a moment and try again.",
  over_email_send_rate_limit:
    "Too many emails sent. Wait a moment and try again.",
  weak_password: "Choose a stronger password (at least 6 characters).",
  same_password: "Your new password must be different from your current one.",
};

export function authErrorMessage(
  error: AuthError,
  fallback: string,
  overrides?: Record<string, string>,
): string {
  const code = error.code;
  if (code) {
    if (overrides && code in overrides) {
      return overrides[code];
    }
    if (code in SHARED_COPY) {
      return SHARED_COPY[code];
    }
  }
  return fallback;
}
