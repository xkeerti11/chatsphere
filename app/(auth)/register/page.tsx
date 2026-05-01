"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { AuthShell } from "@/components/layout/AuthShell";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"register" | "verify">("register");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.username || form.username.trim().length < 3) {
      toast.error("Username must be 3+ characters", { id: "register-username-error" });
      return;
    }

    if (!form.email || !form.email.includes("@")) {
      toast.error("Enter valid email", { id: "register-email-error" });
      return;
    }

    if (!form.password || form.password.length < 8) {
      toast.error("Password must be 8+ characters", { id: "register-password-error" });
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match", { id: "register-confirm-password-error" });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          password: form.password,
        }),
      });
      const data = await response.json();

      if (data.success) {
        setRegisteredEmail(form.email);
        setStep("verify");
        toast.success("OTP sent to your email!", { id: "otp-sent" });
        return;
      }

      toast.error(data.error ?? data.message ?? "Unable to create account", {
        id: "register-error",
      });
    } catch {
      toast.error("Network error. Try again.", { id: "register-network-error" });
    } finally {
      setLoading(false);
    }
  }

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) return;

    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: registeredEmail,
          otp,
        }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Email verified! Please login.", { id: "verified" });
        router.push("/login");
      } else {
        toast.error(data.error || "Invalid OTP", { id: "otp-err" });
      }
    } catch {
      toast.error("Network error", { id: "net-err" });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);

    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registeredEmail }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success("New OTP sent!", { id: "resent" });
        setResendTimer(60);

        const interval = setInterval(() => {
          setResendTimer((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }

            return prev - 1;
          });
        }, 1000);
      } else {
        toast.error(data.error || "Failed to resend", { id: "resend-err" });
      }
    } catch {
      toast.error("Network error", { id: "net-err" });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <AuthShell
      title={step === "register" ? "Create account" : "Verify your email"}
      description={
        step === "register"
          ? "Start chatting with your friends in seconds."
          : `Enter the 6-digit code sent to ${registeredEmail}.`
      }
    >
      {step === "register" ? (
        <form className="space-y-4" onSubmit={handleRegister}>
          <Input
            placeholder="Username"
            value={form.username}
            onChange={(event) => setForm((state) => ({ ...state, username: event.target.value }))}
            required
          />
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
          <PasswordInput
            placeholder="Confirm password"
            value={form.confirmPassword}
            onChange={(event) =>
              setForm((state) => ({ ...state, confirmPassword: event.target.value }))
            }
            required
          />

          <p className="text-sm text-[var(--muted)]">
            Already registered?{" "}
            <Link href="/login" className="text-[var(--brand)]">
              Login here
            </Link>
          </p>

          <Button className="w-full justify-center" disabled={loading} type="submit">
            {loading ? <LoaderCircle className="animate-spin" size={18} /> : null}
            Sign up
          </Button>
        </form>
      ) : (
        <div className="space-y-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-[var(--foreground)]">
              Verify your email
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Enter the 6-digit code sent to {registeredEmail}
            </p>
          </div>

          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="w-full rounded-xl border border-[var(--border)] px-4 py-3 text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-purple-500"
          />

          <Button
            className="w-full justify-center"
            onClick={handleVerifyOTP}
            disabled={loading || otp.length !== 6}
            type="button"
          >
            {loading ? <LoaderCircle className="animate-spin" size={18} /> : null}
            Verify Email
          </Button>

          <div className="mt-4 text-center">
            {resendTimer > 0 ? (
              <p className="text-sm text-gray-400">Resend in {resendTimer}s</p>
            ) : (
              <button
                onClick={handleResendOTP}
                disabled={resendLoading}
                className="text-sm text-purple-600 hover:underline disabled:opacity-60"
                type="button"
              >
                {resendLoading ? "Sending..." : "Resend OTP"}
              </button>
            )}
          </div>
        </div>
      )}
    </AuthShell>
  );
}
