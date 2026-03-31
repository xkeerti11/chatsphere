import { LoginForm } from "@/components/auth/LoginForm";
import { AuthShell } from "@/components/layout/AuthShell";

export default function LoginPage() {
  return (
    <AuthShell title="Welcome back" description="Login to continue your conversations.">
      <LoginForm />
    </AuthShell>
  );
}
