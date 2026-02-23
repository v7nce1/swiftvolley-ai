"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Spinner } from "@/components/ui/Button";

export default function AuthPage() {
  const [loading, setLoading] = useState<"google" | "azure" | "guest" | null>(null);
  const [error, setError]     = useState<string | null>(null);
  const supabase = createClient();
  const router   = useRouter();

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
    // Set a cookie so proxy.ts lets them through protected routes
    document.cookie = "vt-guest=true; path=/; max-age=86400; SameSite=Lax";
    router.push("/home");
  };

  return (
    <div className="min-h-screen bg-vt-bg flex overflow-hidden">

      {/* ── Left branding panel (desktop only) ── */}
      <div className="hidden lg:flex flex-col justify-between w-[55%] p-14 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full bg-vt-blue/10 blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-vt-orange/10 blur-[100px] translate-x-1/4 translate-y-1/4 pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <span className="text-3xl">🏐</span>
          <span className="font-display font-bold text-2xl tracking-[0.15em] text-vt-blue uppercase">VolleyTrack</span>
        </div>

        <div className="relative z-10 space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-blue text-vt-blue text-xs font-semibold uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-vt-blue animate-pulse" />
            AI-Powered Analysis
          </div>
          <h1 className="font-display font-black text-[72px] leading-[0.9] uppercase tracking-tight">
            <span className="text-vt-text">Track</span><br/>
            <span className="text-gradient">Every</span><br/>
            <span className="text-vt-text">Spike.</span>
          </h1>
          <p className="text-vt-muted text-lg max-w-xs leading-relaxed">
            Upload a clip. Get instant speed in km/h, trajectory data, and AI form scoring.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { val: "YOLOv8", label: "AI Model" },
            { val: "±2%",    label: "Accuracy"  },
            { val: "60fps",  label: "Analysis"  },
          ].map(({ val, label }) => (
            <div key={label} className="glass rounded-2xl px-4 py-3">
              <p className="font-display font-bold text-2xl text-vt-blue">{val}</p>
              <p className="text-vt-faint text-xs uppercase tracking-wider mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right auth panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative border-l border-vt-outline/50">
        <div className="absolute inset-0 bg-vt-surface/40 pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-[360px] relative z-10"
        >
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <p className="text-5xl mb-3">🏐</p>
            <h1 className="font-display font-black text-5xl uppercase text-gradient">VolleyTrack</h1>
            <p className="text-vt-muted text-sm mt-1">AI-powered spike analyzer</p>
          </div>

          <h2 className="font-display font-bold text-4xl uppercase text-vt-text mb-1">Sign In</h2>
          <p className="text-vt-muted text-sm mb-8">Sign in or continue as a guest to test</p>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="mb-4 px-4 py-3 rounded-xl bg-vt-red/10 border border-vt-red/30 text-vt-red text-sm">
              {error}
            </motion.div>
          )}

          <div className="space-y-3">
            <SignInButton onClick={() => signIn("google")} loading={loading === "google"}
              disabled={loading !== null} icon={<GoogleIcon />} label="Continue with Google" accent="blue" />

            <SignInButton onClick={() => signIn("azure")} loading={loading === "azure"}
              disabled={loading !== null} icon={<MicrosoftIcon />} label="Continue with Microsoft" accent="orange" />

            {/* Divider */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-vt-outline" />
              <span className="text-vt-faint text-xs uppercase tracking-widest">or</span>
              <div className="flex-1 h-px bg-vt-outline" />
            </div>

            {/* Guest */}
            <button onClick={continueAsGuest} disabled={loading !== null}
              className="group flex items-center justify-center gap-3 w-full rounded-2xl px-5 h-14 border border-dashed border-vt-outline hover:border-vt-blue/30 hover:bg-vt-blue/[0.04] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading === "guest"
                ? <Spinner className="text-vt-muted" />
                : <span className="text-xl select-none">🏐</span>}
              <span className="font-semibold text-sm text-vt-muted group-hover:text-vt-text transition-colors">
                Continue as Guest
              </span>
            </button>
          </div>

          <p className="text-vt-faint text-xs text-center mt-6 leading-relaxed">
            Guest sessions are not saved between visits.<br />
            Sign in to track your progress over time.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function SignInButton({ onClick, loading, disabled, icon, label, accent }: {
  onClick: () => void; loading: boolean; disabled: boolean;
  icon: React.ReactNode; label: string; accent: "blue" | "orange";
}) {
  const hover    = accent === "blue"
    ? "hover:border-vt-blue/40 hover:bg-vt-blue/5 hover:shadow-blue-glow"
    : "hover:border-vt-orange/40 hover:bg-vt-orange/5 hover:shadow-orange-glow";
  const textHover = accent === "blue" ? "group-hover:text-vt-blue" : "group-hover:text-vt-orange";
  return (
    <button onClick={onClick} disabled={disabled}
      className={`group flex items-center gap-4 w-full glass rounded-2xl px-5 h-14 transition-all duration-300 ${hover} disabled:opacity-50 disabled:cursor-not-allowed`}>
      <div className="w-8 flex-shrink-0 flex items-center justify-center">
        {loading ? <Spinner className="text-vt-blue" /> : icon}
      </div>
      <span className={`font-semibold text-sm text-vt-text transition-colors ${textHover}`}>{label}</span>
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6">
      <path fill="#F25022" d="M1 1h10v10H1z"/>
      <path fill="#00A4EF" d="M13 1h10v10H13z"/>
      <path fill="#7FBA00" d="M1 13h10v10H1z"/>
      <path fill="#FFB900" d="M13 13h10v10H13z"/>
    </svg>
  );
}
