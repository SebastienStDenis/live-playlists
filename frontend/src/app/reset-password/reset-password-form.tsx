"use client";

import { useActionState, useState } from "react";
import { Check } from "lucide-react";

import { ConfirmPasswordField } from "../confirm-password-field";
import { SubmitRow } from "../form-submit-row";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { resetPassword } from "./actions";

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  // Punish late, revalidate eagerly: the mismatch hint waits for the
  // confirm field's first blur, then tracks every edit until resolved.
  // An empty field shows nothing - it makes no mismatch claim yet.
  const [confirmationTouched, setConfirmationTouched] = useState(false);
  const [state, formAction, pending] = useActionState(resetPassword, {
    error: null,
  });

  const mismatch =
    confirmationTouched && confirmation !== "" && confirmation !== password;
  const valid = password.length >= 6 && confirmation === password;

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
        />
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          At least 6 characters.
          <Check
            aria-hidden
            className={cn(
              "size-3 text-success transition-opacity duration-300",
              password.length >= 6 ? "opacity-100" : "opacity-0",
            )}
            strokeWidth={2.5}
          />
        </p>
      </div>
      <ConfirmPasswordField
        value={confirmation}
        onChange={setConfirmation}
        onBlur={() => setConfirmationTouched(true)}
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
