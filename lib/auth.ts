import crypto from "node:crypto";
import { cookies } from "next/headers";
import { readUsers, sql } from "./db";

const COOKIE = "pids_session";
const SESSION_DAYS = 7;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = crypto.scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
  return crypto.timingSafeEqual(actual, expected);
}

export function setPassword(userId: string, password: string) {
  sql
    .prepare(
      "INSERT INTO credentials (user_id, password_hash) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET password_hash = excluded.password_hash"
    )
    .run(userId, hashPassword(password));
  // Changing a password signs the user out everywhere.
  sql.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
}

export async function startSession(userId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = Date.now() + SESSION_DAYS * 86400000;
  sql.prepare("DELETE FROM sessions WHERE expires_at < ?").run(Date.now());
  sql.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)").run(token, userId, expires);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });
}

export async function endSession() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) sql.prepare("DELETE FROM sessions WHERE token = ?").run(token);
  store.delete(COOKIE);
}

/** Returns the signed-in, still-active user, or null. */
export async function sessionUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const row = sql.prepare("SELECT user_id, expires_at FROM sessions WHERE token = ?").get(token) as
    | { user_id: string; expires_at: number }
    | undefined;
  if (!row || row.expires_at < Date.now()) return null;
  return readUsers().find((u) => u.id === row.user_id && u.active) ?? null;
}