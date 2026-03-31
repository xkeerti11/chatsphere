import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { AuthShell } from "@/components/layout/AuthShell";

export default function ResetPasswordPage() {
  return (
    <AuthShell title="Reset password" description="Enter the OTP from your email and choose a new password.">
      <Suspense fallback={<p className="text-sm text-[var(--muted)]">Loading reset form…</p>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
