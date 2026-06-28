import type { Metadata } from "next";
import "./globals.css";
import WetBackground from "@/components/WetBackground";
import QRFab from "@/components/QRFab";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Wet Olympics — Full Moon @ Wet Party Hostel",
  description:
    "5-game tournament at Wet Party Hostel, Haad Rin. Pool Volleyball, Beer Pong, Billiards, Table Tennis, Basketball. 100 baht / player. Prizes for the winners.",
  openGraph: {
    title: "Wet Olympics — Full Moon Tournament",
    description: "Sign your team up. Win a bucket. Get wet.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WetBackground />
        <header className="sticky top-0 z-30 backdrop-blur-md bg-wet-900/30 border-b border-wet-700/30">
          <nav className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-2xl group-hover:rotate-12 transition-transform">💦</span>
              <span className="font-display font-black tracking-tight text-lg text-shimmer">
                WET OLYMPICS
              </span>
            </Link>
            <div className="flex items-center gap-1.5 sm:gap-3 text-sm">
              <Link href="/" className="btn-ghost !py-1.5 !px-3 text-xs sm:text-sm">
                Games
              </Link>
              <Link href="/brackets" className="btn-ghost !py-1.5 !px-3 text-xs sm:text-sm">
                Brackets
              </Link>
              <Link href="/qr" className="btn-ghost !py-1.5 !px-3 text-xs sm:text-sm">
                QR
              </Link>
            </div>
          </nav>
        </header>
        <main className="max-w-6xl mx-auto px-4 pb-32 pt-6">{children}</main>
        <QRFab />
        <footer className="text-center text-xs text-wet-200/60 py-6">
          @ Wet Party Hostel · Haad Rin, Koh Phangan ·{" "}
          <span className="text-shimmer font-bold">stay wet</span>
        </footer>
      </body>
    </html>
  );
}
