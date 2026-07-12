"use client";

import { useSyncExternalStore } from "react";

import { SETTINGS_HASH } from "./settings-dialog";
import {
  StepMark,
  stepMarkClasses,
  syncDateFormat,
  type SyncStatus,
  type SyncStep,
} from "./sync-steps";

const emptySubscribe = () => () => {};

// Status marker for a tab fed by a sync step: the step's action, a middle
// dot and the run's finish time, marked with the latest run's outcome - a
// green check when the step succeeded, a red x when the run failed before
// the step could complete, a spinner while a run is in flight (see
// docs/wording.md). Links to Settings, where the sync card carries the
// failure detail. Formats in the viewer's timezone, which the server can't
// know - renders only after hydration so server and client HTML always
// match.
export function SyncStepNote({
  sync,
  stepKey,
  label,
}: {
  sync: SyncStatus | null;
  stepKey: string;
  label: string;
}) {
  const hydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  if (!hydrated || sync === null) {
    return null;
  }
  const step = sync.steps.find((candidate) => candidate.key === stepKey);
  const stepStatus = step?.status ?? "pending";
  // In a failed run, any step short of completed shares the run's fate: an
  // earlier step failing stops the later ones, and a failed run whose step
  // detail couldn't be fetched reports every step pending.
  const status: SyncStep["status"] =
    sync.status === "failed" && stepStatus !== "completed"
      ? "failed"
      : stepStatus;
  if (status === "pending") {
    return null;
  }
  const failed = status === "failed";
  // A step that never ran has no time of its own; the run's end is when its
  // data stopped moving.
  const finishedIso = step?.finished_at ?? sync.finished_at;
  const finishedAt = finishedIso
    ? syncDateFormat.format(new Date(finishedIso))
    : null;
  return (
    <a
      href={SETTINGS_HASH}
      title={failed ? "Last sync failed" : undefined}
      className="-mx-1.5 -my-0.5 flex animate-fade-in items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs font-normal text-muted-foreground hover:bg-muted dark:hover:bg-muted/50"
    >
      <span className={stepMarkClasses[status]}>
        <StepMark status={status} />
      </span>
      <span>
        {label}
        {finishedAt && ` · ${finishedAt}`}
      </span>
    </a>
  );
}
