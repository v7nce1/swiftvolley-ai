"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Clock, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/home",    icon: Home,     label: "Home"    },
  { href: "/history", icon: Clock,    label: "History" },
  { href: "/settings",icon: Settings, label: "Settings"},
];

export function Navbar({ isGuest }: { isGuest?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    if (isGuest) {
      localStorage.removeItem("guest_mode");
      router.push("/auth");
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-vt-blue/10 via-transparent to-transparent backdrop-blur-lg border-t border-vt-outline px-6 py-3 safe-area-pb shadow-lg">
      <div className="max-w-lg mx-auto flex items-center justify-around">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link key={href} href={href}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-1 rounded-2xl transition-all duration-200",
                active ? "text-white bg-vt-mint/80 shadow-inner" : "text-vt-muted hover:text-white hover:bg-white/3"
              )}>
              <Icon size={20} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
        {isGuest && (
          <button
            onClick={handleLogout}
            className="flex flex-col items-center gap-1 px-4 py-1 rounded-2xl transition-all duration-200 text-vt-coral hover:text-white bg-white/2"
            title="Exit Guest Mode"
          >
            <span className="text-[11px] font-medium">👋</span>
            <span className="text-[10px] font-medium">Exit</span>
          </button>
        )}
      </div>
    </nav>
  );
}
