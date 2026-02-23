"use client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Zap, Shield, ChevronRight, LogOut, TrendingUp, LogIn } from "lucide-react";
import { getConfidenceMeta, getScoreColor } from "@/types";
import { formatDateTime } from "@/lib/utils";
import Image from "next/image";

interface Props {
  user: { displayName: string; avatarUrl: string | null };
  recentSessions: {
    id: string; mode: string; recorded_at: string;
    speed_kmh: number | null; form_score: number | null;
    speed_confidence: number | null;
  }[];
  isGuest?: boolean;
}

export default function HomeClient({ user, recentSessions, isGuest }: Props) {
  const router   = useRouter();
  const supabase = createClient();
  const firstName = user.displayName.split(" ")[0];

  const bestSpeed = Math.max(...recentSessions.map((s) => s.speed_kmh ?? 0), 0);

  const signOut = async () => {
    // Clear guest cookie too
    document.cookie = "vt-guest=; path=/; max-age=0";
    if (!isGuest) await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-vt-bg pb-28">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-vt-blue/8 blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-5 pt-12 pb-6">
        <div>
          <p className="text-vt-muted text-xs font-semibold uppercase tracking-widest mb-0.5">
            {isGuest ? "Testing as" : "Welcome back"}
          </p>
          <h1 className="font-display font-bold text-3xl uppercase text-vt-text">{firstName}</h1>
        </div>
        <div className="flex items-center gap-2">
          {user.avatarUrl && (
            <Image src={user.avatarUrl} alt="avatar" width={36} height={36}
              className="rounded-full border border-vt-outline" />
          )}
          {isGuest && (
            <button onClick={() => router.push("/auth")}
              className="flex items-center gap-1.5 h-9 px-3 rounded-xl glass text-vt-blue text-xs font-semibold hover:border-vt-blue/40 transition-all">
              <LogIn size={13} />
              Sign In
            </button>
          )}
          <button onClick={signOut}
            className="w-9 h-9 rounded-xl glass flex items-center justify-center hover:border-vt-red/40 transition-all">
            <LogOut size={15} className="text-vt-muted" />
          </button>
        </div>
      </header>

      <main className="relative z-10 px-5 max-w-lg mx-auto space-y-5">

        {/* Guest banner */}
        {isGuest && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            className="glass-orange rounded-2xl px-4 py-3.5 flex items-center justify-between">
            <div>
              <p className="text-vt-orange text-sm font-semibold">Guest Mode</p>
              <p className="text-vt-muted text-xs mt-0.5">Sessions won't be saved. Sign in to track progress.</p>
            </div>
            <button onClick={() => router.push("/auth")}
              className="text-vt-orange text-xs font-bold hover:text-vt-orange-light transition-colors shrink-0 ml-4">
              Sign In →
            </button>
          </motion.div>
        )}

        {/* Stats banner — only for real users with sessions */}
        {!isGuest && recentSessions.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl px-5 py-4 flex items-center gap-4">
            <div className="flex-1">
              <p className="text-vt-muted text-xs uppercase tracking-widest mb-0.5">Best spike</p>
              <p className="font-display font-bold text-4xl text-vt-blue">
                {bestSpeed > 0 ? bestSpeed.toFixed(1) : "—"}
                <span className="text-lg ml-1 text-vt-muted font-sans font-normal">km/h</span>
              </p>
            </div>
            <div className="w-px h-10 bg-vt-outline" />
            <div className="flex-1">
              <p className="text-vt-muted text-xs uppercase tracking-widest mb-0.5">Sessions</p>
              <p className="font-display font-bold text-4xl text-vt-text">{recentSessions.length}</p>
            </div>
            <div className="w-px h-10 bg-vt-outline" />
            <button onClick={() => router.push("/history")}
              className="flex-1 flex items-center justify-center gap-1 text-vt-blue text-xs font-semibold hover:text-vt-blue-bright transition-colors">
              <TrendingUp size={14} />
              Trends
            </button>
          </motion.div>
        )}

        {/* Mode selector */}
        <div>
          <p className="text-vt-faint text-xs font-bold uppercase tracking-widest mb-3 px-1">New Session</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                mode: "spike", icon: Zap, label: "Spike Touch",
                desc: "Speed & form analysis",
                border: "rgba(56,189,248,0.2)", glow: "hover:shadow-blue-glow",
                bg: "rgba(56,189,248,0.07)", textColor: "text-vt-blue",
              },
              {
                mode: "block", icon: Shield, label: "Block Touch",
                desc: "Net position & timing",
                border: "rgba(249,115,22,0.2)", glow: "hover:shadow-orange-glow",
                bg: "rgba(249,115,22,0.07)", textColor: "text-vt-orange",
              },
            ].map(({ mode, icon: Icon, label, desc, border, glow, bg, textColor }, i) => (
              <motion.button key={mode}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push(`/record?mode=${mode}`)}
                className={`rounded-2xl p-5 text-left transition-all duration-300 ${glow} cursor-pointer`}
                style={{ background: bg, border: `1px solid ${border}` }}>
                <div className="w-10 h-10 rounded-xl glass flex items-center justify-center mb-4">
                  <Icon size={18} className={textColor} />
                </div>
                <p className={`font-display font-bold text-xl uppercase ${textColor}`}>{label}</p>
                <p className="text-vt-muted text-xs mt-1 leading-relaxed">{desc}</p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Recent sessions — hidden for guests */}
        {!isGuest && (
          <div>
            <div className="flex items-center justify-between px-1 mb-3">
              <p className="text-vt-faint text-xs font-bold uppercase tracking-widest">Recent Sessions</p>
              {recentSessions.length > 0 && (
                <button onClick={() => router.push("/history")}
                  className="text-vt-blue text-xs font-semibold hover:text-vt-blue-bright transition-colors">
                  View all →
                </button>
              )}
            </div>

            {recentSessions.length === 0 ? (
              <div className="glass rounded-2xl p-8 text-center">
                <p className="text-4xl mb-3">🏐</p>
                <p className="text-vt-text font-semibold">No sessions yet</p>
                <p className="text-vt-muted text-sm mt-1">Upload your first clip to get started</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentSessions.map((s, i) => {
                  const conf = s.speed_confidence ? getConfidenceMeta(s.speed_confidence) : null;
                  const isSpike = s.mode === "spike";
                  return (
                    <motion.button key={s.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => router.push(`/results?id=${s.id}`)}
                      className="glass w-full rounded-2xl px-4 py-3.5 flex items-center gap-3 hover:border-vt-blue/25 transition-all duration-200 text-left">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isSpike ? "bg-vt-blue/10" : "bg-vt-orange/10"}`}>
                        {isSpike
                          ? <Zap size={15} className="text-vt-blue" />
                          : <Shield size={15} className="text-vt-orange" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-vt-text text-sm font-semibold capitalize">{s.mode} Touch</span>
                          {conf && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ color: conf.color, background: conf.bg }}>
                              {conf.label}
                            </span>
                          )}
                        </div>
                        <p className="text-vt-muted text-xs mt-0.5 truncate">{formatDateTime(s.recorded_at)}</p>
                      </div>
                      {s.speed_kmh !== null && (
                        <div className="text-right flex-shrink-0">
                          <p className="font-mono font-bold text-sm text-vt-blue">{s.speed_kmh.toFixed(1)}</p>
                          <p className="text-vt-faint text-[10px]">km/h</p>
                        </div>
                      )}
                      {s.form_score !== null && (
                        <div className="text-right flex-shrink-0">
                          <p className="font-mono font-bold text-sm" style={{ color: getScoreColor(s.form_score) }}>
                            {Math.round(s.form_score)}
                          </p>
                          <p className="text-vt-faint text-[10px]">form</p>
                        </div>
                      )}
                      <ChevronRight size={13} className="text-vt-faint flex-shrink-0" />
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Guest CTA */}
        {isGuest && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="glass rounded-2xl p-6 text-center">
            <p className="text-3xl mb-3">📊</p>
            <p className="text-vt-text font-semibold">Want to track progress?</p>
            <p className="text-vt-muted text-sm mt-1 mb-4">Sign in to save sessions and see your improvement over time.</p>
            <button onClick={() => router.push("/auth")}
              className="bg-vt-blue text-vt-bg font-bold px-6 h-10 rounded-xl text-sm hover:bg-vt-blue-bright transition-all shadow-blue-glow">
              Sign In Free
            </button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
