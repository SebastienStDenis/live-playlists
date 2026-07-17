import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HomeLink } from "../home-link";
import { InlineNav } from "../inline-nav";
import { RedirectNotice } from "../redirect-notice";
import { LoginForm } from "./login-form";

// /auth/confirm redirects here with an `?error=` value when an emailed link's
// token is invalid or expired and no user is signed in.
const ERRORS: Record<string, string> = {
  confirm: "That email link is invalid or has expired.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center p-8">
      {typeof error === "string" && ERRORS[error] && (
        <RedirectNotice param="error" variant="error" className="mb-6">
          {ERRORS[error]}
        </RedirectNotice>
      )}
      <HomeLink href="/" />
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-xl">
            <h1>Log in</h1>
          </CardTitle>
          <CardDescription>Welcome back to NextFM.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <LoginForm />
        </CardContent>
        <CardFooter>
          <div className="grid gap-1">
            <p className="text-sm text-muted-foreground">
              No account? <InlineNav href="/signup">Sign up</InlineNav>
            </p>
            <p className="text-sm text-muted-foreground">
              Forgot your password?{" "}
              <InlineNav href="/login/forgot-password">Reset it</InlineNav>
            </p>
          </div>
        </CardFooter>
      </Card>
    </main>
  );
}
