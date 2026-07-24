import { Suspense } from "react";

import { AuthCard } from "../auth-card";
import { InlineNav } from "../inline-nav";
import { QueryNotice } from "../query-notice";
import { LoginForm } from "./login-form";

// /auth/confirm redirects here with an `?error=` value when an emailed link's
// token is invalid or expired.
const ERRORS: Record<string, string> = {
  confirm: "That email link is invalid or has expired.",
};

export default function LoginPage() {
  return (
    <AuthCard
      title="Log in"
      description="Welcome back to NextFM."
      before={
        <Suspense>
          <QueryNotice errors={ERRORS} />
        </Suspense>
      }
      contentClassName="grid gap-4"
      footer={
        <div className="grid gap-1">
          <p className="text-sm text-muted-foreground">
            No account? <InlineNav href="/signup">Sign up</InlineNav>
          </p>
          <p className="text-sm text-muted-foreground">
            Forgot your password?{" "}
            <InlineNav href="/login/forgot-password">Reset it</InlineNav>
          </p>
        </div>
      }
    >
      <LoginForm />
    </AuthCard>
  );
}
