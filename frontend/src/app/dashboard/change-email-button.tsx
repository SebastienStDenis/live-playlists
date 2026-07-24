"use client";

import { useState } from "react";
import { toast } from "sonner";

import { changeEmail } from "./actions";
import { SettingsEditDialog } from "./settings-edit-dialog";
import { useDialogAction } from "./use-dialog-action";
import { EmailField } from "../email-field";
import { SubmitRow } from "../form-submit-row";
import { EMAIL_SHAPE } from "@/lib/validation";

export function ChangeEmailButton() {
  return (
    <SettingsEditDialog title="Change email">
      {(onDone) => <ChangeEmailForm onDone={onDone} />}
    </SettingsEditDialog>
  );
}

function ChangeEmailForm({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState("");
  const { error, pending, onSubmit } = useDialogAction(changeEmail, () => {
    // On success close the dialog; the change needs confirming from both
    // inboxes, so the toast spells that out.
    onDone();
    toast.success("Confirmation links sent.", {
      description: "Confirm from both your current and new address to finish.",
    });
  });

  return (
    <form noValidate className="grid gap-4" onSubmit={onSubmit}>
      <EmailField
        id="new-email"
        label="New email"
        value={email}
        onChange={setEmail}
      />
      <SubmitRow
        error={error}
        disabled={pending || !EMAIL_SHAPE.test(email)}
        pending={pending}
      >
        Send confirmation links
      </SubmitRow>
    </form>
  );
}
