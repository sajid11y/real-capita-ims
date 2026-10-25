"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Boxes, Loader2, Lock } from "lucide-react";
import { btnPrimary, inputCls, normalizeDb, seedDb } from "./InventoryManagement";
import type { Db } from "./InventoryManagement";

export type Session = { id: string; name: string; role: string };
export type Initial = { state: Db; version: number };

type Phase =
  | { kind: "loading" }
  | { kind: "setup" }
  | { kind: "login"; users: Session[] }
  | { kind: "ready"; session: Session; initial: Initial }
  | { kind: "error"; message: string };

async function post(url: string, body: unknown) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

export default function AuthGate({
  children,
}: {
  children: (session: Session, initial: Initial, logout: () => void) => ReactNode;
}) {
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const load = useCallback(async () => {
    try {
      const s = await (await fetch("/api/auth/session", { cache: "no-store" })).json();
      if (s.setupNeeded) {
        setPhase({ kind: "setup" });
        return;
      }
      if (!s.user) {
        const u = await (await fetch("/api/auth/users", { cache: "no-store" })).json();
        const users: Session[] = u.users ?? [];
        setUserId((cur) => cur || users[0]?.id || "");
        setPhase({ kind: "login", users });
        return;
      }
      const res = await fetch("/api/db", { cache: "no-store" });
      if (!res.ok) {
        setPhase({ kind: "error", message: "Could not load data from the server." });
        return;
      }
      const d = await res.json();
      const state = normalizeDb(d.state);
      if (!state) {
        setPhase({ kind: "error", message: "Saved data is invalid." });
        return;
      }
      setPhase({ kind: "ready", session: s.user, initial: { state, version: d.version } });
    } catch {
      setPhase({ kind: "error", message: "The server is not reachable. Is npm run dev running?" });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function submitSetup(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("The two passwords do not match.");
    setBusy(true);
    const r = await post("/api/auth/setup", { password, state: seedDb() });
    setBusy(false);
    if (!r.ok) return setError(r.data.error ?? "Setup failed.");
    setPassword("");
    setConfirm("");
    await load();
  }

  async function submitLogin(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const r = await post("/api/auth/login", { userId, password });
    setBusy(false);
    if (!r.ok) return setError(r.data.error ?? "Sign in failed.");
    setPassword("");
    await load();
  }

  const logout = useCallback(async () => {
    await post("/api/auth/logout", {});
    setPhase({ kind: "loading" });
    await load();
  }, [load]);

  if (phase.kind === "ready") return <div key={phase.session.id}>{children(phase.session, phase.initial, () => void logout())}</div>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50 p-4">
      <style>{`@keyframes pidsIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
      <div className="w-full max-w-md animate-[pidsIn_0.4s_ease-out] rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-200">
            <Boxes size={26} />
          </div>
          <div>
            <p className="text-lg font-extrabold tracking-tight text-slate-900">REAL CAPITA</p>
            <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500">PRODUCT INVENTORY & DISTRIBUTION</p>
          </div>
        </div>

        {phase.kind === "loading" && (
          <div className="flex items-center gap-2 py-10 text-sm text-slate-500"><Loader2 size={18} className="animate-spin" /> Loading...</div>
        )}

        {phase.kind === "error" && (
          <div className="space-y-4">
            <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{phase.message}</p>
            <button className={btnPrimary} onClick={() => { setPhase({ kind: "loading" }); void load(); }}>Try again</button>
          </div>
        )}

        {phase.kind === "setup" && (
          <form onSubmit={submitSetup} className="space-y-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900">First-time setup</h1>
              <p className="mt-1 text-sm text-slate-500">Create the password for the Super Admin account (MD). It starts with sample data you can edit later.</p>
            </div>
            <input type="password" className={inputCls} placeholder="New password (min 8 characters)" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
            <input type="password" className={inputCls} placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            {error && <p role="alert" className="text-sm font-medium text-rose-600">{error}</p>}
            <button className={`${btnPrimary} w-full`} type="submit" disabled={busy}><Lock size={16} /> {busy ? "Creating..." : "Create Super Admin"}</button>
          </form>
        )}

        {phase.kind === "login" && (
          <form onSubmit={submitLogin} className="space-y-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Sign in</h1>
              <p className="mt-1 text-sm text-slate-500">Choose your account and enter your password.</p>
            </div>
            <select className={inputCls} value={userId} onChange={(e) => setUserId(e.target.value)}>
              {phase.users.map((u) => <option key={u.id} value={u.id}>{u.name} — {u.role}</option>)}
            </select>
            <input type="password" className={inputCls} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
            {error && <p role="alert" className="text-sm font-medium text-rose-600">{error}</p>}
            <button className={`${btnPrimary} w-full`} type="submit" disabled={busy || !userId}><Lock size={16} /> {busy ? "Signing in..." : "Sign in"}</button>
          </form>
        )}
      </div>
    </div>
  );
}