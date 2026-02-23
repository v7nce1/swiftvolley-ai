"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LogOut, User, Trash2, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface Props {
  user: { id: string; email: string; displayName: string; avatarUrl: string | null; provider: string; };
  profile: { video_storage_preference?: string } | null;
}

export default function SettingsClient({ user, profile }: Props) {
  const router  = useRouter();
  const supabase = createClient();
  const [storePref, setStorePref] = useState<"always" | "never" | "ask">(
    (profile?.video_storage_preference as "always" | "never" | "ask") ?? "never"
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
  };

  const deleteAccount = async () => {
    const confirmed = confirm(
      "Delete your account? All sessions and data will be permanently removed. This cannot be undone."
    );
    if (!confirmed) return;
    const confirmed2 = confirm("Are you absolutely sure? Type OK in the next prompt to confirm.");
    if (!confirmed2) return;

    await supabase.from("sessions").delete().eq("user_id", user.id);
    await supabase.from("profiles").delete().eq("id", user.id);
    await supabase.auth.signOut();
    router.push("/auth");
  };

  const savePreferences = async () => {
    setSaving(true);
    await supabase
      .from("profiles")
      .upsert({ id: user.id, video_storage_preference: storePref });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const providerLabel = user.provider === "azure" ? "Microsoft" : "Google";

  return (
    <div className="min-h-screen bg-vt-bg pb-24">
      <div className="px-6 pt-14 pb-8">
        <h1 className="text-2xl font-extrabold">Settings</h1>
      </div>

      <div className="px-6 max-w-lg mx-auto space-y-5">

        {/* Profile */}
        <section>
          <p className="text-vt-faint text-xs font-bold uppercase tracking-widest mb-3">Account</p>
          <div className="glass rounded-2xl p-4 flex items-center gap-4">
            {user.avatarUrl ? (
              <Image src={user.avatarUrl} alt="avatar" width={48} height={48}
                className="rounded-full border border-vt-outline shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-vt-elevated border border-vt-outline flex items-center justify-center shrink-0">
                <User size={20} className="text-vt-muted" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold truncate">{user.displayName}</p>
              <p className="text-vt-muted text-xs truncate">{user.email}</p>
              <p className="text-vt-faint text-xs mt-0.5">Signed in via {providerLabel}</p>
            </div>
          </div>
        </section>

        {/* Video storage preference */}
        <section>
          <p className="text-vt-faint text-xs font-bold uppercase tracking-widest mb-3">Privacy</p>
          <div className="glass rounded-2xl p-4 space-y-3">
            <div>
              <p className="text-white text-sm font-semibold">Video Storage</p>
              <p className="text-vt-muted text-xs mt-0.5">
                Videos are processed in your browser. Choose whether to save them to the cloud for replay.
              </p>
            </div>
            <div className="space-y-2">
              {([
                { value: "never",  label: "Never store",  desc: "Videos are not uploaded — most private" },
                { value: "ask",    label: "Ask each time", desc: "You'll be prompted after each session"  },
                { value: "always", label: "Always store",  desc: "Saved for replay and sharing"           },
              ] as const).map(({ value, label, desc }) => (
                <button key={value} onClick={() => setStorePref(value)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all border",
                    storePref === value
                      ? "border-vt-mint/50 bg-vt-mint/5"
                      : "border-vt-outline hover:border-white/15"
                  )}>
                  <div className={cn(
                    "w-4 h-4 rounded-full border-2 shrink-0 transition-colors",
                    storePref === value ? "border-vt-mint bg-vt-mint" : "border-vt-outline"
                  )} />
                  <div>
                    <p className={cn("text-sm font-medium", storePref === value ? "text-vt-mint" : "text-white")}>{label}</p>
                    <p className="text-vt-faint text-xs">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
            <Button variant="secondary" size="sm" loading={saving} onClick={savePreferences}
              className={saved ? "border-vt-mint/40 text-vt-mint" : ""}>
              {saved ? "✓ Saved" : "Save preference"}
            </Button>
          </div>
        </section>

        {/* About */}
        <section>
          <p className="text-vt-faint text-xs font-bold uppercase tracking-widest mb-3">About</p>
          <div className="glass rounded-2xl overflow-hidden">
            {[
              { label: "Version",   value: "1.0.0" },
              { label: "Platform",  value: "Web (Vercel)" },
              { label: "CV Engine", value: "TensorFlow.js + MoveNet" },
            ].map(({ label, value }, i) => (
              <div key={label}
                className={cn("flex items-center justify-between px-4 py-3", i < 2 && "border-b border-vt-outline")}>
                <span className="text-vt-muted text-sm">{label}</span>
                <span className="text-white text-sm font-medium">{value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Danger zone */}
        <section className="pb-4">
          <p className="text-vt-faint text-xs font-bold uppercase tracking-widest mb-3">Actions</p>
          <div className="space-y-2">
            <button onClick={signOut}
              className="w-full glass rounded-2xl px-4 py-3 flex items-center justify-between hover:border-white/20 transition-all">
              <div className="flex items-center gap-3">
                <LogOut size={16} className="text-vt-muted" />
                <span className="text-white text-sm font-medium">Sign Out</span>
              </div>
              <ChevronRight size={14} className="text-vt-faint" />
            </button>
            <button onClick={deleteAccount}
              className="w-full rounded-2xl px-4 py-3 flex items-center justify-between bg-vt-coral/5 border border-vt-coral/20 hover:border-vt-coral/40 transition-all">
              <div className="flex items-center gap-3">
                <Trash2 size={16} className="text-vt-coral" />
                <span className="text-vt-coral text-sm font-medium">Delete Account & Data</span>
              </div>
              <ChevronRight size={14} className="text-vt-coral/50" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
