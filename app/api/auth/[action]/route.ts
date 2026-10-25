import { NextResponse } from "next/server";
import { loadState, readUsers, saveState, sql } from "../../../../lib/db";
import { endSession, sessionUser, setPassword, startSession, verifyPassword } from "../../../../lib/auth";

type RouteCtx = { params: Promise<{ action: string }> };

const reply = (data: unknown, status = 200) => NextResponse.json(data, { status });

// Simple brute-force protection: 5 wrong passwords lock that user for 10 minutes.
const attempts = new Map<string, { count: number; lockedUntil: number }>();

export async function GET(_req: Request, { params }: RouteCtx) {
  const { action } = await params;

  if (action === "session") {
    const u = await sessionUser();
    return reply({
      user: u ? { id: u.id, name: u.name, role: u.role } : null,
      setupNeeded: !loadState(),
    });
  }

  if (action === "users") {
    // Names are listed on the login page so people can pick their account.
    return reply({ users: readUsers().filter((u) => u.active).map((u) => ({ id: u.id, name: u.name, role: u.role })) });
  }

  return reply({ error: "Not found." }, 404);
}

export async function POST(req: Request, { params }: RouteCtx) {
  const { action } = await params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;

  /* ---- first run: create the database and the Super Admin password ---- */
  if (action === "setup") {
    if (loadState()) return reply({ error: "Setup is already complete." }, 409);
    const password = String(body?.password ?? "");
    const state = body?.state as { users?: { id: string; role: string }[]; products?: unknown[]; ledger?: unknown[] } | undefined;
    if (password.length < 8) return reply({ error: "Password must be at least 8 characters." }, 400);
    const admin = state?.users?.find((u) => u.role === "Super Admin");
    if (!state || !admin || !Array.isArray(state.products) || !Array.isArray(state.ledger)) {
      return reply({ error: "Invalid initial data." }, 400);
    }
    if (saveState(JSON.stringify(state), null) === null) return reply({ error: "Setup failed." }, 409);
    setPassword(admin.id, password);
    await startSession(admin.id);
    return reply({ ok: true });
  }

  /* ---- login ---- */
  if (action === "login") {
    const userId = String(body?.userId ?? "");
    const password = String(body?.password ?? "");
    const lock = attempts.get(userId);
    if (lock && lock.lockedUntil > Date.now()) {
      return reply({ error: "Too many failed attempts. Try again in a few minutes." }, 429);
    }
    const user = readUsers().find((u) => u.id === userId && u.active);
    const cred = sql.prepare("SELECT password_hash FROM credentials WHERE user_id = ?").get(userId) as
      | { password_hash: string }
      | undefined;
    if (!user || !cred || !verifyPassword(password, cred.password_hash)) {
      const n = (lock?.count ?? 0) + 1;
      attempts.set(userId, { count: n, lockedUntil: n >= 5 ? Date.now() + 10 * 60000 : 0 });
      return reply({ error: "Wrong user or password." }, 401);
    }
    attempts.delete(userId);
    await startSession(user.id);
    return reply({ user: { id: user.id, name: user.name, role: user.role } });
  }

  /* ---- logout ---- */
  if (action === "logout") {
    await endSession();
    return reply({ ok: true });
  }

  /* ---- Super Admin sets or resets any user's password ---- */
  if (action === "password") {
    const me = await sessionUser();
    if (!me || me.role !== "Super Admin") return reply({ error: "Only the Super Admin can set passwords." }, 403);
    const userId = String(body?.userId ?? "");
    const password = String(body?.password ?? "");
    if (password.length < 8) return reply({ error: "Password must be at least 8 characters." }, 400);
    if (!readUsers().some((u) => u.id === userId)) return reply({ error: "User not found." }, 404);
    setPassword(userId, password);
    return reply({ ok: true });
  }

  return reply({ error: "Not found." }, 404);
}