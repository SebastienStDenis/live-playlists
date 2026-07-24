"use client";

import { useActionState, useState } from "react";

import { ConfirmPasswordField } from "@/components/confirm-password-field";
import { SubmitRow } from "@/components/form-submit-row";
import { PasswordRequirementHint } from "@/components/password-hint";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPassword } from "./actions";

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  // Punish late, revalidate eagerly: the requirement mark and mismatch hint
  // wait for their field's first blur with content, then track every edit
  // until resolved. Blurring an empty field makes no claim, so it leaves the
  // grace period intact instead of spending it while passing through.
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmationTouched, setConfirmationTouched] = useState(false);
  const [state, formAction, pending] = useActionState(resetPassword, {
    error: null,
  });

  const passwordMet = password.length >= 6;
  const passwordUnmet = passwordTouched && password !== "" && !passwordMet;
  const mismatch =
    confirmationTouched && confirmation !== "" && confirmation !== password;
  const valid = passwordMet && confirmation === password;

  return (
    <form action={formAction} noValidate className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => {
            if (password !== "") setPasswordTouched(true);
          }}
        />
        <PasswordRequirementHint met={passwordMet} unmet={passwordUnmet} />
      </div>
      <ConfirmPasswordField
        value={confirmation}
        onChange={setConfirmation}
        onBlur={() => {
          if (confirmation !== "") setConfirmationTouched(true);
        }}
        mismatch={mismatch}
      />
      <SubmitRow
        error={state.error}
        disabled={pending || !valid}
        pending={pending}
        buttonClassName="w-full"
      >
        Set new password
      </SubmitRow>
    </form>
  );
}
