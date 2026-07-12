import Link from "next/link";
import { type ReactNode } from "react";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Inline reference to another page inside prose. Internal navigation renders
// as a small button; underlined links are reserved for external targets.
// The pill is one leading-5 line tall so it sits flush inside the small
// prose it appears in (intro text, empty-state messages).
export function InlineNav({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  const content = (
    <>
      {children}
      <ArrowRight aria-hidden="true" />
    </>
  );

  return (
    <Button
      asChild
      variant="outline"
      size="xs"
      className={cn("h-5 px-1.5 align-middle", className)}
    >
      {href.startsWith("#") ? (
        // Hash targets (the settings dialog) need a native anchor: Link's
        // client-side navigation doesn't fire the hashchange event the
        // dialog listens for.
        <a href={href}>{content}</a>
      ) : (
        <Link href={href}>{content}</Link>
      )}
    </Button>
  );
}
