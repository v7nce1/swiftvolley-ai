"use client";
import { motion } from "framer-motion";
import { getScoreColor } from "@/types";

interface Props {
  label: string;
  score: number | null;
  description?: string;
  size?: "sm" | "md";
}

export function FormScoreCard({ label, score, description, size = "md" }: Props) {
  const color = getScoreColor(score ?? 0);
  const circ  = 2 * Math.PI * 18;
  const progress = ((score ?? 0) / 100) * circ;

  if (size === "sm") {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-xs">
          <span className="text-vt-muted">{label}</span>
          <span style={{ color }} className="font-mono font-semibold">
            {score !== null ? score.toFixed(0) : "—"}
          </span>
        </div>
        <div className="h-1 bg-vt-outline rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score ?? 0}%` }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
            className="h-full rounded-full"
            style={{ background: color }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3">
      <svg width={44} height={44} viewBox="0 0 44 44" className="shrink-0">
        <circle cx={22} cy={22} r={18} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={4} />
        <motion.circle
          cx={22} cy={22} r={18}
          fill="none" stroke={color} strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circ}`}
          transform="rotate(-90 22 22)"
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${progress} ${circ}` }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 4px ${color}88)` }}
        />
        <text x={22} y={27} textAnchor="middle" fill={color} fontSize={11} fontWeight={700} fontFamily="monospace">
          {score !== null ? Math.round(score) : "—"}
        </text>
      </svg>
      <div>
        <p className="text-sm font-semibold text-white">{label}</p>
        {description && <p className="text-xs text-vt-muted mt-0.5">{description}</p>}
      </div>
    </div>
  );
}
