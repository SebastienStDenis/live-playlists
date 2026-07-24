"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { changeName } from "@/lib/actions";
import { SettingsEditDialog } from "./settings-edit-dialog";
import { useDialogAction } from "./use-dialog-action";
import { SubmitRow } from "@/components/form-submit-row";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ChangeNameButton({ currentName }: { currentName: string }) {
  return (
    <SettingsEditDialog title="Change name">
      {(onDone) => <ChangeNameForm currentName={currentName} onDone={onDone} />}
    </SettingsEditDialog>
  );
}

function ChangeNameForm({
  currentName,
  onDone,
}: {
  currentName: string;
  onDone: () => void;
}) {
  const [name, setName] = useState(currentName);
  // The name at the moment of a successful save. changeName revalidates the
  // tree that feeds `currentName`; that refresh rides the action's transition,
  // which React cancels if this form unmounts first. Closing on success (as
  // this used to) tore the form down mid-transition, so the refresh landed only
  // about half the time - and with it the name display and the re-run-sync
  // warning. Keep the dialog mounted until `currentName` reflects the save
  // (below), then close.
  const [savedFrom, setSavedFrom] = useState<string | null>(null);
  const { error, pending, onSubmit } = useDialogAction(changeName, () => {
    setSavedFrom(currentName);
    toast.success("Name updated.");
  });

  useEffect(() => {
    if (savedFrom !== null && currentName !== savedFrom) {
      onDone();
    }
  }, [savedFrom, currentName, onDone]);

  const trimmed = name.trim();
  const unchanged = trimmed === currentName;
  const saving = pending || savedFrom !== null;

  return (
    <form noValidate className="grid gap-4" onSubmit={onSubmit}>
      <div className="grid gap-2">
        <Label htmlFor="new-name">Name</Label>
        <Input
          id="new-name"
          name="name"
          type="text"
          required
          maxLength={50}
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <SubmitRow
        error={error}
        disabled={saving || trimmed === "" || unchanged}
        pending={saving}
      >
        Save
      </SubmitRow>
    </form>
  );
}
