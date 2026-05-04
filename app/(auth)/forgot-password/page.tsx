"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type Step = "email" | "otp" | "password";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSendOTP() {
    if (!email) {
      toast.error("Enter your email", { id: "e-err" });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (data.success) {
        toast.success("OTP sent to your email!", { id: "otp-sent" });
        setStep("otp");
      } else if (data.needsVerification) {
        toast.error("Verify your email first before resetting password", {
          id: "verify-first",
          duration: 5000,
        });
        router.push(`/verify-email?email=${encodeURIComponent(data.email ?? email)}`);
      } else {
        toast.error(data.error || "Failed", { id: "err" });
      }
    } catch {
      toast.error("Network error", { id: "net-err" });
    } finally {
      setLoading(false);
    }
  }

  function handleVerifyOTP() {
    if (otp.length !== 6) {
      toast.error("Enter 6-digit OTP", { id: "otp-err" });
      return;
    }

    setStep("password");
  }

  async function handleResetPassword() {
    if (newPassword.length < 8) {
      toast.error("Password must be 8+ characters", { id: "pwd-err" });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match", { id: "match-err" });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await response.json();

      if (data.success) {
        toast.success("Password reset! Please login.", { id: "success" });
        router.push("/login");
      } else {
        toast.error(data.error || "Failed", { id: "err" });
      }
    } catch {
      toast.error("Network error", { id: "net-err" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm">
        <div className="mb-8 flex items-center gap-2">
          {(["email", "otp", "password"] as Step[]).map((value, index) => (
            <div key={value} className="flex flex-1 items-center gap-2">
              <div
                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                  step === value ||
                  (value === "email" && step !== "email") ||
                  (value === "otp" && step === "password")
                    ? "bg-purple-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {index + 1}
              </div>
              {index < 2 ? <div className="h-0.5 flex-1 bg-gray-200" /> : null}
            </div>
          ))}
        </div>

        {step === "email" ? (
          <div>
            <h2 className="mb-2 text-2xl font-bold">Forgot password?</h2>
            <p className="mb-6 text-sm text-gray-500">Enter your registered email address</p>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="your@email.com"
              className="mb-4 w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleSendOTP}
              disabled={loading}
              className="w-full rounded-xl bg-purple-600 py-3 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
              type="button"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
            <p className="mt-4 text-center text-sm">
              <button
                onClick={() => router.push("/login")}
                className="text-purple-600 hover:underline"
                type="button"
              >
                Back to login
              </button>
            </p>
          </div>
        ) : null}

        {step === "otp" ? (
          <div>
            <h2 className="mb-2 text-2xl font-bold">Enter OTP</h2>
            <p className="mb-6 text-sm text-gray-500">6-digit code sent to {email}</p>
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="mb-4 w-full rounded-xl border px-4 py-3 text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleVerifyOTP}
              disabled={loading || otp.length !== 6}
              className="w-full rounded-xl bg-purple-600 py-3 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
              type="button"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </div>
        ) : null}

        {step === "password" ? (
          <div>
            <h2 className="mb-2 text-2xl font-bold">New password</h2>
            <p className="mb-6 text-sm text-gray-500">Enter your new password</p>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="New password (8+ chars)"
              className="mb-3 w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirm new password"
              className="mb-4 w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleResetPassword}
              disabled={loading}
              className="w-full rounded-xl bg-purple-600 py-3 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
              type="button"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
