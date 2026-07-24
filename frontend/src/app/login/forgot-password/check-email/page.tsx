import { AuthCard } from "@/components/auth-card";
import { InlineNav } from "@/components/inline-nav";

export default function CheckEmailPage() {
  return (
    <AuthCard
      title="Check your email"
      footer={
        <p className="text-sm text-muted-foreground">
          Remembered it? <InlineNav href="/login">Log in</InlineNav>
        </p>
      }
    >
      <p className="text-sm text-muted-foreground">
        You have been sent a password reset link. Open it to set a new password.
      </p>
    </AuthCard>
  );
}
