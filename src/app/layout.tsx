import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VolleyTrack — AI Spike Analyzer",
  description: "Measure your volleyball spike speed and analyze your form with AI.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
