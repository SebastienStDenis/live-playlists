"use client";

import { useActionState, useState } from "react";

import { EmailField } from "../../email-field";
import { SubmitRow } from "../../form-submit-row";
import { EMAIL_SHAPE } from "@/lib/validation";
import { requestPasswordReset } from "./actions";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [state, formAction, pending] = useActionState(requestPasswordReset, {
    error: null,
  });

  return (
    <form action={formAction} noValidate className="grid gap-4">
      <EmailField value={email} onChange={setEmail} />
      <SubmitRow
        error={state.error}
        disabled={pending || !EMAIL_SHAPE.test(email)}
        pending={pending}
        buttonClassName="w-full"
      >
        Send reset link
      </SubmitRow>
    </form>
  );
}
