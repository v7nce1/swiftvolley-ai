"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { TrendDay } from "@/types";

interface Props { data: TrendDay[]; }

export function TrendChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-vt-muted text-sm">
        Not enough data yet — record more sessions!
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
        <XAxis
          dataKey="day" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
          tickLine={false} axisLine={false}
        />
        <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{ background: "#1A1A2E", border: "1px solid #2A2A3E", borderRadius: 10, fontSize: 12 }}
          labelStyle={{ color: "rgba(255,255,255,0.6)", marginBottom: 4 }}
          itemStyle={{ color: "white" }}
        />
        <Legend wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }} />
        <Line
          type="monotone" dataKey="avg_speed_kmh" name="Avg Speed (km/h)"
          stroke="#00E5A0" strokeWidth={2} dot={false} activeDot={{ r: 4 }}
        />
        <Line
          type="monotone" dataKey="avg_form_score" name="Form Score"
          stroke="#FFD166" strokeWidth={2} dot={false} activeDot={{ r: 4 }}
          strokeDasharray="5 3"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
