"use client";

import { startTransition, useActionState, type FormEvent } from "react";

import type { ActionState } from "@/lib/action-state";

export function useDialogAction(
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>,
  onSuccess: () => void,
) {
  const [state, formAction, pending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const result = await action(prev, formData);
      if (!result.error) {
        onSuccess();
      }
      return result;
    },
    { error: null },
  );

  // Drive the action manually rather than via the form's `action` prop: on a
  // successful `<form action>` React auto-resets the form, which blanks its
  // controlled fields at the DOM level. Since the dialog stays mounted for its
  // close animation, that blanked form would flash before it dismisses.
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => formAction(formData));
  };

  return { error: state.error, pending, onSubmit };
}
