"use client";

import { Fragment, useState, type ReactNode } from "react";
import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function SettingsEditDialog({
  title,
  children,
}: {
  title: string;
  children: (onDone: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  // Bumped on each open so the form remounts fresh: field state and the
  // useActionState error (which has no reset) don't linger from a prior open.
  const [session, setSession] = useState(0);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) setSession((n) => n + 1);
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={title}
          title={title}
          className="text-muted-foreground"
        >
          <Pencil aria-hidden />
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined} className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Fragment key={session}>{children(() => setOpen(false))}</Fragment>
      </DialogContent>
    </Dialog>
  );
}
