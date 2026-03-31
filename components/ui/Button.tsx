"use client";

import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
};

export function Button({ className, variant = "primary", ...props }: Props) {
  return (
    <button
      className={cn(
        "inline-flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 sm:text-base",
        variant === "primary" && "gradient-brand text-white shadow-lg shadow-indigo-200",
        variant === "secondary" && "bg-[var(--brand-soft)] text-[var(--brand)]",
        variant === "danger" && "bg-[var(--danger)] text-white",
        variant === "ghost" && "bg-transparent text-[var(--foreground)] hover:bg-white",
        className,
      )}
      {...props}
    />
  );
}
