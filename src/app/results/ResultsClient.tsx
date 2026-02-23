"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Share2, Trash2 } from "lucide-react";
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { SpeedGauge } from "@/components/SpeedGauge";
import { FormScoreCard } from "@/components/FormScoreCard";
import { Button } from "@/components/ui/Button";
import { formatDateTime } from "@/lib/utils";
import { getScoreColor } from "@/types";

interface Session {
  id: string; mode: string; camera_angle: string; recorded_at: string;
  clip_duration_ms: number | null;
  speed_kmh: number | null; peak_speed_kmh: number | null; speed_confidence: number | null;
  used_cloud_fallback: boolean;
  form_score: number | null; wrist_snap_score: number | null;
  arm_extension_score: number | null; contact_point_score: number | null;
}

interface Trajectory {
  frame_indices: number[]; speeds_kmh: number[];
  positions_x: (number | null)[]; positions_y: (number | null)[];
  total_frames: number; fps: number; contact_frame_index: number | null;
}

interface Keypoints {
  keypoint_names: string[]; positions_x: number[]; positions_y: number[];
  scores: number[]; contact_frame_index: number | null;
}

interface Props { session: Session; trajectory: Trajectory | null; keypoints: Keypoints | null; }

const POSE_CONNECTIONS = [
  [5,6],[5,7],[7,9],[6,8],[8,10],[5,11],[6,12],[11,12],[11,13],[13,15],[12,14],[14,16],
];

export default function ResultsClient({ session, trajectory, keypoints }: Props) {
  const router = useRouter();
  const [scrubFrame, setScrubFrame] = useState(keypoints?.contact_frame_index ?? 0);
  const [deleting, setDeleting] = useState(false);

  const totalFrames = trajectory?.total_frames ?? 0;
  const contactIdx  = keypoints?.contact_frame_index ?? trajectory?.contact_frame_index ?? null;

  const chartData = trajectory
    ? trajectory.frame_indices.map((f, i) => ({
        frame: f,
        speed: parseFloat((trajectory.speeds_kmh[i] ?? 0).toFixed(1)),
      }))
    : [];

  const handleDelete = async () => {
    if (!confirm("Delete this session? This cannot be undone.")) return;
    setDeleting(true);
    await fetch(`/api/sessions?id=${session.id}`, { method: "DELETE" });
    router.push("/history");
  };

  const handleShare = async () => {
    const text = `🏐 VolleyTrack — ${session.mode === "spike" ? "Spike" : "Block"} session\n` +
      `Speed: ${session.speed_kmh?.toFixed(1) ?? "—"} km/h\n` +
      `Form: ${session.form_score?.toFixed(0) ?? "—"}/100`;
    if (navigator.share) {
      await navigator.share({ title: "VolleyTrack Result", text });
    } else {
      await navigator.clipboard.writeText(text);
      alert("Result copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen bg-vt-bg pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 pt-12 pb-6">
        <button onClick={() => router.push("/home")}
          className="p-2 rounded-xl glass hover:border-white/20 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold capitalize">{session.mode} Touch Result</h1>
          <p className="text-vt-muted text-xs">{formatDateTime(session.recorded_at)}</p>
        </div>
        <button onClick={handleShare}
          className="p-2 rounded-xl glass hover:border-white/20 transition-colors">
          <Share2 size={16} className="text-vt-muted" />
        </button>
        <button onClick={handleDelete} disabled={deleting}
          className="p-2 rounded-xl glass hover:border-vt-coral/30 transition-colors">
          <Trash2 size={16} className="text-vt-muted" />
        </button>
      </div>

      {/* Camera angle warning */}
      {session.camera_angle === "sideline" && (
        <div className="mx-6 mb-4 px-4 py-2.5 rounded-xl bg-vt-amber/5 border border-vt-amber/20">
          <p className="text-vt-amber text-xs">
            <span className="font-semibold">Sideline angle:</span> Speed is accurate; form scores are weighted for 2D projection.
          </p>
        </div>
      )}

      <div className="px-6 max-w-lg mx-auto space-y-4">

        {/* Speed + Form overview */}
        <div className="grid grid-cols-2 gap-4">
          {/* Speed card */}
          <div className="glass rounded-2xl p-4 col-span-1 flex flex-col items-center">
            <p className="text-vt-faint text-xs font-bold uppercase tracking-widest mb-3 self-start">Speed</p>
            {session.speed_kmh !== null ? (
              <SpeedGauge
                speedKmh={session.speed_kmh}
                peakSpeedKmh={session.peak_speed_kmh ?? session.speed_kmh}
                confidence={session.speed_confidence ?? 0}
                usedCloudFallback={session.used_cloud_fallback}
                size="sm"
              />
            ) : (
              <div className="text-vt-muted text-sm py-4">No speed data</div>
            )}
          </div>

          {/* Form card */}
          <div className="glass rounded-2xl p-4 col-span-1">
            <p className="text-vt-faint text-xs font-bold uppercase tracking-widest mb-3">Form</p>
            <div className="text-center mb-3">
              <p className="text-4xl font-extrabold font-mono"
                style={{ color: getScoreColor(session.form_score ?? 0) }}>
                {session.form_score?.toFixed(0) ?? "—"}
              </p>
              <p className="text-vt-faint text-xs">/100</p>
            </div>
            <div className="space-y-2.5">
              <FormScoreCard label="Arm Extension" score={session.arm_extension_score} size="sm" />
              <FormScoreCard label="Wrist Snap"    score={session.wrist_snap_score}    size="sm" />
              <FormScoreCard label="Contact Point" score={session.contact_point_score} size="sm" />
            </div>
          </div>
        </div>

        {/* Trajectory & frame scrubber */}
        {chartData.length > 0 && (
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-vt-faint text-xs font-bold uppercase tracking-widest">Shot Timeline</p>
              <span className="text-vt-muted text-xs font-mono">
                {scrubFrame}/{totalFrames} · {trajectory?.fps ?? 60} fps
              </span>
            </div>

            {/* Speed sparkline */}
            <ResponsiveContainer width="100%" height={72}>
              <LineChart data={chartData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                <Line type="monotone" dataKey="speed" stroke="#00E5A0" strokeWidth={1.5} dot={false} animationDuration={0} />
                {contactIdx !== null && <ReferenceLine x={contactIdx} stroke="#FFD166" strokeWidth={1.5} strokeDasharray="3 3" />}
                <ReferenceLine x={scrubFrame} stroke="rgba(255,255,255,0.5)" strokeWidth={1} />
                <Tooltip
                  contentStyle={{ background: "#1A1A2E", border: "1px solid #2A2A3E", borderRadius: 8, fontSize: 11 }}
                  formatter={(v: number) => [`${v} km/h`, "Speed"]}
                  labelFormatter={(v) => `Frame ${v}`}
                />
              </LineChart>
            </ResponsiveContainer>

            {/* Scrub track */}
            <div className="relative mt-2 h-2 bg-vt-outline rounded-full cursor-pointer"
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                const ratio = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
                setScrubFrame(Math.round(ratio * Math.max(totalFrames - 1, 1)));
              }}>
              <div className="absolute top-0 left-0 h-full bg-vt-mint/40 rounded-full transition-all"
                style={{ width: `${(scrubFrame / Math.max(totalFrames - 1, 1)) * 100}%` }} />
              {/* Scrub thumb */}
              <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-vt-mint border-2 border-vt-bg shadow-lg"
                style={{ left: `${(scrubFrame / Math.max(totalFrames - 1, 1)) * 100}%`, transform: "translate(-50%, -50%)" }} />
              {/* Contact marker */}
              {contactIdx !== null && (
                <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-vt-amber border-2 border-vt-bg"
                  style={{ left: `${(contactIdx / Math.max(totalFrames - 1, 1)) * 100}%`, transform: "translate(-50%, -50%)" }} />
              )}
            </div>

            {/* Frame controls */}
            <div className="flex gap-2 mt-3">
              <button onClick={() => setScrubFrame((f) => Math.max(0, f - 1))}
                className="flex-1 py-1.5 rounded-lg glass text-xs text-vt-muted hover:text-white transition-colors">◀ Prev</button>
              {contactIdx !== null && (
                <button onClick={() => setScrubFrame(contactIdx)}
                  className="flex-[2] py-1.5 rounded-lg bg-vt-amber/10 border border-vt-amber/30 text-xs text-vt-amber font-semibold">
                  ⚡ Contact Frame
                </button>
              )}
              <button onClick={() => setScrubFrame((f) => Math.min(totalFrames - 1, f + 1))}
                className="flex-1 py-1.5 rounded-lg glass text-xs text-vt-muted hover:text-white transition-colors">Next ▶</button>
            </div>
          </div>
        )}

        {/* Pose skeleton at contact frame */}
        {keypoints && keypoints.positions_x.length > 0 && (
          <div className="glass rounded-2xl p-4">
            <p className="text-vt-faint text-xs font-bold uppercase tracking-widest mb-3">Pose at Contact</p>
            <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
              <svg
                viewBox="0 0 640 360"
                className="absolute inset-0 w-full h-full"
                style={{ background: "rgba(0,0,0,0.3)", borderRadius: 8 }}
              >
                {/* Connections */}
                {POSE_CONNECTIONS.map(([a, b], i) => {
                  const ax = keypoints.positions_x[a], ay = keypoints.positions_y[a];
                  const bx = keypoints.positions_x[b], by = keypoints.positions_y[b];
                  const as_ = keypoints.scores[a], bs = keypoints.scores[b];
                  if (ax == null || ay == null || bx == null || by == null) return null;
                  if (as_ < 0.2 || bs < 0.2) return null;
                  return (
                    <line key={i}
                      x1={ax * 640} y1={ay * 360} x2={bx * 640} y2={by * 360}
                      stroke="#00E5A0" strokeWidth={2} strokeOpacity={Math.min(as_, bs)}
                    />
                  );
                })}
                {/* Keypoints */}
                {keypoints.positions_x.map((x, i) => {
                  const y = keypoints.positions_y[i];
                  const s = keypoints.scores[i];
                  if (x == null || y == null || s < 0.2) return null;
                  const isWrist = i === 9 || i === 10;
                  return (
                    <circle key={i}
                      cx={x * 640} cy={y * 360}
                      r={isWrist ? 6 : 4}
                      fill={isWrist ? "#FFD166" : "#00E5A0"}
                      opacity={s}
                    />
                  );
                })}
              </svg>
            </div>
            <p className="text-vt-faint text-xs mt-2">
              🟡 Wrists &nbsp;·&nbsp; 🟢 Other joints &nbsp;·&nbsp; Opacity = confidence
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1"
            onClick={() => router.push(`/record?mode=${session.mode}`)}>
            New Session
          </Button>
          <Button variant="primary" className="flex-1"
            onClick={() => router.push("/history")}>
            View History
          </Button>
        </div>
      </div>
    </div>
  );
}
