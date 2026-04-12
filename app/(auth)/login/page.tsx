"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthShell } from "@/components/layout/AuthShell";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const expired = searchParams.get("expired");

  useEffect(() => {
    if (expired === "true") {
      toast.error("Session expired. Please login again.");
    }
  }, [expired]);

  return (
    <AuthShell title="Welcome back" description="Login to continue your conversations.">
      <LoginForm />
    </AuthShell>
  );
}
