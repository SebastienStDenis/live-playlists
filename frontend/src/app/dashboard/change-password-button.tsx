"use client";

import { useState } from "react";
import { toast } from "sonner";

import { changePassword } from "@/lib/actions";
import { SettingsEditDialog } from "./settings-edit-dialog";
import { useDialogAction } from "./use-dialog-action";
import { ConfirmPasswordField } from "@/components/confirm-password-field";
import { SubmitRow } from "@/components/form-submit-row";
import { PasswordRequirementHint } from "@/components/password-hint";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ChangePasswordButton() {
  return (
    <SettingsEditDialog title="Change password">
      {(onDone) => <ChangePasswordForm onDone={onDone} />}
    </SettingsEditDialog>
  );
}

function ChangePasswordForm({ onDone }: { onDone: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  // Punish late, revalidate eagerly: the requirement mark and mismatch hint
  // wait for their field's first blur with content, then track every edit
  // until resolved. Blurring an empty field makes no claim, so it leaves the
  // grace period intact instead of spending it while passing through.
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmationTouched, setConfirmationTouched] = useState(false);
  const { error, pending, onSubmit } = useDialogAction(changePassword, () => {
    // On success close the dialog and confirm with a toast.
    onDone();
    toast.success("Password changed.");
  });

  const passwordMet = password.length >= 6;
  const passwordUnmet = passwordTouched && password !== "" && !passwordMet;
  const mismatch =
    confirmationTouched && confirmation !== "" && confirmation !== password;
  const valid =
    currentPassword !== "" && passwordMet && confirmation === password;

  return (
    <form noValidate className="grid gap-4" onSubmit={onSubmit}>
      <div className="grid gap-2">
        <Label htmlFor="current-password">Current password</Label>
        <Input
          id="current-password"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="new-password">New password</Label>
        <Input
          id="new-password"
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
      <SubmitRow error={error} disabled={pending || !valid} pending={pending}>
        Change password
      </SubmitRow>
    </form>
  );
}
