"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";

export default function Home() {
  const [isGuest, setIsGuest] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const guestMode = localStorage.getItem("guest_mode") === "true";
    setIsGuest(guestMode);
  }, []);

  const features = [
    {
      icon: "📹",
      title: "Record Spike",
      description: "Capture your spike with high-speed analysis",
      href: "/record",
    },
    {
      icon: "⚡",
      title: "Speed Analysis",
      description: "Get precise km/h measurements of your spikes",
      href: "/results",
    },
    {
      icon: "🎯",
      title: "Form Scoring",
      description: "AI evaluates your wrist snap and arm extension",
      href: "/results",
    },
    {
      icon: "📊",
      title: "Progress Tracking",
      description: "Track your improvement over time with trends",
      href: "/history",
    },
  ];

  return (
    <div className="min-h-screen bg-vt-bg">
      <Navbar isGuest={isGuest} />

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-6 pt-20 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-6xl font-black mb-4 bg-gradient-to-r from-vt-mint to-vt-mint/70 bg-clip-text text-transparent">
            Welcome to VolleyTrack
          </h1>
          <p className="text-xl text-vt-muted mb-8 max-w-2xl mx-auto">
            {isGuest
              ? "You're in Guest Mode. Explore the features below to test the app."
              : "Use AI to analyze your spike and improve your game."}
          </p>

          {isGuest && (
            <div className="inline-block bg-vt-coral/10 border border-vt-coral/30 rounded-xl px-4 py-2 text-sm text-vt-coral mb-8">
              📌 Guest Mode: Your data won't be saved. Sign in to save your progress.
            </div>
          )}

          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/record">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-vt-mint/20 to-vt-mint/10 border border-vt-mint/30 hover:border-vt-mint/50 text-white px-6 h-12 rounded-xl font-semibold transition-all"
              >
                🚀 Record Your Spike
              </motion.button>
            </Link>
            <Link href="/history">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white/5 border border-white/10 hover:border-white/20 text-white px-6 h-12 rounded-xl font-semibold transition-all"
              >
                📊 View History
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-20">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group"
            >
              <Link href={feature.href}>
                <div className="bg-white/5 border border-white/10 hover:border-vt-mint/30 rounded-2xl p-8 transition-all duration-300 h-full hover:bg-white/8 cursor-pointer">
                  <div className="text-5xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-bold mb-2 text-white">{feature.title}</h3>
                  <p className="text-vt-muted">{feature.description}</p>
                  <div className="mt-4 inline-block text-vt-mint text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    Explore →
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-vt-mint/10 to-vt-coral/10 border border-white/10 rounded-2xl p-12 text-center"
        >
          <h2 className="text-2xl font-bold mb-8">Built for Volleyball Players</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="text-4xl font-black text-vt-mint mb-2">100+</div>
              <p className="text-vt-muted">Analysis Points</p>
            </div>
            <div>
              <div className="text-4xl font-black text-vt-mint mb-2">1ms</div>
              <p className="text-vt-muted">Detection Accuracy</p>
            </div>
            <div>
              <div className="text-4xl font-black text-vt-mint mb-2">Real-time</div>
              <p className="text-vt-muted">AI Feedback</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
