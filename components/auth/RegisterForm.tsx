"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

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

    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
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
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to create account");
      }
      toast.success(data.message);
      router.replace(`/verify-email?email=${encodeURIComponent(form.email)}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create account");
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
      <Input
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={(event) => setForm((state) => ({ ...state, password: event.target.value }))}
        required
      />
      <Input
        type="password"
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
