"use server";

import { redirect, RedirectType } from "next/navigation";

import type { ActionState } from "@/lib/action-state";
import { authErrorMessage } from "@/lib/auth-errors";
import { createClient } from "@/lib/supabase/server";

export async function logIn(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = formData.get("email");
  const password = formData.get("password");
  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email ||
    !password
  ) {
    return { error: "Enter your email and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return {
      error: authErrorMessage(error, "Failed to log in.", {
        invalid_credentials: "Incorrect email or password.",
        email_not_confirmed:
          "Confirm your email first. Check your inbox for the link.",
        user_banned: "This account has been suspended.",
      }),
    };
  }
  // Server Action redirects default to push; replace so Back from the
  // dashboard doesn't land on /login, which the proxy bounces forward again.
  redirect("/dashboard", RedirectType.replace);
}
