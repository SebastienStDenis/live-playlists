"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

// Shows the toast mapped to the `?notice=` (success) or `?error=` value once,
// then strips the params so a refresh or Back doesn't replay it. Each param is
// read only when its map is provided, so pages stay blind to the other one.
export function QueryNotice({
  notices,
  errors,
}: {
  notices?: Record<string, string>;
  errors?: Record<string, string>;
}) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const notice = notices ? params.get("notice") : null;
  const error = errors ? params.get("error") : null;
  const shown = useRef(false);

  useEffect(() => {
    if ((!notice && !error) || shown.current) {
      return;
    }
    shown.current = true;
    if (notice && notices?.[notice]) {
      toast.success(notices[notice]);
    }
    if (error && errors?.[error]) {
      toast.error(errors[error]);
    }
    router.replace(pathname, { scroll: false });
  }, [notice, error, notices, errors, pathname, router]);

  return null;
}
