"use client";

import { useActionState, useState } from "react";

import { EmailField } from "../email-field";
import { SubmitRow } from "../form-submit-row";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EMAIL_SHAPE } from "@/lib/validation";
import { logIn } from "./actions";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, formAction, pending] = useActionState(logIn, { error: null });

  const emailValid = EMAIL_SHAPE.test(email);

  return (
    <form action={formAction} noValidate className="grid gap-4">
      <EmailField value={email} onChange={setEmail} />
      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <SubmitRow
        error={state.error}
        disabled={pending || !emailValid || password === ""}
        pending={pending}
        buttonClassName="w-full"
      >
        Log in
      </SubmitRow>
    </form>
  );
}
