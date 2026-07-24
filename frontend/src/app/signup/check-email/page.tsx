import { AuthCard } from "../../auth-card";
import { InlineNav } from "../../inline-nav";

export default function CheckEmailPage() {
  return (
    <AuthCard
      title="Check your email"
      footer={
        <p className="text-sm text-muted-foreground">
          Already confirmed? <InlineNav href="/login">Log in</InlineNav>
        </p>
      }
    >
      <p className="text-sm text-muted-foreground">
        You have been sent a confirmation link. Click it to finish setting up
        your account.
      </p>
    </AuthCard>
  );
}
