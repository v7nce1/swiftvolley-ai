"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Shield, ChevronRight, Trash2, TrendingUp } from "lucide-react";
import { TrendChart } from "@/components/TrendChart";
import { getConfidenceMeta, getScoreColor } from "@/types";
import { formatDateTime } from "@/lib/utils";
import type { TrendDay } from "@/types";

interface Session {
  id: string; mode: string; camera_angle: string; recorded_at: string;
  speed_kmh: number | null; peak_speed_kmh: number | null;
  speed_confidence: number | null; form_score: number | null;
  wrist_snap_score: number | null; arm_extension_score: number | null;
  contact_point_score: number | null;
}

interface Props { sessions: Session[]; total: number; trends: TrendDay[]; }

export default function HistoryClient({ sessions: initial, total, trends }: Props) {
  const router = useRouter();
  const [sessions, setSessions] = useState(initial);
  const [filter, setFilter]     = useState<"all" | "spike" | "block">("all");
  const [tab, setTab]           = useState<"sessions" | "trends">("sessions");
  const [pending, startTransition] = useTransition();

  const filtered = filter === "all" ? sessions : sessions.filter((s) => s.mode === filter);

  const bestSpeed = Math.max(...sessions.map((s) => s.speed_kmh ?? 0), 0);
  const avgForm   = sessions.length
    ? Math.round(sessions.reduce((acc, s) => acc + (s.form_score ?? 0), 0) / sessions.length)
    : 0;

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this session?")) return;
    await fetch(`/api/sessions?id=${id}`, { method: "DELETE" });
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="min-h-screen bg-vt-bg pb-24">
      <div className="px-6 pt-14 pb-6">
        <h1 className="text-2xl font-extrabold">History</h1>
        <p className="text-vt-muted text-sm mt-0.5">{total} sessions recorded</p>
      </div>

      {/* Stats row */}
      {sessions.length > 0 && (
        <div className="px-6 mb-6">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Sessions",   value: total.toString(),         color: "text-white"    },
              { label: "Best Speed", value: `${bestSpeed.toFixed(1)}`, unit: "km/h", color: "text-vt-mint"  },
              { label: "Avg Form",   value: `${avgForm}`,              unit: "/100", color: getScoreColor(avgForm) },
            ].map(({ label, value, unit, color }) => (
              <div key={label} className="glass rounded-2xl p-3 text-center">
                <p className={`text-xl font-extrabold font-mono ${color}`}>{value}</p>
                {unit && <p className="text-vt-faint text-[10px]">{unit}</p>}
                <p className="text-vt-muted text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="px-6 mb-4">
        <div className="flex rounded-2xl bg-vt-surface border border-vt-outline p-1 gap-1">
          {(["sessions", "trends"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${
                tab === t ? "bg-vt-elevated text-white" : "text-vt-muted hover:text-white"
              }`}>
              {t === "sessions" ? "Sessions" : "📈 Trends"}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 max-w-lg mx-auto">
        <AnimatePresence mode="wait">
          {tab === "trends" ? (
            <motion.div key="trends"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="glass rounded-2xl p-4">
              <p className="text-white font-semibold mb-1">Last 14 Days</p>
              <p className="text-vt-muted text-xs mb-4">Speed and form over time</p>
              <TrendChart data={trends} />
            </motion.div>
          ) : (
            <motion.div key="sessions"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-4">
              {/* Filter pills */}
              <div className="flex gap-2">
                {(["all", "spike", "block"] as const).map((f) => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all border ${
                      filter === f
                        ? "border-vt-mint/60 bg-vt-mint/10 text-vt-mint"
                        : "border-vt-outline text-vt-muted hover:text-white"
                    }`}>
                    {f === "all" ? "All" : f === "spike" ? "⚡ Spike" : "🛡 Block"}
                  </button>
                ))}
              </div>

              {filtered.length === 0 ? (
                <div className="glass rounded-2xl p-8 text-center">
                  <p className="text-vt-muted text-sm">No {filter === "all" ? "" : filter} sessions yet</p>
                  <button onClick={() => router.push(`/record?mode=${filter === "all" ? "spike" : filter}`)}
                    className="mt-3 text-vt-mint text-sm font-semibold">
                    Record one now →
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map((s, i) => {
                    const conf = s.speed_confidence ? getConfidenceMeta(s.speed_confidence) : null;
                    const isSpike = s.mode === "spike";
                    return (
                      <motion.div key={s.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        onClick={() => router.push(`/results?id=${s.id}`)}
                        className="glass rounded-2xl px-4 py-3 flex items-center gap-3 cursor-pointer hover:border-white/15 transition-all">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isSpike ? "bg-vt-mint/10" : "bg-vt-amber/10"}`}>
                          {isSpike ? <Zap size={15} className="text-vt-mint" /> : <Shield size={15} className="text-vt-amber" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-white text-sm font-semibold capitalize">{s.mode} Touch</span>
                            {conf && (
                              <span className="text-xs px-2 py-0.5 rounded-full"
                                style={{ color: conf.color, background: conf.bg }}>{conf.label}</span>
                            )}
                          </div>
                          <p className="text-vt-muted text-xs mt-0.5">{formatDateTime(s.recorded_at)}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {s.speed_kmh !== null && (
                            <div className="text-right">
                              <p className="text-white font-bold font-mono text-sm">{s.speed_kmh.toFixed(1)}</p>
                              <p className="text-vt-faint text-[10px]">km/h</p>
                            </div>
                          )}
                          {s.form_score !== null && (
                            <div className="text-right">
                              <p className="font-bold font-mono text-sm" style={{ color: getScoreColor(s.form_score) }}>
                                {s.form_score.toFixed(0)}
                              </p>
                              <p className="text-vt-faint text-[10px]">form</p>
                            </div>
                          )}
                          <button onClick={(e) => handleDelete(s.id, e)}
                            className="p-1.5 rounded-lg hover:bg-vt-coral/10 transition-colors">
                            <Trash2 size={13} className="text-vt-muted hover:text-vt-coral" />
                          </button>
                          <ChevronRight size={13} className="text-vt-faint" />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
