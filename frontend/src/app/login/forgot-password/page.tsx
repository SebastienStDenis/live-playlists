import { AuthCard } from "../../auth-card";
import { InlineNav } from "../../inline-nav";
import { ForgotPasswordForm } from "./forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Reset your password"
      description="A reset link will be sent to your email."
      footer={
        <p className="text-sm text-muted-foreground">
          Remembered it? <InlineNav href="/login">Log in</InlineNav>
        </p>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
