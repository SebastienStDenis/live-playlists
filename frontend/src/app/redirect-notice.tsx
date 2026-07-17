"use client";

import { Check, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Alert, AlertAction, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

// Auth redirects carry their outcome as a URL param (`?notice=` success,
// `?error=` failure) that the landing page reads server-side and renders
// through this component. The message is an inline notice in the server HTML
// rather than a toast: sonner can't paint anything until the client hydrates,
// and on a slow mobile load a heavy page hydrates late enough that an
// auto-dismissing toast fires and vanishes unseen (#258). The notice is
// visible from first paint and stays until dismissed; hydration only adds the
// dismiss handler and strips the param so a refresh or Back doesn't replay
// it. history.replaceState syncs the router without the server re-render a
// router.replace would trigger, which would unmount the notice.
export function RedirectNotice({
  param,
  variant,
  className,
  children,
}: {
  param: "notice" | "error";
  variant: "success" | "error";
  className?: string;
  children: React.ReactNode;
}) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has(param)) {
      url.searchParams.delete(param);
      window.history.replaceState(null, "", url);
    }
  }, [param]);

  if (dismissed) {
    return null;
  }
  return (
    <Alert
      variant={variant === "error" ? "destructive" : "success"}
      className={className}
    >
      {variant === "error" ? (
        <X strokeWidth={2.5} />
      ) : (
        <Check strokeWidth={2.5} />
      )}
      <AlertTitle>{children}</AlertTitle>
      <AlertAction>
        <Button variant="ghost" size="sm" onClick={() => setDismissed(true)}>
          Dismiss
        </Button>
      </AlertAction>
    </Alert>
  );
}
