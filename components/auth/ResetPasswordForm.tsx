"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: searchParams.get("email") ?? "",
    otp: "",
    newPassword: "",
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to reset password");
      toast.success(data.message);
      router.replace("/login");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to reset password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <Input
        type="email"
        placeholder="Email address"
        required
        value={form.email}
        onChange={(event) => setForm((state) => ({ ...state, email: event.target.value }))}
      />
      <Input
        placeholder="6-digit OTP"
        required
        value={form.otp}
        onChange={(event) => setForm((state) => ({ ...state, otp: event.target.value }))}
      />
      <Input
        type="password"
        placeholder="New password"
        required
        value={form.newPassword}
        onChange={(event) => setForm((state) => ({ ...state, newPassword: event.target.value }))}
      />
      <Button className="w-full justify-center" disabled={loading} type="submit">
        Reset password
      </Button>
    </form>
  );
}
