"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const [isGuest, setIsGuest] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const guestMode = localStorage.getItem("guest_mode") === "true";
      setIsGuest(guestMode);

      if (!guestMode) {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      }
    };
    checkAuth();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  const handleExitGuest = () => {
    localStorage.removeItem("guest_mode");
    router.push("/auth");
  };

  return (
    <div className="min-h-screen bg-vt-bg pb-24">
      <Navbar isGuest={isGuest} />

      <div className="max-w-2xl mx-auto px-6 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-black mb-8">⚙️ Settings</h1>

          {/* Account Section */}
          {!isGuest && user && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
              <h2 className="font-bold mb-4">Account</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-vt-muted mb-1">Email</p>
                  <p className="font-semibold">{user.email}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full bg-vt-coral/10 border border-vt-coral/30 hover:bg-vt-coral/20 text-vt-coral px-4 h-12 rounded-xl font-semibold transition-all"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}

          {/* Guest Mode Section */}
          {isGuest && (
            <div className="bg-vt-coral/10 border border-vt-coral/30 rounded-xl p-6 mb-6">
              <h2 className="font-bold mb-4 text-vt-coral">👋 Guest Mode</h2>
              <p className="text-sm text-vt-muted mb-4">
                You're using VolleyTrack in Guest Mode. Your data won't be saved.
              </p>
              <button
                onClick={handleExitGuest}
                className="w-full bg-gradient-to-r from-vt-mint/20 to-vt-mint/10 border border-vt-mint/30 hover:border-vt-mint/50 text-white px-4 h-12 rounded-xl font-semibold transition-all"
              >
                Sign In to Save Progress
              </button>
            </div>
          )}

          {/* App Settings */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
            <h2 className="font-bold mb-4">App Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">Camera Quality</p>
                  <p className="text-xs text-vt-muted">HD (1080p)</p>
                </div>
                <select className="bg-white/10 border border-white/10 rounded-lg px-3 h-8 text-sm text-white">
                  <option>720p</option>
                  <option selected>1080p</option>
                  <option>4K</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">Metric System</p>
                  <p className="text-xs text-vt-muted">km/h</p>
                </div>
                <input type="checkbox" className="w-5 h-5" defaultChecked />
              </div>
            </div>
          </div>

          {/* About */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="font-bold mb-4">About</h2>
            <div className="space-y-3 text-sm text-vt-muted">
              <div className="flex justify-between">
                <span>Version</span>
                <span>1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span>Last Updated</span>
                <span>Feb 23, 2026</span>
              </div>
              <div className="pt-3 border-t border-white/10">
                <p className="text-xs text-vt-muted/50">
                  VolleyTrack © 2026 • All rights reserved
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
