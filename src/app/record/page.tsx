"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { motion } from "framer-motion";

export default function RecordPage() {
  const [isGuest, setIsGuest] = useState(false);

  return (
    <div className="min-h-screen bg-vt-bg pb-24">
      <Navbar isGuest={isGuest} />

      <div className="max-w-2xl mx-auto px-6 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-black mb-4">📹 Record Spike</h1>
          <p className="text-vt-muted mb-8">
            Use your device camera to capture your spike. The AI will analyze:
          </p>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-8">
            <div className="space-y-4 text-left">
              <div className="flex items-start gap-4">
                <span className="text-2xl">⚡</span>
                <div>
                  <h3 className="font-bold mb-1">Speed Measurement</h3>
                  <p className="text-sm text-vt-muted">
                    Real-time ball velocity in km/h
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="text-2xl">🎯</span>
                <div>
                  <h3 className="font-bold mb-1">Form Analysis</h3>
                  <p className="text-sm text-vt-muted">
                    Wrist snap, arm extension, contact point
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="text-2xl">📊</span>
                <div>
                  <h3 className="font-bold mb-1">Trajectory Data</h3>
                  <p className="text-sm text-vt-muted">
                    Ball position and velocity per frame
                  </p>
                </div>
              </div>
            </div>
          </div>

          <button
            className="bg-gradient-to-r from-vt-mint/20 to-vt-mint/10 border border-vt-mint/30 hover:border-vt-mint/50 text-white px-8 h-12 rounded-xl font-semibold transition-all w-full"
            disabled
          >
            📱 Enable Camera (Coming Soon)
          </button>
          <p className="text-xs text-vt-muted mt-4">
            This feature requires camera access and will process video in your browser
          </p>
        </motion.div>
      </div>
    </div>
  );
}
