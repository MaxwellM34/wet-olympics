"use client";
import { useEffect, useState } from "react";

interface Bubble {
  id: number;
  left: number; // 0–100 (%)
  size: number; // px
  delay: number; // seconds
  duration: number; // seconds
}

interface Drip {
  id: number;
  left: number;
  delay: number;
  duration: number;
  height: number;
}

/**
 * Always-on wet-party background:
 *   - Radial-gradient color blobs (CSS only via .wet-bg)
 *   - Animated bubble particles drifting up
 *   - Corner drips
 *   - Bottom wave SVG that scrolls horizontally
 *
 * Particles are seeded deterministically per render but only on the client,
 * so SSR + hydration stay consistent.
 */
export default function WetBackground() {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [drips, setDrips] = useState<Drip[]>([]);

  useEffect(() => {
    setBubbles(
      Array.from({ length: 22 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 6 + Math.random() * 30,
        delay: Math.random() * 12,
        duration: 8 + Math.random() * 12,
      })),
    );
    setDrips(
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 7,
        duration: 4 + Math.random() * 5,
        height: 60 + Math.random() * 200,
      })),
    );
  }, []);

  return (
    <>
      <div className="wet-bg" aria-hidden />
      <div className="corner-drips" aria-hidden>
        {drips.map((d) => (
          <span
            key={d.id}
            className="drip"
            style={{
              left: `${d.left}%`,
              height: `${d.height}px`,
              animationDelay: `${d.delay}s`,
              animationDuration: `${d.duration}s`,
            }}
          />
        ))}
      </div>
      <div className="corner-drips" aria-hidden>
        {bubbles.map((b) => (
          <span
            key={b.id}
            className="bubble"
            style={{
              left: `${b.left}%`,
              width: `${b.size}px`,
              height: `${b.size}px`,
              animationDelay: `${b.delay}s`,
              animationDuration: `${b.duration}s`,
            }}
          />
        ))}
      </div>
      <svg
        className="wave-svg"
        viewBox="0 0 1440 200"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#11afc7" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#ff3edf" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#11afc7" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        <path
          fill="url(#waveGrad)"
          d="M0,80 C240,140 480,20 720,80 C960,140 1200,20 1440,80 L1440,200 L0,200 Z"
        />
        <path
          fill="url(#waveGrad)"
          opacity="0.5"
          d="M0,120 C240,180 480,60 720,120 C960,180 1200,60 1440,120 L1440,200 L0,200 Z"
        />
      </svg>
    </>
  );
}
