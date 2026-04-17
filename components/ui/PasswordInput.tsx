"use client";

import type { InputHTMLAttributes } from "react";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

type PasswordInputProps = InputHTMLAttributes<HTMLInputElement>;

export function PasswordInput({
  className,
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <input
        className={cn(
          "min-h-[44px] w-full rounded-2xl border border-[var(--border)] bg-white px-3 py-2.5 pr-12 text-sm outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--brand)] focus:ring-4 focus:ring-indigo-100 sm:px-4 sm:pr-12 sm:text-base",
          className,
        )}
        type={showPassword ? "text" : "password"}
        {...props}
      />
      <button
        type="button"
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-[var(--muted)] transition hover:text-[var(--foreground)] focus:outline-none"
        aria-label={showPassword ? "Hide password" : "Show password"}
        aria-pressed={showPassword}
        onClick={() => setShowPassword((value) => !value)}
      >
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
