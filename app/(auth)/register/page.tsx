import { RegisterForm } from "@/components/auth/RegisterForm";
import { AuthShell } from "@/components/layout/AuthShell";

export default function RegisterPage() {
  return (
    <AuthShell title="Create account" description="Start chatting with your friends in seconds.">
      <RegisterForm />
    </AuthShell>
  );
}
