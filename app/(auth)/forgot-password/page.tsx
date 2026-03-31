import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { AuthShell } from "@/components/layout/AuthShell";

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Forgot password" description="We will send you a one-time reset code.">
      <ForgotPasswordForm />
    </AuthShell>
  );
}
