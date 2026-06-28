import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import path from "node:path";

export const runtime = "nodejs";
export const alt = "Wet Olympics — Full Moon @ Wet Party Hostel";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Dynamic OpenGraph card rendered at build time.
 * WhatsApp / iMessage / Discord all fetch this when the link is pasted.
 * Themed to match the site: tropical-neon palette + hostel logo + title.
 */
export default async function OG() {
  const logo = readFileSync(path.join(process.cwd(), "public", "wet-logo.png"));
  const logoDataUri = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(ellipse at 20% 10%, #11afc7 0%, transparent 60%), " +
            "radial-gradient(ellipse at 80% 90%, #ff3edf 0%, transparent 55%), " +
            "radial-gradient(ellipse at 60% 40%, #0892a6 0%, transparent 70%), " +
            "linear-gradient(180deg, #02232c 0%, #053f4d 50%, #02232c 100%)",
          padding: "60px",
          color: "white",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <img
          src={logoDataUri}
          width={260}
          height={260}
          alt="logo"
          style={{ borderRadius: "32px", marginBottom: 24 }}
        />
        <div
          style={{
            fontSize: 96,
            fontWeight: 900,
            letterSpacing: -3,
            textAlign: "center",
            display: "flex",
            lineHeight: 1,
            background: "linear-gradient(90deg, #7fe1f0, #ff3edf, #ffb347)",
            backgroundClip: "text",
            color: "transparent",
            marginTop: 6,
          }}
        >
          WET OLYMPICS
        </div>
        <div
          style={{
            fontSize: 36,
            marginTop: 18,
            color: "#b3f0fa",
            display: "flex",
          }}
        >
          5 games · 1 night · Real prizes
        </div>
        <div
          style={{
            fontSize: 24,
            marginTop: 12,
            color: "#7fe1f0",
            opacity: 0.8,
            display: "flex",
          }}
        >
          Wet Party Hostel · Haad Rin · Koh Phangan
        </div>
      </div>
    ),
    { ...size },
  );
}
