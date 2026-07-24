import { AuthCard } from "../auth-card";
import { InlineNav } from "../inline-nav";
import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <AuthCard
      title="Sign up"
      description="Create your NextFM account."
      footer={
        <p className="text-sm text-muted-foreground">
          Already have an account? <InlineNav href="/login">Log in</InlineNav>
        </p>
      }
    >
      <SignupForm />
    </AuthCard>
  );
}
