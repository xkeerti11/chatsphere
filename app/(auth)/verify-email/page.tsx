"use client";

import { Suspense, useEffect, useState } from "react";
import { CheckCircle, Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromUrl = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailFromUrl);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (emailFromUrl) {
      setEmail(emailFromUrl);
    }
  }, [emailFromUrl]);

  useEffect(() => {
    if (resendTimer <= 0) return;

    const timeout = window.setTimeout(() => {
      setResendTimer((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => window.clearTimeout(timeout);
  }, [resendTimer]);

  async function handleVerify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email) {
      toast.error("Email required", { id: "e-err" });
      return;
    }

    if (otp.length !== 6) {
      toast.error("Enter 6-digit OTP", { id: "otp-err" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();

      if (data.success) {
        setVerified(true);
        toast.success("Email verified! You can now login.", { id: "verified" });
        window.setTimeout(() => router.push("/login"), 2000);
      } else {
        toast.error(data.error || "Invalid OTP", { id: "otp-err" });
      }
    } catch {
      toast.error("Network error", { id: "net-err" });
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!email) {
      toast.error("Email required", { id: "e-err" });
      return;
    }

    setResendLoading(true);
    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success("New OTP sent! Check your inbox.", { id: "resent" });
        setResendTimer(60);
      } else {
        toast.error(data.error || "Failed to resend", { id: "resend-err" });
      }
    } catch {
      toast.error("Network error", { id: "net-err" });
    } finally {
      setResendLoading(false);
    }
  }

  if (verified) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-sm rounded-2xl border bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
            <CheckCircle className="h-8 w-8" aria-hidden="true" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-gray-900">Email Verified!</h2>
          <p className="text-sm text-gray-500">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <form
        onSubmit={handleVerify}
        className="w-full max-w-sm rounded-2xl border bg-white p-8 shadow-sm"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-purple-600">
            <Mail className="h-8 w-8" aria-hidden="true" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900">Verify your email</h2>
          <p className="text-sm text-gray-500">Enter the 6-digit code sent to your email</p>
        </div>

        {!emailFromUrl ? (
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="your@email.com"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        ) : (
          <div className="mb-4 rounded-xl bg-purple-50 p-3 text-center">
            <p className="text-sm text-purple-700">
              Code sent to: <strong>{email}</strong>
            </p>
          </div>
        )}

        <div className="mb-6">
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="otp">
            Enter OTP code
          </label>
          <input
            id="otp"
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="w-full rounded-xl border-2 border-gray-200 px-4 py-4 text-center text-3xl font-bold tracking-widest focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading || otp.length !== 6}
          className="mb-4 w-full rounded-xl bg-purple-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Verify Email"}
        </button>

        <div className="text-center">
          <p className="mb-2 text-sm text-gray-500">Did not receive the code?</p>
          {resendTimer > 0 ? (
            <p className="text-sm text-gray-400">Resend in {resendTimer}s</p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resendLoading}
              className="text-sm font-medium text-purple-600 hover:underline disabled:opacity-50"
            >
              {resendLoading ? "Sending..." : "Resend OTP"}
            </button>
          )}
        </div>

        <div className="mt-6 border-t border-gray-100 pt-6 text-center">
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            Back to login
          </button>
        </div>
      </form>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-gray-400">Loading...</p>
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
