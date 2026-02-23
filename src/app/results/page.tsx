"use client";

import { Navbar } from "@/components/Navbar";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function ResultsPage() {
  const [frames, setFrames] = useState<string[] | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("lastRecording");
      if (raw) setFrames(JSON.parse(raw));
    } catch (e) {
      setFrames(null);
    }
  }, []);

  const hasFrames = Array.isArray(frames) && frames.length > 0;

  const mockResult = {
    speedKmh: 78.5,
    peakSpeedKmh: 82.3,
    formScore: 85,
    wristSnapScore: 88,
    armExtensionScore: 82,
    contactPointScore: 84,
  };

  return (
    <div className="min-h-screen bg-vt-bg pb-24">
      <Navbar />

      <div className="max-w-3xl mx-auto px-6 pt-8">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-black mb-6 text-center">⚡ Analysis Results</h1>

          {hasFrames ? (
            <div className="grid gap-4 mb-6">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <h3 className="font-semibold mb-3">Captured Frames ({frames!.length})</h3>
                <div className="grid grid-cols-3 gap-2">
                  {frames!.slice(0, 12).map((src, i) => (
                    <img key={i} src={src} className="w-full h-24 object-cover rounded-md" alt={`frame-${i}`} />
                  ))}
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-vt-muted">
                <p>This is a quick preview of the captured recording. The full analysis runs locally and will be shown here after processing.</p>
              </div>
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6 text-center">
              <p className="text-vt-muted">No local recording found — try recording from the Record page.</p>
            </div>
          )}

          {/* Speed + Scores (mock/fallback) */}
          <div className="bg-gradient-to-br from-vt-mint/20 to-vt-mint/10 border border-vt-mint/30 rounded-2xl p-8 mb-8">
            <div className="text-center mb-6">
              <p className="text-vt-muted mb-2">Peak Speed</p>
              <div className="text-6xl font-black text-vt-mint mb-2">{mockResult.peakSpeedKmh}</div>
              <p className="text-2xl font-bold">km/h</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <p className="text-xs text-vt-muted mb-2">Current Speed</p>
                <p className="text-2xl font-bold">{mockResult.speedKmh} km/h</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <p className="text-xs text-vt-muted mb-2">Confidence</p>
                <p className="text-2xl font-bold">92%</p>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-6">Form Analysis</h2>
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {[
              { label: "Overall Form", value: mockResult.formScore, icon: "🎯" },
              { label: "Wrist Snap", value: mockResult.wristSnapScore, icon: "🌪️" },
              { label: "Arm Extension", value: mockResult.armExtensionScore, icon: "💪" },
              { label: "Contact Point", value: mockResult.contactPointScore, icon: "✋" },
            ].map((score, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2"><span className="text-2xl">{score.icon}</span><p className="font-semibold text-sm">{score.label}</p></div>
                </div>
                <div className="flex items-end gap-2"><span className="text-3xl font-black text-vt-mint">{score.value}</span><span className="text-vt-muted text-sm mb-1">/100</span></div>
                <div className="w-full bg-white/10 rounded-full h-2 mt-2"><div className="bg-vt-mint rounded-full h-2 transition-all" style={{ width: `${score.value}%` }} /></div>
              </motion.div>
            ))}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
            <h3 className="font-bold mb-4">💡 Improvement Tips</h3>
            <ul className="text-sm text-vt-muted space-y-2 text-left">
              <li>✓ Your wrist snap is excellent - keep that momentum!</li>
              <li>✓ Work on arm extension to gain more power</li>
              <li>✓ Focus contact point consistency for better control</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
