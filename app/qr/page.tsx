"use client";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

export default function QRPage() {
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") setUrl(window.location.origin);
  }, []);

  return (
    <div className="min-h-[80vh] grid place-items-center text-center">
      <div className="space-y-6">
        <h1 className="font-display text-4xl sm:text-6xl font-black text-shimmer">
          SCAN TO JOIN
        </h1>
        <p className="text-wet-100/80 text-lg">Wet Olympics · Full Moon · Haad Rin</p>
        <div className="bg-white p-6 rounded-3xl inline-block shadow-2xl">
          {url ? (
            <QRCodeSVG value={url} size={360} level="M" includeMargin={false} />
          ) : (
            <div className="w-[360px] h-[360px] grid place-items-center text-wet-700">
              loading…
            </div>
          )}
        </div>
        <p className="text-xs text-wet-200/70 break-all max-w-xs mx-auto">{url}</p>
        <p className="text-sm text-wet-200/60">
          5 games · 100 ฿ per player · prizes for winners
        </p>
      </div>
    </div>
  );
}
