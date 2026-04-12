"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthShell } from "@/components/layout/AuthShell";

function ExpiredMessage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("expired") === "true") {
      toast.error("Session expired. Please login again.");
    }
  }, [searchParams]);

  return null;
}

export default function LoginPage() {
  return (
    <>
      <Suspense fallback={null}>
        <ExpiredMessage />
      </Suspense>

      <AuthShell title="Welcome back" description="Login to continue your conversations.">
        <LoginForm />
      </AuthShell>
    </>
  );
}
