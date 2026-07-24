import { AuthCard } from "@/components/auth-card";

export default function EmailChangePendingPage() {
  return (
    <AuthCard title="Almost there">
      <p className="text-sm text-muted-foreground">
        The email change needs confirming from both addresses. Open the link
        sent to your other inbox to finish.
      </p>
    </AuthCard>
  );
}
