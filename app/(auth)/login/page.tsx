"use client";

import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { Suspense, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { AuthShell } from "@/components/layout/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { loginSchema } from "@/lib/validations";
import { useAuthStore } from "@/stores/useAuthStore";

function ExpiredMessage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("expired") === "true") {
      toast.error("Session expired. Please login again.");
    }
  }, [searchParams]);

  return null;
}

function LoginPageForm() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const resendIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [showResend, setShowResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    return () => {
      if (resendIntervalRef.current) {
        clearInterval(resendIntervalRef.current);
      }
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = loginSchema.safeParse(form);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const toastId =
        issue?.path[0] === "email"
          ? "login-email-error"
          : issue?.path[0] === "password"
            ? "login-password-error"
            : "login-validation-error";

      toast.error(issue?.message ?? "Unable to login", { id: toastId });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await response.json();

      if (!data.success) {
        if (data.needsVerification) {
          setUnverifiedEmail(data.email ?? parsed.data.email);
          setShowResend(true);
          toast.error("Email not verified. Please verify your account.", {
            id: "verify-err",
            duration: 5000,
          });
          return;
        }

        toast.error(data.error || "Login failed", {
          id: "login-err",
        });
        return;
      }

      if (response.ok && data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setAuth(data.user, data.token);
        toast.success("Welcome back");
        router.push("/");
        return;
      }

      throw new Error(data.error ?? "Login failed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to login", {
        id: "login-error",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleResendVerification() {
    if (!unverifiedEmail) return;

    setResendLoading(true);

    try {
      const response = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: unverifiedEmail }),
      });
      const data = await response.json();

      if (data.success) {
        toast.success("Verification email sent! Check your inbox.", {
          id: "resend-success",
        });
        setResendTimer(60);

        if (resendIntervalRef.current) {
          clearInterval(resendIntervalRef.current);
        }

        resendIntervalRef.current = setInterval(() => {
          setResendTimer((prev) => {
            if (prev <= 1) {
              if (resendIntervalRef.current) {
                clearInterval(resendIntervalRef.current);
                resendIntervalRef.current = null;
              }
              return 0;
            }

            return prev - 1;
          });
        }, 1000);

        router.push(`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`);
      } else {
        toast.error(data.error || "Failed to send email", {
          id: "resend-err",
        });
      }
    } catch {
      toast.error("Network error", { id: "net-err" });
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          type="email"
          placeholder="Email address"
          value={form.email}
          onChange={(event) => setForm((state) => ({ ...state, email: event.target.value }))}
          required
        />
        <PasswordInput
          placeholder="Password"
          value={form.password}
          onChange={(event) => setForm((state) => ({ ...state, password: event.target.value }))}
          required
        />

        <div className="flex items-center justify-between text-sm text-[var(--muted)]">
          <Link href="/forgot-password" className="text-[var(--brand)]">
            Forgot password?
          </Link>
          <Link href="/register" className="text-[var(--brand)]">
            Create account
          </Link>
        </div>

        <Button className="w-full justify-center" disabled={loading} type="submit">
          {loading ? <LoaderCircle className="animate-spin" size={18} /> : null}
          Login
        </Button>
      </form>

      {showResend ? (
        <div className="mt-4 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-center">
          <p className="mb-3 text-sm text-yellow-800">
            Your email <strong>{unverifiedEmail}</strong> is not verified yet.
          </p>

          {resendTimer > 0 ? (
            <p className="text-sm text-gray-400">Resend available in {resendTimer}s</p>
          ) : (
            <button
              onClick={handleResendVerification}
              disabled={resendLoading}
              className="w-full rounded-xl bg-yellow-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-yellow-600 disabled:opacity-50"
              type="button"
            >
              {resendLoading ? "Sending..." : "Resend Verification Email"}
            </button>
          )}
        </div>
      ) : null}
    </>
  );
}

export default function LoginPage() {
  return (
    <>
      <Suspense fallback={null}>
        <ExpiredMessage />
      </Suspense>

      <AuthShell title="Welcome back" description="Login to continue your conversations.">
        <LoginPageForm />
      </AuthShell>
    </>
  );
}
