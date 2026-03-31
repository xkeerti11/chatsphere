"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";

export function VerifyEmailCard() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const [verifying, setVerifying] = useState(Boolean(token));
  const [verified, setVerified] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!token) return;

    let active = true;

    void (async () => {
      try {
        const response = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Verification failed");
        if (active) {
          setVerified(true);
          toast.success(data.message);
        }
      } catch (error) {
        if (active) {
          toast.error(error instanceof Error ? error.message : "Verification failed");
        }
      } finally {
        if (active) setVerifying(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [token]);

  async function resend() {
    if (!email) return;
    setSending(true);
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to resend email");
      toast.success(data.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to resend email");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[1.5rem] bg-[var(--brand-soft)] p-5 text-sm text-[var(--brand)]">
        {verified
          ? "Your email is verified. You can now login."
          : verifying
            ? "Verifying your account..."
            : "Check your inbox and open the verification link we sent."}
      </div>
      {email ? (
        <Button variant="secondary" className="w-full justify-center" disabled={sending} onClick={resend}>
          Resend verification email
        </Button>
      ) : null}
      <Link className="block text-sm font-medium text-[var(--brand)]" href="/login">
        Back to login
      </Link>
    </div>
  );
}
