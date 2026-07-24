"use server";

import { redirect, RedirectType } from "next/navigation";

import type { ActionState } from "@/lib/action-state";
import { authErrorMessage } from "@/lib/auth-errors";
import { createClient } from "@/lib/supabase/server";

export async function resetPassword(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const password = formData.get("password");
  if (typeof password !== "string" || !password) {
    return { error: "Enter a new password." };
  }

  // The recovery link already signed the user in (via /auth/confirm), so
  // this is a plain password update on the current session.
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: authErrorMessage(error, "Failed to reset your password.") };
  }
  redirect("/dashboard?notice=password-reset", RedirectType.replace);
}
