"use client";

import { useActionState, useState } from "react";

import { EmailField } from "@/components/email-field";
import { SubmitRow } from "@/components/form-submit-row";
import { PasswordRequirementHint } from "@/components/password-hint";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EMAIL_SHAPE } from "@/lib/validation";
import { signUp } from "./actions";

export function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Punish late, revalidate eagerly: the requirement mark waits for the
  // field's first blur with content, then tracks every edit until resolved.
  // Blurring an empty password makes no claim, so it leaves the grace period
  // intact.
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [state, formAction, pending] = useActionState(signUp, { error: null });

  const emailValid = EMAIL_SHAPE.test(email);
  const passwordMet = password.length >= 6;
  const passwordUnmet = passwordTouched && password !== "" && !passwordMet;
  const valid = name.trim() !== "" && emailValid && passwordMet;

  return (
    <form action={formAction} noValidate className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          required
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <EmailField value={email} onChange={setEmail} />
      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
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
      <SubmitRow
        error={state.error}
        disabled={pending || !valid}
        pending={pending}
        buttonClassName="w-full"
      >
        Sign up
      </SubmitRow>
    </form>
  );
}
