import { type ReactNode } from "react";

import { Collapse } from "./collapse";
import { FormError } from "./form-error";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function SubmitRow({
  error,
  disabled,
  pending,
  buttonClassName,
  children,
}: {
  error: string | null;
  disabled: boolean;
  pending: boolean;
  buttonClassName?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid">
      <Collapse show={error !== null}>
        <FormError className="pb-3">{error}</FormError>
      </Collapse>
      <Button type="submit" disabled={disabled} className={buttonClassName}>
        {pending && <Spinner />}
        {children}
      </Button>
    </div>
  );
}
