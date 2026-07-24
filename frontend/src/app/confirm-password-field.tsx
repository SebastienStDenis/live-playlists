import { Collapse } from "./collapse";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ConfirmPasswordField({
  value,
  onChange,
  onBlur,
  mismatch,
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  mismatch: boolean;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor="confirm-password">Confirm new password</Label>
      <div>
        <Input
          id="confirm-password"
          type="password"
          required
          autoComplete="new-password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
        />
        <Collapse show={mismatch}>
          <p className="pt-2 text-xs text-destructive">
            Passwords do not match.
          </p>
        </Collapse>
      </div>
    </div>
  );
}
