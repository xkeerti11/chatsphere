"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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

      if (!response.ok || !data.success) {
        toast.error(data.error ?? data.message ?? "Unable to create account", {
          id: "register-error",
        });
        return;
      }

      toast.success(data.message, { id: "register-success" });
      router.replace(`/verify-email?email=${encodeURIComponent(form.email)}`);
    } catch {
      toast.error("Network error. Try again.", { id: "register-network-error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
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
  );
}
