"use client";
import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "secondary", size = "md", loading, className, children, disabled, ...props }, ref) => {
    const base = "inline-flex items-center justify-center font-semibold rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
    const variants = {
      primary:   "bg-vt-mint text-black hover:bg-vt-mint/90",
      secondary: "bg-vt-surface border border-vt-outline text-white hover:border-white/20",
      ghost:     "text-vt-muted hover:text-white hover:bg-white/5",
      danger:    "bg-vt-coral/10 border border-vt-coral/30 text-vt-coral hover:bg-vt-coral/20",
    };
    const sizes = {
      sm: "px-4 h-9 text-sm",
      md: "px-5 h-12 text-sm",
      lg: "px-6 h-14 text-base",
    };
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading ? <span className="flex items-center gap-2"><Spinner />{children}</span> : children}
      </button>
    );
  }
);
Button.displayName = "Button";

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn("animate-spin h-4 w-4", className)} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}