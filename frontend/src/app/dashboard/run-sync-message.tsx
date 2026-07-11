import { InlineNav } from "../inline-nav";
import { EmptyState } from "./empty-state";

// Standard empty state for a tab whose sync step has not completed yet; see
// docs/wording.md. The accent dot marks the nudge as actionable, so it only
// shows while sync is enabled.
export function RunSyncMessage({
  action,
  syncEnabled,
}: {
  action: string;
  syncEnabled: boolean;
}) {
  return (
    <EmptyState>
      {syncEnabled && (
        <span
          className="mr-1 inline-block size-1.5 -translate-y-px rounded-full bg-primary align-middle"
          aria-hidden
        />
      )}
      Run a sync in{" "}
      <InlineNav href="/dashboard/account">Account</InlineNav> to {action}.
    </EmptyState>
  );
}
