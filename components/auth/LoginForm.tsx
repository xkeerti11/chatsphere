"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { loginSchema } from "@/lib/validations";
import { useAuthStore } from "@/stores/useAuthStore";

export function LoginForm() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to login");
      }

      if (data.success && data.token) {
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

  return (
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
  );
}
