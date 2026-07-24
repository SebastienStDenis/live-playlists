"use server";

import { redirect, RedirectType } from "next/navigation";

import type { ActionState } from "@/lib/action-state";
import { authErrorMessage } from "@/lib/auth-errors";
import { createClient } from "@/lib/supabase/server";

const EMAIL_EXISTS_ERROR = "That email is already registered. Try logging in.";

export async function signUp(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = formData.get("name");
  const email = formData.get("email");
  const password = formData.get("password");
  if (typeof name !== "string" || name.trim() === "") {
    return { error: "Enter a name." };
  }
  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email ||
    !password
  ) {
    return { error: "Enter an email and password." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: name.trim() } },
  });
  if (error) {
    return {
      error: authErrorMessage(error, "Failed to create your account.", {
        email_exists: EMAIL_EXISTS_ERROR,
        validation_failed: "Enter a valid email address.",
        email_address_invalid: "Enter a valid email address.",
        signup_disabled: "New sign-ups are currently disabled.",
      }),
    };
  }
  // With email confirmation on, Supabase does not error on a duplicate email
  // (to prevent enumeration); it returns a fake user with no identities. Surface
  // it as a duplicate rather than sending the user to the check-email page.
  if (data.user && data.user.identities?.length === 0) {
    return { error: EMAIL_EXISTS_ERROR };
  }
  // With email confirmation on, signUp returns no session until the user clicks
  // the emailed link; send them to a holding page instead of the dashboard
  // (the proxy would bounce an unauthenticated /dashboard visit to /login).
  redirect(
    data.session ? "/dashboard" : "/signup/check-email",
    RedirectType.replace,
  );
}
