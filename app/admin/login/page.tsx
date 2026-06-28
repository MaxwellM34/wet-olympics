"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ user, pass }),
      });
      if (!res.ok) {
        setErr("Wrong username or password");
        return;
      }
      router.push("/admin");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-[70vh] grid place-items-center">
      <form onSubmit={submit} className="glass p-8 w-full max-w-sm space-y-4">
        <h1 className="font-display text-3xl font-black text-shimmer text-center">
          ADMIN
        </h1>
        <p className="text-xs text-wet-200/70 text-center">
          Host login. Manage teams, brackets, and times.
        </p>
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-wet-200/80">
            Username
          </label>
          <input
            className="input mt-1"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            autoFocus
            autoComplete="username"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-wet-200/80">
            Password
          </label>
          <input
            type="password"
            className="input mt-1"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        {err && (
          <p className="text-coral-400 text-sm bg-coral-500/10 border border-coral-500/30 rounded-lg p-2">
            {err}
          </p>
        )}
        <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
          {busy ? "…" : "Log in"}
        </button>
      </form>
    </div>
  );
}
