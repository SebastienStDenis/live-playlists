import { Spinner } from "@/components/ui/spinner";

// A spinner filling the size-7 footprint of the icon-sm button it stands in
// for, so the row doesn't shift when the two swap.
export function SpinnerSlot() {
  return (
    <span className="flex size-7 items-center justify-center text-muted-foreground">
      <Spinner />
    </span>
  );
}
