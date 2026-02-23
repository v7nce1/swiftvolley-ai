"use client";
import { getConfidenceMeta } from "@/types";

interface Props {
  speedKmh: number;
  peakSpeedKmh: number;
  confidence: number;
  usedCloudFallback?: boolean;
  size?: "sm" | "lg";
}

export function SpeedGauge({ speedKmh, peakSpeedKmh, confidence, usedCloudFallback, size = "lg" }: Props) {
  const MAX   = 150;
  const angle = Math.min((speedKmh / MAX) * 180, 180);
  const conf  = getConfidenceMeta(confidence);

  const dim = size === "lg" ? 220 : 160;
  const cx  = dim / 2;
  const cy  = dim / 2;
  const r   = dim * 0.41;

  const toXY = (deg: number) => {
    const rad = ((deg - 180) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const start    = toXY(0);
  const end      = toXY(angle);
  const large    = angle > 90 ? 1 : 0;
  const needleEnd = toXY(angle);
  const sw       = size === "lg" ? 12 : 8;
  const fontSize = size === "lg" ? 28 : 20;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={dim} height={Math.round(dim * 0.6)} viewBox={`0 0 ${dim} ${dim * 0.6}`}>
        {/* Track */}
        <path
          d={`M ${toXY(0).x} ${toXY(0).y} A ${r} ${r} 0 1 1 ${toXY(180).x} ${toXY(180).y}`}
          fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={sw} strokeLinecap="round"
        />
        {/* Speed arc */}
        {angle > 0 && (
          <path
            d={`M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`}
            fill="none" stroke="#00E5A0" strokeWidth={sw} strokeLinecap="round"
            style={{ filter: "drop-shadow(0 0 8px #00E5A066)" }}
          />
        )}
        {/* Needle */}
        <line x1={cx} y1={cy} x2={needleEnd.x} y2={needleEnd.y} stroke="white" strokeWidth={1.5} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={4} fill="white" />
        {/* Speed label */}
        <text x={cx} y={cy - 12} textAnchor="middle" fill="white" fontSize={fontSize} fontWeight={700} fontFamily="monospace">
          {speedKmh.toFixed(1)}
        </text>
        <text x={cx} y={cy - 1} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={10}>
          km/h
        </text>
      </svg>

      <div className="flex items-center gap-2 flex-wrap justify-center">
        <span className="text-xs text-vt-muted">Peak: <span className="text-white font-semibold">{peakSpeedKmh.toFixed(1)}</span></span>
        <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
          style={{ color: conf.color, background: conf.bg, border: `1px solid ${conf.color}44` }}>
          {conf.label} confidence
        </span>
        {usedCloudFallback && (
          <span className="text-xs text-vt-amber">☁ cloud-enhanced</span>
        )}
      </div>
    </div>
  );
}
