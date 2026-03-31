import { Suspense } from "react";
import { VerifyEmailCard } from "@/components/auth/VerifyEmailCard";
import { AuthShell } from "@/components/layout/AuthShell";

export default function VerifyEmailPage() {
  return (
    <AuthShell title="Check your inbox" description="Verify your email to unlock ChatSphere.">
      <Suspense fallback={<p className="text-sm text-[var(--muted)]">Loading verification…</p>}>
        <VerifyEmailCard />
      </Suspense>
    </AuthShell>
  );
}
