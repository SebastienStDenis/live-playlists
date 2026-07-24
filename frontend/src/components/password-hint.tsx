import { Check, X } from "lucide-react";

import { cn } from "@/lib/utils";

export function PasswordRequirementHint({
  met,
  unmet,
}: {
  met: boolean;
  unmet: boolean;
}) {
  return (
    <p className="flex items-center gap-1 text-xs text-muted-foreground">
      At least 6 characters.
      {/* Check and X share one fixed slot and trade opacity, so
          the state swap crossfades without nudging the text. */}
      <span className="relative flex size-3 shrink-0">
        <Check
          aria-hidden
          className={cn(
            "absolute inset-0 size-3 text-success transition-opacity duration-300",
            met ? "opacity-100" : "opacity-0",
          )}
          strokeWidth={2.5}
        />
        <X
          aria-hidden
          className={cn(
            "absolute inset-0 size-3 text-destructive transition-opacity duration-300",
            unmet ? "opacity-100" : "opacity-0",
          )}
          strokeWidth={2.5}
        />
      </span>
    </p>
  );
}
