"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Spinner } from "@/components/ui/Button";

export default function AuthPage() {
  const [loading, setLoading] = useState<"google" | "azure" | "guest" | null>(null);
  const [error, setError]     = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

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

  const continueAsGuest = () => {
    setLoading("guest");
    localStorage.setItem("guest_mode", "true");
    router.push("/home");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-vt-bg via-vt-bg to-vt-mint/5 flex items-center justify-center px-6 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-vt-mint/[0.03] rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-vt-coral/[0.03] rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-7xl mb-6 select-none inline-block"
          >
            🏐
          </motion.div>
          <h1 className="text-5xl font-black tracking-tight mb-2 bg-gradient-to-r from-vt-mint to-vt-mint/70 bg-clip-text text-transparent">
            VolleyTrack
          </h1>
          <p className="text-vt-muted mt-3 text-lg leading-relaxed">
            AI-powered spike analysis · Measure speed · Perfect your form
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center hover:border-vt-mint/30 transition-colors"
          >
            <div className="text-2xl mb-2">⚡</div>
            <p className="text-xs text-vt-muted font-medium">Speed Tracking</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center hover:border-vt-mint/30 transition-colors"
          >
            <div className="text-2xl mb-2">🎯</div>
            <p className="text-xs text-vt-muted font-medium">Form Analysis</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center hover:border-vt-mint/30 transition-colors"
          >
            <div className="text-2xl mb-2">📊</div>
            <p className="text-xs text-vt-muted font-medium">Progress Tracking</p>
          </motion.div>
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 px-4 py-3 rounded-xl bg-vt-coral/10 border border-vt-coral/20 text-vt-coral text-sm text-center"
          >
            {error}
          </motion.div>
        )}

        {/* Auth Buttons */}
        <div className="flex flex-col gap-3 mb-4">
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

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <span className="text-xs text-vt-muted/60 px-2">OR</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        {/* Guest Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={continueAsGuest}
          disabled={loading !== null}
          className="w-full rounded-2xl px-5 h-14 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-white/5 border border-white/10 hover:border-white/20 text-white font-semibold text-sm flex items-center justify-center gap-2"
        >
          {loading === "guest" ? <Spinner /> : "🚀 Continue as Guest"}
        </motion.button>

        {/* Footer */}
        <p className="text-vt-faint text-xs text-center mt-8 leading-relaxed">
          By signing in you agree to our Terms of Service.<br />
          <span className="text-vt-muted/50">Your data is private and encrypted.</span>
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
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-3 w-full rounded-2xl px-5 h-14 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm ${
        outlined
          ? "bg-white/5 border border-white/10 hover:border-white/20 text-white"
          : "bg-gradient-to-r from-vt-mint/20 to-vt-mint/10 border border-vt-mint/30 hover:border-vt-mint/50 text-white"
      }`}
    >
      <div className="w-5 h-5 shrink-0 flex items-center justify-center">
        {loading ? <Spinner /> : icon}
      </div>
      <span>{label}</span>
    </motion.button>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="none">
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
