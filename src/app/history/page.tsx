"use client";

import { Navbar } from "@/components/Navbar";
import { motion } from "framer-motion";
import Link from "next/link";

export default function HistoryPage() {
  const mockSessions = [
    { date: "Feb 23, 2026", speed: 82.3, score: 85 },
    { date: "Feb 22, 2026", speed: 79.1, score: 81 },
    { date: "Feb 21, 2026", speed: 76.5, score: 78 },
    { date: "Feb 20, 2026", speed: 80.2, score: 83 },
  ];

  return (
    <div className="min-h-screen bg-vt-bg pb-24">
      <Navbar />

      <div className="max-w-2xl mx-auto px-6 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-black mb-2">📊 Session History</h1>
          <p className="text-vt-muted mb-8">
            Track your progress over time
          </p>

          <div className="space-y-3 mb-8">
            {mockSessions.map((session, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Link href="/results">
                  <div className="bg-white/5 border border-white/10 hover:border-vt-mint/30 rounded-xl p-4 cursor-pointer transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{session.date}</p>
                        <p className="text-sm text-vt-muted">1 spike recorded</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-vt-mint text-lg">
                          {session.speed} km/h
                        </p>
                        <p className="text-xs text-vt-muted">
                          Form: {session.score}/100
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Stats */}
          <div className="bg-gradient-to-r from-vt-mint/10 to-vt-coral/10 border border-white/10 rounded-xl p-6">
            <h2 className="font-bold mb-6">Overall Statistics</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-black text-vt-mint">82.3</p>
                <p className="text-xs text-vt-muted">Avg Speed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-vt-mint">4</p>
                <p className="text-xs text-vt-muted">Sessions</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-vt-mint">82</p>
                <p className="text-xs text-vt-muted">Avg Form</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
