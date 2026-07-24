"use client";

import { useState } from "react";

import { Collapse } from "./collapse";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EMAIL_SHAPE } from "@/lib/validation";

export function EmailField({
  id = "email",
  label = "Email",
  value,
  onChange,
}: {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  // Punish late, revalidate eagerly: the format hint waits for the field's
  // first blur, then tracks every edit until resolved.
  const [touched, setTouched] = useState(false);

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div>
        <Input
          id={id}
          name="email"
          type="email"
          required
          autoComplete="email"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => {
            if (value !== "") setTouched(true);
          }}
        />
        <Collapse show={touched && value !== "" && !EMAIL_SHAPE.test(value)}>
          <p className="pt-2 text-xs text-destructive">
            Enter a valid email address.
          </p>
        </Collapse>
      </div>
    </div>
  );
}
