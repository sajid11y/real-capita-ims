import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const dir = path.join(process.cwd(), "data");
fs.mkdirSync(dir, { recursive: true });

// Keep one connection alive across hot reloads in development.
const g = globalThis as unknown as { __pidsDb?: Database.Database };

export const sql: Database.Database = g.__pidsDb ?? new Database(path.join(dir, "pids.sqlite"));

if (!g.__pidsDb) {
  sql.pragma("journal_mode = WAL");
  sql.exec(`
    CREATE TABLE IF NOT EXISTS app_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      json TEXT NOT NULL,
      version INTEGER NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS credentials (
      user_id TEXT PRIMARY KEY,
      password_hash TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    );
  `);
  g.__pidsDb = sql;
}

export type StoredUser = { id: string; name: string; role: string; active: boolean };

export function loadState(): { json: string; version: number } | null {
  const row = sql.prepare("SELECT json, version FROM app_state WHERE id = 1").get() as
    | { json: string; version: number }
    | undefined;
  return row ?? null;
}

/**
 * Saves the whole app state. Returns the new version, or null when the
 * caller's version is stale (somebody else saved first).
 */
export function saveState(json: string, expectedVersion: number | null): number | null {
  const tx = sql.transaction((): number | null => {
    const row = sql.prepare("SELECT version FROM app_state WHERE id = 1").get() as { version: number } | undefined;
    const now = new Date().toISOString();
    if (!row) {
      if (expectedVersion !== null) return null;
      sql.prepare("INSERT INTO app_state (id, json, version, updated_at) VALUES (1, ?, 1, ?)").run(json, now);
      return 1;
    }
    if (expectedVersion !== row.version) return null;
    const next = row.version + 1;
    sql.prepare("UPDATE app_state SET json = ?, version = ?, updated_at = ? WHERE id = 1").run(json, next, now);
    return next;
  });
  return tx();
}

export function readUsers(): StoredUser[] {
  const s = loadState();
  if (!s) return [];
  try {
    const parsed = JSON.parse(s.json) as { users?: StoredUser[] };
    return Array.isArray(parsed.users) ? parsed.users : [];
  } catch {
    return [];
  }
}