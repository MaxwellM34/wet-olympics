"use client";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Floating QR button — fixed bottom-right. Tap to open a fullscreen QR popup
 * pointing at the site root. ESC or background tap closes it.
 *
 * Available on every page via root layout.
 */
export default function QRFab() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") setUrl(window.location.origin);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Show QR code"
        className="fixed bottom-5 right-5 z-40 grid place-items-center w-16 h-16 rounded-2xl
                   bg-gradient-to-br from-neon-pink to-coral-500 text-white shadow-2xl
                   hover:scale-110 active:scale-95 transition-transform
                   ring-2 ring-white/30 hover:ring-white/60"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-8 h-8"
        >
          <path d="M3 3h7v7H3V3zm2 2v3h3V5H5zm9-2h7v7h-7V3zm2 2v3h3V5h-3zM3 14h7v7H3v-7zm2 2v3h3v-3H5zm14-2h2v2h-2v-2zm-5 0h3v3h-3v-3zm5 5h2v2h-2v-2zm-5 0h2v2h-2v-2zm3 0h2v5h-2v-5z" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 bg-wet-900/80 backdrop-blur-md grid place-items-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              className="glass-strong p-8 max-w-md w-full text-center"
              initial={{ scale: 0.85, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, y: 30 }}
              transition={{ type: "spring", damping: 20, stiffness: 220 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="font-display text-3xl font-black text-shimmer mb-2">
                JOIN THE OLYMPICS
              </h2>
              <p className="text-wet-100/70 text-sm mb-6">
                Scan to sign your team up · 100 ฿ per player
              </p>
              <div className="bg-white p-5 rounded-2xl inline-block shadow-xl">
                {url ? (
                  <QRCodeSVG value={url} size={260} level="M" includeMargin={false} />
                ) : (
                  <div className="w-[260px] h-[260px] grid place-items-center text-wet-700">
                    loading…
                  </div>
                )}
              </div>
              <p className="mt-5 text-xs text-wet-200/70 break-all">{url}</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn-ghost mt-6"
              >
                Close (esc)
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
