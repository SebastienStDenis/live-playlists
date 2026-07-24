import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

// The responsive card grid every list panel lays its results in.
export const CARD_GRID_CLASS =
  "grid grid-cols-[minmax(0,26rem)] gap-3 sm:grid-cols-[repeat(2,minmax(0,26rem))] lg:grid-cols-3";

// Standard container for missing-data messages (see docs/wording.md): a
// dashed placeholder box where the list content will eventually appear.
export function EmptyState({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <p
      className={cn(
        "rounded-lg border border-dashed px-6 py-10 text-center text-xs leading-5 text-muted-foreground",
        className,
      )}
    >
      {children}
    </p>
  );
}

// One grid slot's worth of empty state: the ghost box sized like the result
// cards it stands in for, laid out in the same grid the results would use.
export function EmptyStateCell({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn(CARD_GRID_CLASS, className)}>
      {/* content-center, not flex: a flex container would split the message
          around inline elements (the Account pill) and swallow the spaces
          between them. */}
      <EmptyState className="content-center">{children}</EmptyState>
    </div>
  );
}

// Filtered-out items keep a slot in the grid: a ghost cell sized like the
// cards it stands in for.
export function HiddenByFiltersCell({
  count,
  noun,
}: {
  count: number;
  noun: string;
}) {
  return (
    <li className="flex">
      <EmptyState className="flex-1 content-center">
        {count} {count === 1 ? noun : noun + "s"} hidden by filters.
      </EmptyState>
    </li>
  );
}
