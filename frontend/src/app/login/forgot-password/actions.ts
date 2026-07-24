"use server";

import { redirect, RedirectType } from "next/navigation";

import type { ActionState } from "@/lib/action-state";
import { authErrorMessage } from "@/lib/auth-errors";
import { createClient } from "@/lib/supabase/server";

export async function requestPasswordReset(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = formData.get("email");
  if (typeof email !== "string" || !email) {
    return { error: "Enter your email." };
  }

  // The emailed link routes through /auth/confirm (type=recovery), which
  // signs the user in and lands them on /reset-password.
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) {
    return {
      error: authErrorMessage(error, "Failed to send the reset email.", {
        validation_failed: "Enter a valid email address.",
        email_address_invalid: "Enter a valid email address.",
      }),
    };
  }
  redirect("/login/forgot-password/check-email", RedirectType.replace);
}
