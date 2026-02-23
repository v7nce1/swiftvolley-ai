"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Spinner } from "@/components/ui/Button";

export default function AuthPage() {
  const [loading, setLoading] = useState<"google" | "azure" | null>(null);
  const [error, setError]     = useState<string | null>(null);
  const supabase = createClient();

  const signIn = async (provider: "google" | "azure") => {
    setLoading(provider);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        ...(provider === "azure" && { scopes: "email profile" }),
      },
    });
    if (error) { setError(error.message); setLoading(null); }
  };

  return (
    <div className="min-h-screen bg-vt-bg flex items-center justify-center px-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-vt-mint/[0.04] blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-5 select-none">🏐</div>
          <h1 className="text-4xl font-extrabold tracking-tight">VolleyTrack</h1>
          <p className="text-vt-muted mt-3 text-sm leading-relaxed">
            Measure your spike speed.<br />Analyze your form with AI.
          </p>
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 px-4 py-3 rounded-xl bg-vt-coral/10 border border-vt-coral/20 text-vt-coral text-sm text-center"
          >
            {error}
          </motion.div>
        )}

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <AuthButton
            onClick={() => signIn("google")}
            loading={loading === "google"}
            disabled={loading !== null}
            icon={<GoogleIcon />}
            label="Continue with Google"
          />
          <AuthButton
            onClick={() => signIn("azure")}
            loading={loading === "azure"}
            disabled={loading !== null}
            icon={<MicrosoftIcon />}
            label="Continue with Microsoft"
            outlined
          />
        </div>

        <p className="text-vt-faint text-xs text-center mt-7 leading-relaxed">
          By signing in you agree to our Terms of Service.<br />
          Your data is private and encrypted.
        </p>
      </motion.div>
    </div>
  );
}

function AuthButton({
  onClick, loading, disabled, icon, label, outlined = false,
}: {
  onClick: () => void; loading: boolean; disabled: boolean;
  icon: React.ReactNode; label: string; outlined?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-3 w-full rounded-2xl px-5 h-14 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
        outlined
          ? "bg-transparent border border-vt-outline hover:border-white/25 text-white"
          : "bg-vt-surface border border-vt-outline hover:border-white/25 text-white"
      }`}
    >
      <div className="w-8 h-8 shrink-0 flex items-center justify-center">
        {loading ? <Spinner /> : icon}
      </div>
      <span className="font-semibold text-sm">{label}</span>
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20}>
      <path fill="#F25022" d="M1 1h10v10H1z"/>
      <path fill="#00A4EF" d="M13 1h10v10H13z"/>
      <path fill="#7FBA00" d="M1 13h10v10H1z"/>
      <path fill="#FFB900" d="M13 13h10v10H13z"/>
    </svg>
  );
}
