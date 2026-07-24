"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Route-level boundary: a failed dashboard load renders inside the root
// layout instead of falling through to the bare global-error document.
export default function DashboardError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  // The boundary catches the error before any global handler sees it, so
  // this capture is the only thing that tells Sentry.
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center p-8">
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-muted-foreground">
            Something went wrong loading your dashboard.
          </p>
          <Button onClick={() => unstable_retry()}>Try again</Button>
        </CardContent>
      </Card>
    </main>
  );
}
