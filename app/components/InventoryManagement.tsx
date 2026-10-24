"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  BarChart3,
  ClipboardList,
  Download,
  Eye,
  History,
  Package,
  Plus,
  RotateCcw,
  Search,
  Truck,
  Undo2,
  X,
  Activity,
} from "lucide-react";
import ImageUpload, { openAttachment } from "./ImageUpload";

/* =========================================================
   TYPES
========================================================= */

export type Role = "Super Admin" | "Sub Admin" | "Manager" | "Receptionist";
export const ROLES: Role[] = ["Super Admin", "Sub Admin", "Manager", "Receptionist"];
export const RANK: Record<Role, number> = { "Super Admin": 0, "Sub Admin": 1, Manager: 2, Receptionist: 3 };

export const PERMS = [
  ["product.manage", "Manage products"],
  ["stock.receive", "Receive stock"],
  ["stock.issue", "Distribute products"],
  ["stock.adjust", "Adjust / damage / loss"],
  ["return.manage", "Handle returns"],
  ["vendor.manage", "Manage vendors"],
  ["employee.manage", "Manage employees"],
  ["company.manage", "Manage companies"],
  ["asset.manage", "Manage assets"],
  ["achievement.manage", "Manage achievements"],
  ["approve", "Approve requests"],
  ["report.view", "View reports"],
  ["user.manage", "Manage users"],
  ["audit.view", "View audit log"],
] as const;
export type Perm = (typeof PERMS)[number][0] | "backup";

export type ActiveState = "Active" | "Inactive";
export type OfficeCategory = "Corporate Office" | "Sales Office" | "Warehouse" | "Other";

export type AppUser = {
  id: string;
  name: string;
  role: Role;
  employeeId: string;
  active: boolean;
  backupAccess: boolean;
  createdBy: string;
  createdAt: string;
};

export type Company = {
  id: string;
  name: string;
  code: string;
  type: string;
  officeCategory: OfficeCategory;
  location: string;
  address: string;
  phone: string;
  email: string;
  manager: string;
  status: ActiveState;
  logo: string;
  createdAt: string;
  updatedAt: string;
};

export type Department = {
  id: string;
  companyId: string;
  code: string;
  name: string;
  head: string;
  status: ActiveState;
};

export type Transfer = {
  date: string;
  fromCompanyId: string;
  fromDeptId: string;
  toCompanyId: string;
  toDeptId: string;
  by: string;
  note: string;
};

export type Employee = {
  id: string;
  empId: string;
  name: string;
  companyId: string;
  departmentId: string;
  designation: string;
  joiningDate: string;
  phone: string;
  email: string;
  photo: string;
  status: "Active" | "Inactive" | "Left";
  leftDate: string;
  clearanceNote: string;
  transfers: Transfer[];
};

export type Vendor = {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  status: ActiveState;
};

export type ItemType = "Consumable" | "Reusable Asset";
export type Audience = "General" | "Employee" | "Client" | "Guest" | "Event";

export type Product = {
  id: string;
  code: string;
  name: string;
  category: string;
  itemType: ItemType;
  intendedFor: Audience;
  baseUnit: string;
  packUnit: string;
  packSize: number;
  unitWeightKg: number;
  minStock: number;
  unitCost: number;
  vendorId: string;
  location: string;
  image: string;
  status: ActiveState;
  createdAt: string;
};

export type ReceiptLine = { productId: string; qty: number; unitPrice: number };
export type Receipt = {
  id: string;
  no: string;
  date: string;
  vendorId: string;
  invoiceNo: string;
  challanNo: string;
  challanImage: string;
  receivedBy: string;
  destination: string;
  notes: string;
  lines: ReceiptLine[];
  status: "Pending Approval" | "Received" | "Rejected";
  createdBy: string;
};

export type RecipientType = "Employee" | "Department" | "Client" | "Guest" | "Other";
export type Usage = "Personal" | "Office" | "Gift";
export type IssueLine = { productId: string; qty: number; unitCost: number; returnedQty: number; lostQty: number };
export type IssueStatus = "Pending Approval" | "Awaiting Acknowledgement" | "Completed" | "Rejected" | "Reversed";
export type Issue = {
  id: string;
  no: string;
  date: string;
  recipientType: RecipientType;
  usage: Usage;
  employeeId: string;
  departmentId: string;
  recipientName: string;
  recipientOrg: string;
  event: string;
  purpose: string;
  lines: IssueLine[];
  issuedBy: string;
  handover: "Direct" | "Intermediary";
  intermediary: string;
  notes: string;
  status: IssueStatus;
  pin: string;
  ackAt: string;
  ackBy: string;
  createdBy: string;
};

export type Alloc = { issueId: string; idx: number; qty: number };
export type ReturnLine = { productId: string; qty: number; condition: string; alloc: Alloc[] };
export type ReturnStatus =
  | "Pending Approval"
  | "Pending Inspection"
  | "Completed"
  | "Returned to Vendor"
  | "Credited"
  | "Rejected";
export type ReturnDoc = {
  id: string;
  no: string;
  date: string;
  source: "Employee" | "Vendor";
  employeeId: string;
  vendorId: string;
  receiptId: string;
  lines: ReturnLine[];
  reason: string;
  receivedBy: string;
  notes: string;
  status: ReturnStatus;
  creditAmount: number;
  inspection: string;
  createdBy: string;
};

export type AdjKind = "Increase" | "Decrease" | "Damage" | "Loss";
export type Adjustment = {
  id: string;
  no: string;
  date: string;
  productId: string;
  kind: AdjKind;
  qty: number;
  reason: string;
  by: string;
  status: "Pending Approval" | "Applied" | "Rejected";
};

export type Damage = {
  id: string;
  date: string;
  productId: string;
  qty: number;
  kind: "Damage" | "Loss";
  source: "Stock" | "Employee Return" | "Employee Loss";
  employeeId: string;
  reference: string;
  reason: string;
  by: string;
  value: number;
};

export type AssetStatus = "In Store" | "Assigned" | "Under Repair" | "Disposed" | "Lost";
export type Asset = {
  id: string;
  tag: string;
  name: string;
  category: string;
  serial: string;
  vendorId: string;
  companyId: string;
  purchaseDate: string;
  warrantyUntil: string;
  cost: number;
  condition: string;
  status: AssetStatus;
  holderType: "None" | "Employee" | "Department";
  employeeId: string;
  departmentId: string;
  image: string;
  notes: string;
  history: { date: string; action: string; by: string; note: string; employeeId: string }[];
};

export type ApprovalKind = "receipt" | "issue" | "adjustment" | "vendorReturn" | "userDeactivate";
export type Approval = {
  id: string;
  kind: ApprovalKind;
  refId: string;
  title: string;
  detail: string;
  requestedBy: string;
  requestedByName: string;
  requestedAt: string;
  status: "Pending" | "Approved" | "Rejected";
  decidedBy: string;
  decidedAt: string;
  comment: string;
};

export type AuditEntry = {
  id: string;
  at: string;
  userId: string;
  userName: string;
  role: string;
  module: string;
  action: string;
  detail: string;
};

export type Achievement = {
  id: string;
  title: string;
  category: string;
  date: string;
  companyId: string;
  outcome: string;
  metric: string;
  notes: string;
  image: string;
  createdBy: string;
};

export type LedgerType =
  | "Opening"
  | "Receive"
  | "Issue"
  | "Employee Return"
  | "Vendor Return"
  | "Adjustment"
  | "Damage"
  | "Loss"
  | "Reversal";

export type LedgerEntry = {
  id: string;
  at: string;
  date: string;
  productId: string;
  type: LedgerType;
  qty: number;
  ref: string;
  party: string;
  by: string;
  note: string;
};

export type Settings = {
  approvals: Record<ApprovalKind, boolean>;
  deadStockDays: number;
  backupReminderDays: number;
  lastBackupAt: string;
};

export type Db = {
  users: AppUser[];
  perms: Record<Role, Perm[]>;
  companies: Company[];
  departments: Department[];
  employees: Employee[];
  vendors: Vendor[];
  products: Product[];
  receipts: Receipt[];
  issues: Issue[];
  returns: ReturnDoc[];
  adjustments: Adjustment[];
  damages: Damage[];
  assets: Asset[];
  ledger: LedgerEntry[];
  approvals: Approval[];
  audit: AuditEntry[];
  achievements: Achievement[];
  counters: Record<string, number>;
  settings: Settings;
};

export type Result = { db: Db; error?: string; message?: string };

export type Ctx = {
  db: Db;
  user: AppUser;
  stock: Record<string, number>;
  can: (p: Perm) => boolean;
  run: (fn: (d: Db) => Result, audit?: { module: string; action: string; detail: string }) => boolean;
  notify: (msg: string, tone?: "ok" | "error") => void;
};

/* =========================================================
   GENERIC HELPERS
========================================================= */

const EPS = 0.0005;
export const DB_KEY = "pids-db-v1";
export const USER_KEY = "pids-current-user-v1";

export const pad = (n: number) => String(n).padStart(2, "0");
export const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
export const nowIso = () => new Date().toISOString();
export const makeId = (prefix = "id") =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
export const num = (v: string | number) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
export const round3 = (n: number) => Math.round(n * 1000) / 1000;
export const money = (n: number) => `৳${n.toLocaleString("en-BD", { maximumFractionDigits: 2 })}`;
export const fail = (db: Db, error: string): Result => ({ db, error });

export function upd<T extends { id: string }>(arr: T[], id: string, patch: Partial<T>): T[] {
  return arr.map((x) => (x.id === id ? { ...x, ...patch } : x));
}

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\r\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function withNo(db: Db, prefix: string): { db: Db; no: string } {
  const n = (db.counters[prefix] ?? 0) + 1;
  return {
    db: { ...db, counters: { ...db.counters, [prefix]: n } },
    no: `${prefix}-${new Date().getFullYear()}-${String(n).padStart(4, "0")}`,
  };
}

function led(
  productId: string,
  type: LedgerType,
  qty: number,
  ref: string,
  party: string,
  by: string,
  note: string,
  date = todayStr()
): LedgerEntry {
  return { id: makeId("l"), at: nowIso(), date, productId, type, qty, ref, party, by, note };
}

export function stockMap(ledger: LedgerEntry[]): Record<string, number> {
  const m: Record<string, number> = {};
  for (const e of ledger) m[e.productId] = round3((m[e.productId] ?? 0) + e.qty);
  return m;
}

export const pname = (db: Db, id: string) => db.products.find((p) => p.id === id)?.name ?? "Unknown product";

export function packText(p: Product, qty: number) {
  if (!p.packSize || p.packSize <= 0) return `${qty} ${p.baseUnit}`;
  const packs = Math.floor(qty / p.packSize + EPS);
  const loose = round3(qty - packs * p.packSize);
  return `${qty} ${p.baseUnit} (${packs} ${p.packUnit}${loose ? ` + ${loose} loose` : ""})`;
}

export const weightOf = (p: Product, qty: number) => (p.unitWeightKg > 0 ? Math.round(qty * p.unitWeightKg * 100) / 100 : 0);

export function recipientLabel(db: Db, i: Issue): string {
  const e = db.employees.find((x) => x.id === i.employeeId);
  const d = db.departments.find((x) => x.id === i.departmentId);
  if (i.recipientType === "Employee") return e ? `${e.name} (${e.empId})` : "Unknown employee";
  if (i.recipientType === "Department") return `${d?.name ?? "Unknown department"}${e ? ` · custodian ${e.name}` : ""}`;
  return `${i.recipientName}${i.recipientOrg ? ` (${i.recipientOrg})` : ""}`;
}

export function lowStock(db: Db, stock: Record<string, number>) {
  return db.products.filter((p) => p.status === "Active" && (stock[p.id] ?? 0) <= p.minStock);
}

export function deadStock(db: Db, stock: Record<string, number>) {
  const limit = db.settings.deadStockDays;
  const now = Date.now();
  return db.products
    .filter((p) => p.status === "Active" && (stock[p.id] ?? 0) > 0)
    .map((p) => {
      const entries = db.ledger.filter((e) => e.productId === p.id);
      const lastIssue = entries.filter((e) => e.type === "Issue").reduce((m, e) => (e.date > m ? e.date : m), "");
      const first = entries.reduce((m, e) => (!m || e.date < m ? e.date : m), "") || p.createdAt;
      const ref = lastIssue || first;
      const days = Math.floor((now - new Date(`${ref}T00:00:00`).getTime()) / 86400000);
      return { product: p, days, lastIssue };
    })
    .filter((x) => x.days >= limit);
}

/** Open (not returned / lost) issue lines held by an employee. */
export function employeePossession(db: Db, employeeId: string) {
  const rows: { issue: Issue; idx: number; line: IssueLine; product?: Product; open: number }[] = [];
  db.issues
    .filter((i) => i.employeeId === employeeId && (i.status === "Awaiting Acknowledgement" || i.status === "Completed"))
    .forEach((issue) =>
      issue.lines.forEach((line, idx) => {
        const open = round3(line.qty - line.returnedQty - line.lostQty);
        if (open > EPS) rows.push({ issue, idx, line, product: db.products.find((p) => p.id === line.productId), open });
      })
    );
  return rows;
}

function vendorReturnValue(db: Db, r: ReturnDoc) {
  const receipt = db.receipts.find((x) => x.id === r.receiptId);
  return r.lines.reduce((s, l) => s + l.qty * (receipt?.lines.find((x) => x.productId === l.productId)?.unitPrice ?? 0), 0);
}

export function vendorStats(db: Db, vendorId: string) {
  const rec = db.receipts.filter((r) => r.vendorId === vendorId && r.status === "Received");
  const rows = new Map<string, { qty: number; value: number; last: number; returned: number }>();
  rec.forEach((r) =>
    r.lines.forEach((l) => {
      const x = rows.get(l.productId) ?? { qty: 0, value: 0, last: 0, returned: 0 };
      x.qty += l.qty;
      x.value += l.qty * l.unitPrice;
      x.last = x.last || l.unitPrice;
      rows.set(l.productId, x);
    })
  );
  let returnedValue = 0;
  let credited = 0;
  db.returns
    .filter((r) => r.source === "Vendor" && r.vendorId === vendorId && (r.status === "Returned to Vendor" || r.status === "Credited"))
    .forEach((r) => {
      returnedValue += vendorReturnValue(db, r);
      credited += r.creditAmount;
      r.lines.forEach((l) => {
        const x = rows.get(l.productId);
        if (x) x.returned += l.qty;
      });
    });
  const purchased = rec.reduce((s, r) => s + r.lines.reduce((a, l) => a + l.qty * l.unitPrice, 0), 0);
  return { receipts: rec.length, purchased, returnedValue, credited, rows };
}

/* =========================================================
   SEED DATA + NORMALISATION
========================================================= */

const ALL_PERMS = PERMS.map((p) => p[0]) as Perm[];

export const DEFAULT_PERMS: Record<Role, Perm[]> = {
  "Super Admin": ALL_PERMS,
  "Sub Admin": ALL_PERMS,
  Manager: [
    "product.manage", "stock.receive", "stock.issue", "stock.adjust", "return.manage",
    "vendor.manage", "employee.manage", "asset.manage", "report.view",
  ],
  Receptionist: ["stock.receive", "stock.issue", "return.manage", "report.view"],
};

export function seedDb(): Db {
  const d = todayStr();
  const base = { createdAt: d, updatedAt: d, phone: "", email: "", manager: "", logo: "" };
  const pBase = {
    intendedFor: "General" as Audience,
    packUnit: "Carton",
    packSize: 0,
    unitWeightKg: 0,
    vendorId: "",
    image: "",
    status: "Active" as ActiveState,
    createdAt: d,
  };
  const products: Product[] = [
    { ...pBase, id: "p-1", code: "ST-001", name: "A4 Paper", category: "Stationery", itemType: "Consumable", baseUnit: "Ream", packSize: 5, unitWeightKg: 2.5, minStock: 10, unitCost: 350, vendorId: "v-1", location: "Main Store" },
    { ...pBase, id: "p-2", code: "IT-001", name: "Office Laptop", category: "IT Equipment", itemType: "Reusable Asset", baseUnit: "Piece", minStock: 2, unitCost: 65000, vendorId: "v-2", location: "IT Store" },
    { ...pBase, id: "p-3", code: "GF-001", name: "Corporate Mug", category: "Gift Items", itemType: "Consumable", intendedFor: "Guest", baseUnit: "Piece", packSize: 24, unitWeightKg: 0.35, minStock: 25, unitCost: 180, vendorId: "v-1", location: "Main Store" },
  ];
  const openQty: Record<string, number> = { "p-1": 50, "p-2": 5, "p-3": 12 };
  return {
    users: [
      { id: "u-1", name: "MD / Super Admin", role: "Super Admin", employeeId: "", active: true, backupAccess: true, createdBy: "System", createdAt: d },
      { id: "u-2", name: "Sub Admin (Demo)", role: "Sub Admin", employeeId: "", active: true, backupAccess: false, createdBy: "MD / Super Admin", createdAt: d },
      { id: "u-3", name: "Manager (Demo)", role: "Manager", employeeId: "", active: true, backupAccess: false, createdBy: "MD / Super Admin", createdAt: d },
      { id: "u-4", name: "Receptionist (Demo)", role: "Receptionist", employeeId: "", active: true, backupAccess: false, createdBy: "MD / Super Admin", createdAt: d },
    ],
    perms: DEFAULT_PERMS,
    companies: [
      { ...base, id: "c-1", name: "RC Property Development Limited", code: "RCPD", type: "Property Development", officeCategory: "Corporate Office", location: "Gulshan, Dhaka", address: "Gulshan, Dhaka, Bangladesh", status: "Active" },
      { ...base, id: "c-2", name: "RC Holdings Limited", code: "RCHL", type: "Holdings", officeCategory: "Corporate Office", location: "Dhaka", address: "Dhaka, Bangladesh", status: "Active" },
      { ...base, id: "c-3", name: "RC Maya Kanon", code: "RCMK", type: "Property Development", officeCategory: "Sales Office", location: "Dhaka", address: "Dhaka, Bangladesh", status: "Active" },
      { ...base, id: "c-4", name: "RC Rivery Village", code: "RCRV", type: "Property Development", officeCategory: "Sales Office", location: "Dhaka", address: "Dhaka, Bangladesh", status: "Inactive" },
    ],
    departments: [
      { id: "d-1", companyId: "c-1", code: "RCPD-ADM", name: "Administration", head: "", status: "Active" },
      { id: "d-2", companyId: "c-1", code: "RCPD-AF", name: "Accounts & Finance", head: "", status: "Active" },
      { id: "d-3", companyId: "c-2", code: "RCHL-HR", name: "Human Resources", head: "", status: "Active" },
    ],
    employees: [
      { id: "e-1", empId: "EMP-001", name: "Demo Employee", companyId: "c-1", departmentId: "d-1", designation: "Executive", joiningDate: d, phone: "", email: "", photo: "", status: "Active", leftDate: "", clearanceNote: "", transfers: [] },
    ],
    vendors: [
      { id: "v-1", name: "Sample Stationery Ltd.", contact: "", phone: "", email: "", address: "", notes: "", status: "Active" },
      { id: "v-2", name: "Demo Technology Ltd.", contact: "", phone: "", email: "", address: "", notes: "", status: "Active" },
    ],
    products,
    receipts: [],
    issues: [],
    returns: [],
    adjustments: [],
    damages: [],
    assets: [],
    ledger: products.map((p) => led(p.id, "Opening", openQty[p.id], `OPEN-${p.code}`, "Opening stock", "System", "Initial opening balance", d)),
    approvals: [],
    audit: [],
    achievements: [],
    counters: {},
    settings: {
      approvals: { receipt: false, issue: true, adjustment: true, vendorReturn: true, userDeactivate: true },
      deadStockDays: 60,
      backupReminderDays: 7,
      lastBackupAt: "",
    },
  };
}

function arr<T>(v: T[] | undefined): T[] {
  return Array.isArray(v) ? v : [];
}

export function normalizeDb(raw: unknown): Db | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<Db>;
  const users = arr(r.users);
  if (!users.length || !Array.isArray(r.products) || !Array.isArray(r.ledger)) return null;
  const base = seedDb();
  return {
    users,
    perms: { ...base.perms, ...(r.perms ?? {}) },
    companies: arr(r.companies),
    departments: arr(r.departments),
    employees: arr(r.employees),
    vendors: arr(r.vendors),
    products: arr(r.products),
    receipts: arr(r.receipts),
    issues: arr(r.issues),
    returns: arr(r.returns),
    adjustments: arr(r.adjustments),
    damages: arr(r.damages),
    assets: arr(r.assets),
    ledger: arr(r.ledger),
    approvals: arr(r.approvals),
    audit: arr(r.audit),
    achievements: arr(r.achievements),
    counters: r.counters ?? {},
    settings: {
      ...base.settings,
      ...(r.settings ?? {}),
      approvals: { ...base.settings.approvals, ...(r.settings?.approvals ?? {}) },
    },
  };
}

/* =========================================================
   BUSINESS LOGIC (pure functions: Db in, Result out)
========================================================= */

function finalizeReceipt(db: Db, id: string): Result {
  const r = db.receipts.find((x) => x.id === id);
  if (!r) return fail(db, "Receipt not found.");
  if (r.status === "Received") return fail(db, "This receipt is already finalized.");
  const vendor = db.vendors.find((v) => v.id === r.vendorId)?.name ?? "Vendor";
  const entries = r.lines.map((l) =>
    led(l.productId, "Receive", l.qty, r.no, vendor, r.receivedBy, `Challan ${r.challanNo} / Invoice ${r.invoiceNo || "-"}`, r.date)
  );
  const products = db.products.map((p) => {
    const l = r.lines.find((x) => x.productId === p.id && x.unitPrice > 0);
    return l ? { ...p, unitCost: l.unitPrice } : p;
  });
  return {
    db: { ...db, products, receipts: upd(db.receipts, id, { status: "Received" }), ledger: [...db.ledger, ...entries] },
    message: `${r.no} received. Stock updated.`,
  };
}

function finalizeIssue(db: Db, id: string): Result {
  const i = db.issues.find((x) => x.id === id);
  if (!i) return fail(db, "Issue not found.");
  if (i.status !== "Pending Approval") return fail(db, "This issue is not waiting for approval.");
  const st = stockMap(db.ledger);
  for (const l of i.lines) {
    if (l.qty > (st[l.productId] ?? 0) + EPS) {
      return fail(db, `Insufficient stock for ${pname(db, l.productId)}. Available: ${st[l.productId] ?? 0}`);
    }
  }
  const label = recipientLabel(db, i);
  const entries = i.lines.map((l) => led(l.productId, "Issue", -l.qty, i.no, label, i.issuedBy, i.purpose || i.usage, i.date));
  const status: IssueStatus = i.employeeId ? "Awaiting Acknowledgement" : "Completed";
  return {
    db: { ...db, issues: upd(db.issues, id, { status }), ledger: [...db.ledger, ...entries] },
    message: i.employeeId ? `${i.no} issued. Waiting for the employee acknowledgement.` : `${i.no} issued.`,
  };
}

function finalizeAdjustment(db: Db, id: string): Result {
  const a = db.adjustments.find((x) => x.id === id);
  if (!a || a.status !== "Pending Approval") return fail(db, "Adjustment is not pending.");
  const p = db.products.find((x) => x.id === a.productId);
  if (!p) return fail(db, "Product not found.");
  const st = stockMap(db.ledger)[p.id] ?? 0;
  if (a.kind !== "Increase" && a.qty > st + EPS) return fail(db, "Cannot remove more than the available stock.");
  const type: LedgerType = a.kind === "Damage" ? "Damage" : a.kind === "Loss" ? "Loss" : "Adjustment";
  const signed = a.kind === "Increase" ? a.qty : -a.qty;
  const dmg: Damage[] =
    a.kind === "Damage" || a.kind === "Loss"
      ? [{ id: makeId("dm"), date: a.date, productId: p.id, qty: a.qty, kind: a.kind, source: "Stock", employeeId: "", reference: a.no, reason: a.reason, by: a.by, value: a.qty * p.unitCost }]
      : [];
  return {
    db: {
      ...db,
      adjustments: upd(db.adjustments, id, { status: "Applied" }),
      damages: [...db.damages, ...dmg],
      ledger: [...db.ledger, led(p.id, type, signed, a.no, a.kind, a.by, a.reason, a.date)],
    },
    message: `${a.no} applied.`,
  };
}

function finalizeVendorReturn(db: Db, id: string): Result {
  const r = db.returns.find((x) => x.id === id);
  if (!r || r.status !== "Pending Approval") return fail(db, "Vendor return is not pending.");
  const st = stockMap(db.ledger);
  for (const l of r.lines) {
    if (l.qty > (st[l.productId] ?? 0) + EPS) return fail(db, `Stock of ${pname(db, l.productId)} is lower than the return quantity.`);
  }
  const vendor = db.vendors.find((v) => v.id === r.vendorId)?.name ?? "Vendor";
  const entries = r.lines.map((l) => led(l.productId, "Vendor Return", -l.qty, r.no, vendor, r.receivedBy, `${l.condition}: ${r.reason}`, r.date));
  return {
    db: { ...db, returns: upd(db.returns, id, { status: "Returned to Vendor" }), ledger: [...db.ledger, ...entries] },
    message: `${r.no} returned to the vendor. Stock reduced.`,
  };
}

function finalizeUserDeactivate(db: Db, id: string): Result {
  const u = db.users.find((x) => x.id === id);
  if (!u) return fail(db, "User not found.");
  if (u.role === "Super Admin" && db.users.filter((x) => x.role === "Super Admin" && x.active).length <= 1) {
    return fail(db, "The last active Super Admin cannot be deactivated.");
  }
  return { db: { ...db, users: upd(db.users, id, { active: false }) }, message: `${u.name} deactivated. History is preserved.` };
}

const FINALIZERS: Record<ApprovalKind, (db: Db, id: string) => Result> = {
  receipt: finalizeReceipt,
  issue: finalizeIssue,
  adjustment: finalizeAdjustment,
  vendorReturn: finalizeVendorReturn,
  userDeactivate: finalizeUserDeactivate,
};

function rejectDoc(db: Db, ap: Approval): Db {
  switch (ap.kind) {
    case "receipt":
      return { ...db, receipts: upd(db.receipts, ap.refId, { status: "Rejected" }) };
    case "issue":
      return { ...db, issues: upd(db.issues, ap.refId, { status: "Rejected" }) };
    case "adjustment":
      return { ...db, adjustments: upd(db.adjustments, ap.refId, { status: "Rejected" }) };
    case "vendorReturn":
      return { ...db, returns: upd(db.returns, ap.refId, { status: "Rejected" }) };
    default:
      return db;
  }
}

/** Either finalizes immediately (Super Admin / no rule) or queues an approval request. */
export function routeApproval(db: Db, user: AppUser, kind: ApprovalKind, refId: string, title: string, detail: string): Result {
  if (user.role === "Super Admin" || !db.settings.approvals[kind]) return FINALIZERS[kind](db, refId);
  const ap: Approval = {
    id: makeId("ap"),
    kind,
    refId,
    title,
    detail,
    requestedBy: user.id,
    requestedByName: user.name,
    requestedAt: nowIso(),
    status: "Pending",
    decidedBy: "",
    decidedAt: "",
    comment: "",
  };
  return { db: { ...db, approvals: [ap, ...db.approvals] }, message: `${title} submitted for approval.` };
}

export function decideApproval(
  db: Db,
  id: string,
  decision: "Approved" | "Rejected",
  actor: AppUser,
  canApprove: boolean,
  comment: string
): Result {
  const ap = db.approvals.find((a) => a.id === id);
  if (!ap || ap.status !== "Pending") return fail(db, "This request is no longer pending.");
  if (!canApprove) return fail(db, "You do not have approval authority.");
  if (ap.requestedBy === actor.id) return fail(db, "You cannot decide your own request (separation of duties).");
  if (decision === "Rejected" && !comment.trim()) return fail(db, "Add a comment when rejecting a request.");
  let next = db;
  if (decision === "Approved") {
    const r = FINALIZERS[ap.kind](db, ap.refId);
    if (r.error) return r;
    next = r.db;
  } else {
    next = rejectDoc(db, ap);
  }
  return {
    db: { ...next, approvals: upd(next.approvals, id, { status: decision, decidedBy: actor.name, decidedAt: nowIso(), comment: comment.trim() }) },
    message: `Request ${decision.toLowerCase()}.`,
  };
}

export function createReceipt(
  db: Db,
  user: AppUser,
  f: { vendorId: string; date: string; invoiceNo: string; challanNo: string; challanImage: string; receivedBy: string; destination: string; notes: string; lines: ReceiptLine[] }
): Result {
  if (!f.vendorId) return fail(db, "Select a vendor.");
  if (!f.challanNo.trim()) return fail(db, "Challan number is required.");
  if (!f.receivedBy.trim()) return fail(db, "Enter who received the goods.");
  if (!f.lines.length || f.lines.some((l) => !l.productId || !(l.qty > 0))) return fail(db, "Add at least one product with a quantity above zero.");
  if (f.lines.some((l) => l.unitPrice < 0)) return fail(db, "Unit price cannot be negative.");
  if (new Set(f.lines.map((l) => l.productId)).size !== f.lines.length) return fail(db, "Each product can appear only once per receipt.");
  const dup = db.receipts.some(
    (r) => r.vendorId === f.vendorId && r.challanNo.trim().toLowerCase() === f.challanNo.trim().toLowerCase() && r.status !== "Rejected"
  );
  if (dup) return fail(db, "This challan number is already recorded for this vendor.");
  const { db: d1, no } = withNo(db, "GRN");
  const doc: Receipt = {
    id: makeId("rc"),
    no,
    ...f,
    invoiceNo: f.invoiceNo.trim(),
    challanNo: f.challanNo.trim(),
    receivedBy: f.receivedBy.trim(),
    status: "Pending Approval",
    createdBy: user.name,
  };
  return routeApproval({ ...d1, receipts: [doc, ...d1.receipts] }, user, "receipt", doc.id, `Receipt ${no}`, `${f.lines.length} product line(s), challan ${doc.challanNo}`);
}

export function createIssue(
  db: Db,
  user: AppUser,
  f: {
    recipientType: RecipientType; usage: Usage; employeeId: string; departmentId: string; recipientName: string; recipientOrg: string;
    event: string; purpose: string; date: string; issuedBy: string; handover: "Direct" | "Intermediary"; intermediary: string; notes: string;
    lines: { productId: string; qty: number }[];
  }
): Result {
  if (!f.lines.length || f.lines.some((l) => !l.productId || !(l.qty > 0))) return fail(db, "Add at least one product with a quantity above zero.");
  if (new Set(f.lines.map((l) => l.productId)).size !== f.lines.length) return fail(db, "Each product can appear only once per distribution.");
  if (!f.issuedBy.trim()) return fail(db, "Enter who is issuing the products.");
  if (f.handover === "Intermediary" && !f.intermediary.trim()) return fail(db, "Enter the intermediary's name.");
  const emp = db.employees.find((e) => e.id === f.employeeId);
  if (f.recipientType === "Employee" && (!emp || emp.status !== "Active")) return fail(db, "Select an active employee.");
  if (f.recipientType === "Department" && !db.departments.some((d) => d.id === f.departmentId)) return fail(db, "Select a department or office.");
  if (!["Employee", "Department"].includes(f.recipientType) && !f.recipientName.trim()) return fail(db, "Enter the recipient name.");
  const st = stockMap(db.ledger);
  for (const l of f.lines) {
    const p = db.products.find((x) => x.id === l.productId);
    if (!p || p.status !== "Active") return fail(db, "Select active products only.");
    if (l.qty > (st[l.productId] ?? 0) + EPS) return fail(db, `Insufficient stock for ${p.name}. Available: ${st[l.productId] ?? 0} ${p.baseUnit}`);
  }
  const usage: Usage = f.recipientType === "Employee" ? f.usage : f.recipientType === "Department" ? "Office" : "Gift";
  const employeeId = f.recipientType === "Employee" || (f.recipientType === "Department" && emp) ? f.employeeId : "";
  const { db: d1, no } = withNo(db, "ISS");
  const doc: Issue = {
    id: makeId("is"),
    no,
    date: f.date || todayStr(),
    recipientType: f.recipientType,
    usage,
    employeeId,
    departmentId: f.recipientType === "Department" ? f.departmentId : "",
    recipientName: f.recipientName.trim(),
    recipientOrg: f.recipientOrg.trim(),
    event: f.event.trim(),
    purpose: f.purpose.trim(),
    lines: f.lines.map((l) => ({ productId: l.productId, qty: l.qty, unitCost: db.products.find((p) => p.id === l.productId)?.unitCost ?? 0, returnedQty: 0, lostQty: 0 })),
    issuedBy: f.issuedBy.trim(),
    handover: f.handover,
    intermediary: f.handover === "Intermediary" ? f.intermediary.trim() : "",
    notes: f.notes.trim(),
    status: "Pending Approval",
    pin: employeeId ? String(1000 + Math.floor(Math.random() * 9000)) : "",
    ackAt: "",
    ackBy: "",
    createdBy: user.name,
  };
  return routeApproval({ ...d1, issues: [doc, ...d1.issues] }, user, "issue", doc.id, `Distribution ${no}`, `${recipientLabel(d1, doc)} · ${doc.lines.length} product line(s) · ${usage}`);
}

export function acknowledgeIssue(db: Db, id: string, pin: string): Result {
  const i = db.issues.find((x) => x.id === id);
  if (!i || i.status !== "Awaiting Acknowledgement") return fail(db, "Nothing to acknowledge.");
  if (pin.trim() !== i.pin) return fail(db, "Incorrect acknowledgement PIN.");
  const by = db.employees.find((e) => e.id === i.employeeId)?.name ?? "Employee";
  return { db: { ...db, issues: upd(db.issues, id, { status: "Completed", ackAt: nowIso(), ackBy: by }) }, message: "Receipt acknowledged by the employee." };
}

export function reverseIssue(db: Db, id: string, by: string, reason: string): Result {
  const i = db.issues.find((x) => x.id === id);
  if (!i || i.status !== "Awaiting Acknowledgement") return fail(db, "Only issues awaiting acknowledgement can be reversed.");
  if (!reason.trim()) return fail(db, "A reason is required.");
  const label = recipientLabel(db, i);
  const entries = i.lines.map((l) => led(l.productId, "Reversal", l.qty, i.no, label, by, `Reversed: ${reason.trim()}`));
  return { db: { ...db, issues: upd(db.issues, id, { status: "Reversed" }), ledger: [...db.ledger, ...entries] }, message: `${i.no} reversed. Stock restored.` };
}

export function createAdjustment(
  db: Db,
  user: AppUser,
  f: { productId: string; kind: AdjKind; qty: number; reason: string; date: string }
): Result {
  const p = db.products.find((x) => x.id === f.productId);
  if (!p) return fail(db, "Select a product.");
  if (!(f.qty > 0)) return fail(db, "Quantity must be above zero.");
  if (!f.reason.trim()) return fail(db, "A reason is required.");
  if (f.kind !== "Increase" && f.qty > (stockMap(db.ledger)[p.id] ?? 0) + EPS) return fail(db, "Cannot remove more than the available stock.");
  const { db: d1, no } = withNo(db, "ADJ");
  const doc: Adjustment = { id: makeId("ad"), no, date: f.date || todayStr(), productId: p.id, kind: f.kind, qty: f.qty, reason: f.reason.trim(), by: user.name, status: "Pending Approval" };
  return routeApproval({ ...d1, adjustments: [doc, ...d1.adjustments] }, user, "adjustment", doc.id, `${f.kind} ${no}`, `${f.qty} ${p.baseUnit} · ${p.name}`);
}

function openLines(db: Db, employeeId: string, productId: string) {
  return employeePossession(db, employeeId)
    .filter((r) => r.line.productId === productId)
    .sort((a, b) => a.issue.date.localeCompare(b.issue.date));
}

export function recordEmployeeReturn(
  db: Db,
  user: AppUser,
  f: { employeeId: string; date: string; reason: string; receivedBy: string; notes: string; lines: { productId: string; qty: number; condition: string }[] }
): Result {
  const emp = db.employees.find((e) => e.id === f.employeeId);
  if (!emp) return fail(db, "Select an employee.");
  if (!f.receivedBy.trim()) return fail(db, "Enter who received the return.");
  if (!f.lines.length || f.lines.some((l) => !l.productId || !(l.qty > 0))) return fail(db, "Add at least one product with a quantity above zero.");
  const { db: d1, no } = withNo(db, "RET");
  let issues = d1.issues;
  const ledger: LedgerEntry[] = [];
  const damages: Damage[] = [];
  const lines: ReturnLine[] = [];
  for (const l of f.lines) {
    const p = db.products.find((x) => x.id === l.productId);
    if (!p) return fail(db, "Unknown product.");
    let remaining = l.qty;
    const alloc: Alloc[] = [];
    for (const o of openLines({ ...d1, issues }, emp.id, l.productId)) {
      if (remaining <= EPS) break;
      const take = Math.min(o.open, remaining);
      remaining = round3(remaining - take);
      alloc.push({ issueId: o.issue.id, idx: o.idx, qty: take });
      issues = issues.map((i) =>
        i.id !== o.issue.id
          ? i
          : {
              ...i,
              lines: i.lines.map((ln, k) =>
                k !== o.idx ? ln : l.condition === "Lost" ? { ...ln, lostQty: round3(ln.lostQty + take) } : { ...ln, returnedQty: round3(ln.returnedQty + take) }
              ),
            }
      );
    }
    if (remaining > EPS) return fail(db, `${p.name}: this employee holds only ${round3(l.qty - remaining)} ${p.baseUnit}.`);
    if (l.condition === "Good") ledger.push(led(p.id, "Employee Return", l.qty, no, emp.name, f.receivedBy.trim(), f.reason, f.date));
    if (l.condition === "Lost") {
      damages.push({ id: makeId("dm"), date: f.date || todayStr(), productId: p.id, qty: l.qty, kind: "Loss", source: "Employee Loss", employeeId: emp.id, reference: no, reason: f.reason, by: f.receivedBy.trim(), value: l.qty * p.unitCost });
    }
    lines.push({ productId: p.id, qty: l.qty, condition: l.condition, alloc });
  }
  const doc: ReturnDoc = {
    id: makeId("rt"),
    no,
    date: f.date || todayStr(),
    source: "Employee",
    employeeId: emp.id,
    vendorId: "",
    receiptId: "",
    lines,
    reason: f.reason.trim(),
    receivedBy: f.receivedBy.trim(),
    notes: f.notes.trim(),
    status: lines.some((l) => l.condition === "Damaged") ? "Pending Inspection" : "Completed",
    creditAmount: 0,
    inspection: "",
    createdBy: user.name,
  };
  return {
    db: { ...d1, issues, returns: [doc, ...d1.returns], ledger: [...d1.ledger, ...ledger], damages: [...d1.damages, ...damages] },
    message: doc.status === "Pending Inspection" ? `${no} recorded. Damaged items are waiting for inspection.` : `${no} recorded.`,
  };
}

export function inspectReturn(db: Db, id: string, decision: "Write off" | "Restock" | "Reject", by: string): Result {
  const r = db.returns.find((x) => x.id === id);
  if (!r || r.status !== "Pending Inspection") return fail(db, "Nothing to inspect.");
  const emp = db.employees.find((e) => e.id === r.employeeId);
  let issues = db.issues;
  const ledger: LedgerEntry[] = [];
  const damages: Damage[] = [];
  for (const l of r.lines.filter((x) => x.condition === "Damaged")) {
    const p = db.products.find((x) => x.id === l.productId);
    if (decision === "Restock") ledger.push(led(l.productId, "Employee Return", l.qty, r.no, emp?.name ?? "Employee", by, "Inspection: usable, restocked"));
    if (decision === "Write off") {
      damages.push({ id: makeId("dm"), date: todayStr(), productId: l.productId, qty: l.qty, kind: "Damage", source: "Employee Return", employeeId: r.employeeId, reference: r.no, reason: "Damaged on return", by, value: l.qty * (p?.unitCost ?? 0) });
    }
    if (decision === "Reject") {
      for (const a of l.alloc) {
        issues = issues.map((i) =>
          i.id !== a.issueId ? i : { ...i, lines: i.lines.map((ln, k) => (k !== a.idx ? ln : { ...ln, returnedQty: round3(ln.returnedQty - a.qty) })) }
        );
      }
    }
  }
  return {
    db: { ...db, issues, returns: upd(db.returns, id, { status: "Completed", inspection: `${decision} by ${by}` }), ledger: [...db.ledger, ...ledger], damages: [...db.damages, ...damages] },
    message: `Inspection saved: ${decision}.`,
  };
}

export function createVendorReturn(
  db: Db,
  user: AppUser,
  f: { vendorId: string; receiptId: string; date: string; reason: string; receivedBy: string; notes: string; lines: { productId: string; qty: number; condition: string }[] }
): Result {
  const receipt = db.receipts.find((r) => r.id === f.receiptId && r.status === "Received" && r.vendorId === f.vendorId);
  if (!receipt) return fail(db, "Select a received receipt of this vendor.");
  if (!f.reason.trim()) return fail(db, "A reason is required.");
  if (!f.receivedBy.trim()) return fail(db, "Enter who is handling this return.");
  if (!f.lines.length || f.lines.some((l) => !l.productId || !(l.qty > 0))) return fail(db, "Add at least one product with a quantity above zero.");
  for (const l of f.lines) {
    const rl = receipt.lines.find((x) => x.productId === l.productId);
    if (!rl) return fail(db, "A product does not belong to the selected receipt.");
    const already = db.returns
      .filter((x) => x.source === "Vendor" && x.receiptId === receipt.id && x.status !== "Rejected")
      .reduce((s, x) => s + x.lines.filter((y) => y.productId === l.productId).reduce((a, y) => a + y.qty, 0), 0);
    if (l.qty > rl.qty - already + EPS) return fail(db, `Only ${round3(rl.qty - already)} of ${pname(db, l.productId)} can still be returned for this receipt.`);
  }
  const { db: d1, no } = withNo(db, "VRT");
  const doc: ReturnDoc = {
    id: makeId("rt"),
    no,
    date: f.date || todayStr(),
    source: "Vendor",
    employeeId: "",
    vendorId: f.vendorId,
    receiptId: receipt.id,
    lines: f.lines.map((l) => ({ ...l, alloc: [] })),
    reason: f.reason.trim(),
    receivedBy: f.receivedBy.trim(),
    notes: f.notes.trim(),
    status: "Pending Approval",
    creditAmount: 0,
    inspection: "",
    createdBy: user.name,
  };
  return routeApproval({ ...d1, returns: [doc, ...d1.returns] }, user, "vendorReturn", doc.id, `Vendor return ${no}`, `${doc.lines.length} line(s) against ${receipt.no}`);
}

export function markVendorCredit(db: Db, id: string, amount: number): Result {
  const r = db.returns.find((x) => x.id === id);
  if (!r || r.status !== "Returned to Vendor") return fail(db, "Only returned items can be marked as credited.");
  if (amount < 0) return fail(db, "Credit amount cannot be negative.");
  return { db: { ...db, returns: upd(db.returns, id, { status: "Credited", creditAmount: amount }) }, message: "Vendor credit recorded." };
}

/* =========================================================
   APP HOOK (state, persistence, permissions)
========================================================= */

export function useApp() {
  const [db, setDb] = useState<Db>(() => seedDb());
  const [userId, setUserIdState] = useState("u-1");
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState<{ msg: string; tone: "ok" | "error" } | null>(null);
  const dbRef = useRef(db);
  const userRef = useRef(userId);
  const timer = useRef<number | undefined>(undefined);

  const notify = useCallback((msg: string, tone: "ok" | "error" = "ok") => {
    setToast({ msg, tone });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 5000);
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DB_KEY);
      if (raw) {
        const n = normalizeDb(JSON.parse(raw));
        if (n) {
          dbRef.current = n;
          setDb(n);
        }
      }
      const u = window.localStorage.getItem(USER_KEY);
      if (u) {
        userRef.current = u;
        setUserIdState(u);
      }
    } catch {
      /* corrupt saved data is ignored */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(DB_KEY, JSON.stringify(db));
    } catch {
      notify("Browser storage is full. Download a backup and remove large attachments.", "error");
    }
  }, [db, hydrated, notify]);

  const pickUser = (d: Db, id: string) => d.users.find((u) => u.id === id && u.active) ?? d.users.find((u) => u.active) ?? d.users[0];
  const user = useMemo(() => pickUser(db, userId), [db, userId]);
  const stock = useMemo(() => stockMap(db.ledger), [db.ledger]);

  const setUserId = useCallback((id: string) => {
    userRef.current = id;
    setUserIdState(id);
    try {
      window.localStorage.setItem(USER_KEY, id);
    } catch {
      /* ignore */
    }
  }, []);

  const can = useCallback(
    (p: Perm) => {
      if (user.role === "Super Admin") return true;
      if (p === "backup") return user.backupAccess;
      return (db.perms[user.role] ?? []).includes(p);
    },
    [user, db.perms]
  );

  const run = useCallback(
    (fn: (d: Db) => Result, audit?: { module: string; action: string; detail: string }) => {
      const cur = dbRef.current;
      const actor = pickUser(cur, userRef.current);
      const r = fn(cur);
      if (r.error) {
        notify(r.error, "error");
        return false;
      }
      let next = r.db;
      if (audit) {
        next = {
          ...next,
          audit: [...next.audit, { id: makeId("a"), at: nowIso(), userId: actor.id, userName: actor.name, role: actor.role, ...audit }],
        };
      }
      dbRef.current = next;
      setDb(next);
      if (r.message) notify(r.message);
      return true;
    },
    [notify]
  );

  const ctx: Ctx = useMemo(() => ({ db, user, stock, can, run, notify }), [db, user, stock, can, run, notify]);
  return { ctx, toast, dismissToast: () => setToast(null), userId: user.id, setUserId, hydrated };
}

/* =========================================================
   UI KIT (shared by all modules)
========================================================= */

export const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100";
export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50";
export const btnGhost =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";
export const btnDanger =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50";
export const td = "px-3 py-3 align-top";

type FormEl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
export function bind<T extends object>(form: T, set: (f: T) => void, key: keyof T & string) {
  return {
    value: String((form as Record<string, unknown>)[key] ?? ""),
    onChange: (e: ChangeEvent<FormEl>) => set({ ...form, [key]: e.target.value }),
  };
}

export function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}

export function Badge({ children }: { children: ReactNode }) {
  const v = String(children).toLowerCase();
  const tone = /reject|lost|damag|left|inactive|disposed|reversed|low stock|dead|expired/.test(v)
    ? "bg-rose-50 text-rose-700"
    : /pending|await|inspection|repair|poor|expiring|fair/.test(v)
      ? "bg-amber-50 text-amber-700"
      : /active|received|approved|complete|applied|credited|acknowledged|assigned|issued|good|new|returned|in store/.test(v)
        ? "bg-emerald-50 text-emerald-700"
        : "bg-slate-100 text-slate-600";
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{children}</span>;
}

export function Section({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </div>
  );
}

export function Card({ title, subtitle, action, children }: { title?: string; subtitle?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {(title || action) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="font-semibold text-slate-900">{title}</h2>}
            {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ title, value, detail, tone = "blue" }: { title: string; value: string; detail?: string; tone?: "blue" | "amber" | "rose" | "emerald" | "violet" }) {
  const tones = { blue: "text-blue-600 bg-blue-50", amber: "text-amber-600 bg-amber-50", rose: "text-rose-600 bg-rose-50", emerald: "text-emerald-600 bg-emerald-50", violet: "text-violet-600 bg-violet-50" };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <span className={`h-2.5 w-2.5 rounded-full ${tones[tone].split(" ")[1]} ring-4 ring-offset-0 ${tones[tone].split(" ")[1]}`} />
      </div>
      <p className={`mt-3 break-words text-2xl font-bold tracking-tight ${tones[tone].split(" ")[0]}`}>{value}</p>
      {detail && <p className="mt-2 text-xs text-slate-500">{detail}</p>}
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
      <div className="rounded-xl bg-slate-100 p-3 text-slate-400">
        <Package size={22} />
      </div>
      <p className="text-sm text-slate-500">{text}</p>
    </div>
  );
}

export function Img({ src, alt, className = "h-12 w-12" }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 ${className}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <Package size={18} className="text-slate-400" />
      )}
    </div>
  );
}

export function Table({ heads, children, min = 900, empty }: { heads: string[]; children: ReactNode; min?: number; empty?: string }) {
  const hasRows = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm" style={{ minWidth: min }}>
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            {heads.map((h) => (
              <th key={h} className="px-3 py-3 font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
      {!hasRows && empty && <Empty text={empty} />}
    </div>
  );
}

export function Notice({ children, tone = "blue" }: { children: ReactNode; tone?: "blue" | "amber" }) {
  const t = tone === "blue" ? "border-blue-200 bg-blue-50 text-blue-800" : "border-amber-200 bg-amber-50 text-amber-900";
  return <div className={`rounded-xl border px-4 py-3 text-sm leading-6 ${t}`}>{children}</div>;
}

/* ---------- multi-product line editor ---------- */

export type FormLine = { productId: string; qty: string; mode: "unit" | "pack"; price: string; condition: string };
export const blankLine = (condition = ""): FormLine => ({ productId: "", qty: "1", mode: "unit", price: "", condition });
export const toBase = (l: FormLine, products: Product[]) => {
  const p = products.find((x) => x.id === l.productId);
  const q = num(l.qty);
  return round3(l.mode === "pack" && p && p.packSize > 0 ? q * p.packSize : q);
};

export function LineEditor({
  lines, setLines, products, stock, showPrice, conditions, defaultCondition = "",
}: {
  lines: FormLine[];
  setLines: (l: FormLine[]) => void;
  products: Product[];
  stock?: Record<string, number>;
  showPrice?: boolean;
  conditions?: string[];
  defaultCondition?: string;
}) {
  const set = (i: number, patch: Partial<FormLine>) => setLines(lines.map((l, k) => (k === i ? { ...l, ...patch } : l)));
  return (
    <div className="space-y-2">
      {lines.map((l, i) => {
        const p = products.find((x) => x.id === l.productId);
        return (
          <div key={i} className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-12">
            <select className={`${inputCls} sm:col-span-4`} value={l.productId} onChange={(e) => set(i, { productId: e.target.value, mode: "unit" })}>
              <option value="">Select product</option>
              {products.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.code} — {x.name}
                  {stock ? ` (${stock[x.id] ?? 0} ${x.baseUnit})` : ""}
                </option>
              ))}
            </select>
            <input type="number" min="0" step="any" className={`${inputCls} sm:col-span-2`} value={l.qty} onChange={(e) => set(i, { qty: e.target.value })} placeholder="Qty" />
            <select className={`${inputCls} sm:col-span-2`} value={l.mode} disabled={!p || !(p.packSize > 0)} onChange={(e) => set(i, { mode: e.target.value as "unit" | "pack" })}>
              <option value="unit">{p?.baseUnit ?? "Unit"}</option>
              {p && p.packSize > 0 && <option value="pack">{p.packUnit} ({p.packSize})</option>}
            </select>
            {showPrice && (
              <input type="number" min="0" step="any" className={`${inputCls} sm:col-span-3`} value={l.price} onChange={(e) => set(i, { price: e.target.value })} placeholder="Unit price (BDT)" />
            )}
            {conditions && (
              <select className={`${inputCls} sm:col-span-3`} value={l.condition} onChange={(e) => set(i, { condition: e.target.value })}>
                {conditions.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            )}
            <button type="button" aria-label="Remove line" className={`${btnDanger} sm:col-span-1`} disabled={lines.length === 1} onClick={() => setLines(lines.filter((_, k) => k !== i))}>
              <X size={15} />
            </button>
          </div>
        );
      })}
      <button type="button" className={btnGhost} onClick={() => setLines([...lines, blankLine(defaultCondition)])}>
        <Plus size={15} /> Add product line
      </button>
    </div>
  );
}

/* =========================================================
   INVENTORY MODULE
========================================================= */

type Tab = "overview" | "products" | "receiving" | "distribution" | "returns" | "vendors" | "ledger" | "reports";

const TABS: { id: Tab; label: string; icon: typeof Package }[] = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "products", label: "Products", icon: Package },
  { id: "receiving", label: "Receiving", icon: ArrowDownToLine },
  { id: "distribution", label: "Distribution", icon: ArrowUpFromLine },
  { id: "returns", label: "Returns", icon: RotateCcw },
  { id: "vendors", label: "Vendors", icon: Truck },
  { id: "ledger", label: "Ledger & Adjustments", icon: History },
  { id: "reports", label: "Reports", icon: BarChart3 },
];

export default function InventoryManagement({ ctx }: { ctx: Ctx }) {
  const [tab, setTab] = useState<Tab>("overview");
  const visible = TABS.filter((t) => t.id !== "reports" || ctx.can("report.view"));
  return (
    <div className="space-y-6">
      <Section title="Inventory Management" subtitle="Products, receiving with challan, distribution, returns, vendors, ledger and reports." />
      <div className="flex gap-2 overflow-x-auto border-b border-slate-200 pb-2">
        {visible.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                tab === t.id ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-white hover:text-slate-900"
              }`}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "overview" && <OverviewTab ctx={ctx} go={setTab} />}
      {tab === "products" && <ProductsTab ctx={ctx} />}
      {tab === "receiving" && <ReceivingTab ctx={ctx} />}
      {tab === "distribution" && <DistributionTab ctx={ctx} />}
      {tab === "returns" && <ReturnsTab ctx={ctx} />}
      {tab === "vendors" && <VendorsTab ctx={ctx} />}
      {tab === "ledger" && <LedgerTab ctx={ctx} />}
      {tab === "reports" && <ReportsTab ctx={ctx} />}
    </div>
  );
}

/* ---------- overview ---------- */

function OverviewTab({ ctx, go }: { ctx: Ctx; go: (t: Tab) => void }) {
  const { db, stock } = ctx;
  const low = lowStock(db, stock);
  const dead = deadStock(db, stock);
  const value = db.products.reduce((s, p) => s + (stock[p.id] ?? 0) * p.unitCost, 0);
  const awaiting = db.issues.filter((i) => i.status === "Awaiting Acknowledgement").length;
  const inspect = db.returns.filter((r) => r.status === "Pending Inspection").length;
  const pending = db.approvals.filter((a) => a.status === "Pending").length;
  const rows = [
    { t: "Issues awaiting employee acknowledgement", n: awaiting, tab: "distribution" as Tab },
    { t: "Returns pending inspection", n: inspect, tab: "returns" as Tab },
    { t: "Requests pending approval", n: pending, tab: "overview" as Tab },
    { t: "Products at or below minimum stock", n: low.length, tab: "products" as Tab },
    { t: "Dead / slow-moving products", n: dead.length, tab: "reports" as Tab },
  ];
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat title="Active Products" value={String(db.products.filter((p) => p.status === "Active").length)} detail={`${db.products.length} total records`} />
        <Stat title="Stock Value" value={money(value)} detail="Quantity × latest unit cost" tone="violet" />
        <Stat title="Low Stock" value={String(low.length)} detail="At or below minimum" tone="amber" />
        <Stat title="Dead Stock" value={String(dead.length)} detail={`No issue for ${db.settings.deadStockDays}+ days`} tone="rose" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Pending Actions" subtitle="Items that need follow-up">
          <div className="space-y-2">
            {rows.map((r) => (
              <button key={r.t} onClick={() => go(r.tab)} className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 text-left text-sm hover:bg-blue-50/40">
                <span className="font-medium text-slate-700">{r.t}</span>
                <span className={`rounded-lg px-3 py-1 text-sm font-semibold ${r.n > 0 ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"}`}>{r.n}</span>
              </button>
            ))}
          </div>
        </Card>
        <Card title="Low Stock Alerts" action={<AlertTriangle size={20} className="text-amber-500" />}>
          {low.length === 0 ? (
            <Empty text="No low-stock products right now." />
          ) : (
            <div className="space-y-2">
              {low.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-xl bg-amber-50 p-3 text-sm">
                  <div>
                    <p className="font-semibold text-slate-800">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.code} · min {p.minStock} {p.baseUnit}</p>
                  </div>
                  <span className="font-semibold text-amber-700">{stock[p.id] ?? 0} {p.baseUnit}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
      <Card title="Recent Stock Activity">
        <Table heads={["Date", "Product", "Type", "Change", "Reference", "Party"]} min={700} empty="No transactions yet.">
          {[...db.ledger].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8).map((e) => (
            <tr key={e.id}>
              <td className={td}>{e.date}</td>
              <td className={`${td} font-medium`}>{pname(db, e.productId)}</td>
              <td className={td}>{e.type}</td>
              <td className={`${td} font-semibold ${e.qty < 0 ? "text-rose-600" : "text-emerald-600"}`}>{e.qty > 0 ? "+" : ""}{e.qty}</td>
              <td className={td}>{e.ref}</td>
              <td className={td}>{e.party}</td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}

/* ---------- products ---------- */

const DEFAULT_CATEGORIES = ["Stationery", "IT Equipment", "Furniture", "Gift Items", "Office Supplies", "Promotional", "Other"];
const UNITS = ["Piece", "Ream", "Box", "Pack", "Kg", "Liter", "Set", "Roll", "Dozen"];
const PACK_UNITS = ["Carton", "Box", "Pack", "Bag", "Bundle"];

const blankProduct = {
  code: "", name: "", category: "Stationery", itemType: "Consumable", intendedFor: "General", baseUnit: "Piece", packUnit: "Carton",
  packSize: "0", unitWeightKg: "0", minStock: "5", unitCost: "0", vendorId: "", location: "Main Store", status: "Active", openingStock: "0", image: "",
};

function ProductsTab({ ctx }: { ctx: Ctx }) {
  const { db, stock, can, run, user } = ctx;
  const allowed = can("product.manage");
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [f, setF] = useState(blankProduct);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const categories = useMemo(() => Array.from(new Set([...DEFAULT_CATEGORIES, ...db.products.map((p) => p.category)])), [db.products]);

  function edit(p: Product) {
    setEditing(p.id);
    setF({
      code: p.code, name: p.name, category: p.category, itemType: p.itemType, intendedFor: p.intendedFor, baseUnit: p.baseUnit, packUnit: p.packUnit,
      packSize: String(p.packSize), unitWeightKg: String(p.unitWeightKg), minStock: String(p.minStock), unitCost: String(p.unitCost), vendorId: p.vendorId,
      location: p.location, status: p.status, openingStock: "0", image: p.image,
    });
    setShow(true);
  }
  function reset() {
    setEditing(null);
    setF(blankProduct);
    setShow(false);
  }
  function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = f.code.trim().toUpperCase();
    const name = f.name.trim();
    const ok = run(
      (d) => {
        if (!code || !name) return fail(d, "Product code and name are required.");
        if (d.products.some((p) => p.code.toLowerCase() === code.toLowerCase() && p.id !== editing)) return fail(d, "This product code already exists.");
        const data = {
          code, name, category: f.category.trim() || "General", itemType: f.itemType as ItemType, intendedFor: f.intendedFor as Audience,
          baseUnit: f.baseUnit, packUnit: f.packUnit, packSize: Math.max(0, num(f.packSize)), unitWeightKg: Math.max(0, num(f.unitWeightKg)),
          minStock: Math.max(0, num(f.minStock)), unitCost: Math.max(0, num(f.unitCost)), vendorId: f.vendorId, location: f.location.trim(),
          status: f.status as ActiveState, image: f.image,
        };
        if (editing) return { db: { ...d, products: upd(d.products, editing, data) }, message: "Product updated." };
        const p: Product = { id: makeId("p"), ...data, createdAt: todayStr() };
        const opening = Math.max(0, num(f.openingStock));
        return {
          db: { ...d, products: [...d.products, p], ledger: opening > 0 ? [...d.ledger, led(p.id, "Opening", opening, `OPEN-${code}`, "Opening stock", user.name, "Initial opening balance")] : d.ledger },
          message: "Product created.",
        };
      },
      { module: "Products", action: editing ? "Update product" : "Create product", detail: `${code} ${name}` }
    );
    if (ok) reset();
  }
  function toggle(p: Product) {
    run((d) => ({ db: { ...d, products: upd(d.products, p.id, { status: p.status === "Active" ? "Inactive" : "Active" }) }, message: "Product status updated." }), {
      module: "Products", action: "Change status", detail: p.code,
    });
  }

  const filtered = db.products.filter(
    (p) => (status === "All" || p.status === status) && `${p.code} ${p.name} ${p.category} ${p.location}`.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <Section
        title="Product Catalogue"
        subtitle="Codes, categories, packaging (cartons / kg), minimum stock and cost."
        action={
          <>
            <button className={btnGhost} onClick={() => downloadCsv("products.csv", [["Code", "Name", "Category", "Type", "Audience", "Stock", "Packaging", "Total kg", "Min", "Unit cost", "Value", "Status"], ...db.products.map((p) => [p.code, p.name, p.category, p.itemType, p.intendedFor, stock[p.id] ?? 0, packText(p, stock[p.id] ?? 0), weightOf(p, stock[p.id] ?? 0), p.minStock, p.unitCost, (stock[p.id] ?? 0) * p.unitCost, p.status])])}>
              <Download size={15} /> Export
            </button>
            <button className={btnPrimary} disabled={!allowed} onClick={() => { setEditing(null); setF(blankProduct); setShow(true); }}>
              <Plus size={16} /> Add Product
            </button>
          </>
        }
      />
      {!allowed && <Notice tone="amber">Your role cannot manage products. You can view the catalogue.</Notice>}

      {show && (
        <Card title={editing ? "Edit Product" : "Create Product"} action={<button onClick={reset} aria-label="Close"><X size={18} /></button>}>
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Product Code *"><input required className={inputCls} {...bind(f, setF, "code")} placeholder="e.g. ST-001" /></Field>
            <Field label="Product Name *"><input required className={inputCls} {...bind(f, setF, "name")} /></Field>
            <Field label="Category">
              <input list="pids-categories" className={inputCls} {...bind(f, setF, "category")} />
              <datalist id="pids-categories">{categories.map((c) => <option key={c} value={c} />)}</datalist>
            </Field>
            <Field label="Item Type">
              <select className={inputCls} {...bind(f, setF, "itemType")}><option>Consumable</option><option>Reusable Asset</option></select>
            </Field>
            <Field label="Intended For">
              <select className={inputCls} {...bind(f, setF, "intendedFor")}><option>General</option><option>Employee</option><option>Client</option><option>Guest</option><option>Event</option></select>
            </Field>
            <Field label="Base Unit">
              <select className={inputCls} {...bind(f, setF, "baseUnit")}>{UNITS.map((u) => <option key={u}>{u}</option>)}</select>
            </Field>
            <Field label="Pack Type">
              <select className={inputCls} {...bind(f, setF, "packUnit")}>{PACK_UNITS.map((u) => <option key={u}>{u}</option>)}</select>
            </Field>
            <Field label="Units per Pack (0 = not packed)"><input type="number" min="0" step="any" className={inputCls} {...bind(f, setF, "packSize")} /></Field>
            <Field label="Weight per Unit (kg, 0 = n/a)"><input type="number" min="0" step="any" className={inputCls} {...bind(f, setF, "unitWeightKg")} /></Field>
            <Field label="Minimum Stock"><input type="number" min="0" step="any" className={inputCls} {...bind(f, setF, "minStock")} /></Field>
            <Field label="Unit Cost (BDT)"><input type="number" min="0" step="any" className={inputCls} {...bind(f, setF, "unitCost")} /></Field>
            {!editing && <Field label="Opening Stock"><input type="number" min="0" step="any" className={inputCls} {...bind(f, setF, "openingStock")} /></Field>}
            <Field label="Default Vendor">
              <select className={inputCls} {...bind(f, setF, "vendorId")}><option value="">None</option>{db.vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</select>
            </Field>
            <Field label="Storage Location"><input className={inputCls} {...bind(f, setF, "location")} /></Field>
            <Field label="Status"><select className={inputCls} {...bind(f, setF, "status")}><option>Active</option><option>Inactive</option></select></Field>
            <div className="sm:col-span-2 lg:col-span-3"><ImageUpload label="Product Image" value={f.image} onChange={(v) => setF({ ...f, image: v })} /></div>
            <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
              <button className={btnPrimary} type="submit">{editing ? "Save Changes" : "Create Product"}</button>
              <button className={btnGhost} type="button" onClick={reset}>Cancel</button>
            </div>
          </form>
        </Card>
      )}

      <Card
        title={`Products (${filtered.length})`}
        action={
          <div className="flex gap-2">
            <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}><option>All</option><option>Active</option><option>Inactive</option></select>
            <div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className={`${inputCls} pl-9`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." /></div>
          </div>
        }
      >
        <Table heads={["Product", "Category / Type", "Stock (packs)", "Total kg", "Min", "Unit cost", "Value", "Vendor", "Status", "Actions"]} min={1150} empty="No products match.">
          {filtered.map((p) => {
            const s = stock[p.id] ?? 0;
            return (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className={td}>
                  <div className="flex items-center gap-3"><Img src={p.image} alt={p.name} /><div><p className="font-semibold text-slate-900">{p.name}</p><p className="text-xs text-slate-500">{p.code}</p></div></div>
                </td>
                <td className={td}><p>{p.category}</p><p className="text-xs text-slate-500">{p.itemType} · for {p.intendedFor}</p></td>
                <td className={`${td} font-semibold ${s <= p.minStock ? "text-rose-600" : ""}`}>{packText(p, s)}</td>
                <td className={td}>{weightOf(p, s) || "—"}</td>
                <td className={td}>{p.minStock}</td>
                <td className={td}>{money(p.unitCost)}</td>
                <td className={`${td} font-medium`}>{money(s * p.unitCost)}</td>
                <td className={td}>{db.vendors.find((v) => v.id === p.vendorId)?.name ?? "—"}</td>
                <td className={td}><Badge>{p.status}</Badge></td>
                <td className={td}>
                  <div className="flex gap-2">
                    <button className={btnGhost} disabled={!allowed} onClick={() => edit(p)}>Edit</button>
                    <button className={btnGhost} disabled={!allowed} onClick={() => toggle(p)}>{p.status === "Active" ? "Deactivate" : "Activate"}</button>
                  </div>
                </td>
              </tr>
            );
          })}
        </Table>
      </Card>
    </div>
  );
}

/* ---------- receiving ---------- */

function ReceivingTab({ ctx }: { ctx: Ctx }) {
  const { db, can, run, user } = ctx;
  const allowed = can("stock.receive");
  const active = db.products.filter((p) => p.status === "Active");
  const blank = () => ({ vendorId: "", date: todayStr(), invoiceNo: "", challanNo: "", receivedBy: user.name, destination: "Main Store", notes: "" });
  const [f, setF] = useState(blank);
  const [challan, setChallan] = useState("");
  const [lines, setLines] = useState<FormLine[]>([blankLine()]);

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const ok = run(
      (d) =>
        createReceipt(d, user, {
          ...f, challanImage: challan,
          lines: lines.map((l) => ({ productId: l.productId, qty: toBase(l, db.products), unitPrice: Math.max(0, num(l.price)) })),
        }),
      { module: "Receiving", action: "Create receipt", detail: `Challan ${f.challanNo}` }
    );
    if (ok) {
      setF(blank());
      setChallan("");
      setLines([blankLine()]);
    }
  }

  const total = (r: Receipt) => r.lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
  const offices = ["Main Store", ...db.companies.map((c) => `${c.name} (${c.officeCategory})`)];

  return (
    <div className="grid gap-6 xl:grid-cols-[460px_1fr]">
      <Card title="Receive Stock" subtitle="Record vendor, challan and prices. Stock increases only when the receipt is finalized.">
        <fieldset disabled={!allowed} className="m-0 min-w-0 border-0 p-0">
          <form onSubmit={submit} className="space-y-4">
            <Field label="Vendor *">
              <select required className={inputCls} {...bind(f, setF, "vendorId")}><option value="">Select vendor</option>{db.vendors.filter((v) => v.status === "Active").map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Challan No. *"><input required className={inputCls} {...bind(f, setF, "challanNo")} /></Field>
              <Field label="Invoice No."><input className={inputCls} {...bind(f, setF, "invoiceNo")} /></Field>
              <Field label="Receipt Date"><input type="date" required className={inputCls} {...bind(f, setF, "date")} /></Field>
              <Field label="Received By *"><input required className={inputCls} {...bind(f, setF, "receivedBy")} /></Field>
            </div>
            <Field label="Destination Office / Store">
              <select className={inputCls} {...bind(f, setF, "destination")}>{offices.map((o) => <option key={o}>{o}</option>)}</select>
            </Field>
            <ImageUpload label="Challan Copy (image or PDF)" value={challan} onChange={setChallan} allowPdf helperText="Photo or PDF of the vendor challan" />
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Products *</p>
              <LineEditor lines={lines} setLines={setLines} products={active} showPrice />
            </div>
            <Field label="Notes"><textarea rows={2} className={inputCls} {...bind(f, setF, "notes")} /></Field>
            <button type="submit" className={`${btnPrimary} w-full`}><ArrowDownToLine size={16} /> Save Receipt</button>
          </form>
        </fieldset>
        {!allowed && <p className="mt-3 text-xs text-amber-700">Your role cannot receive stock.</p>}
      </Card>

      <Card title="Receiving History">
        <Table heads={["Receipt", "Vendor", "Challan / Invoice", "Items", "Value", "Status", "Challan"]} min={950} empty="No receipts yet.">
          {db.receipts.map((r) => (
            <tr key={r.id}>
              <td className={td}><p className="font-semibold">{r.no}</p><p className="text-xs text-slate-500">{r.date}</p></td>
              <td className={td}>{db.vendors.find((v) => v.id === r.vendorId)?.name ?? "—"}</td>
              <td className={td}>{r.challanNo}<p className="text-xs text-slate-500">{r.invoiceNo || "—"}</p></td>
              <td className={td}>{r.lines.map((l) => `${l.qty} × ${pname(db, l.productId)}`).join(", ")}</td>
              <td className={td}>{money(total(r))}</td>
              <td className={td}><Badge>{r.status}</Badge></td>
              <td className={td}>{r.challanImage ? <button className={btnGhost} onClick={() => openAttachment(r.challanImage)}><Eye size={14} /> View</button> : "—"}</td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}

/* ---------- distribution ---------- */

function DistributionTab({ ctx }: { ctx: Ctx }) {
  const { db, stock, can, run, user } = ctx;
  const allowed = can("stock.issue");
  const available = db.products.filter((p) => p.status === "Active" && (stock[p.id] ?? 0) > 0);
  const blank = () => ({
    recipientType: "Employee", usage: "Office", employeeId: "", departmentId: "", recipientName: "", recipientOrg: "", event: "", purpose: "",
    date: todayStr(), issuedBy: user.name, handover: "Direct", intermediary: "", notes: "",
  });
  const [f, setF] = useState(blank);
  const [lines, setLines] = useState<FormLine[]>([blankLine()]);
  const [pins, setPins] = useState<Record<string, string>>({});
  const [usageFilter, setUsageFilter] = useState("All");
  const [q, setQ] = useState("");
  const isEmp = f.recipientType === "Employee";
  const isDept = f.recipientType === "Department";

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const ok = run(
      (d) =>
        createIssue(d, user, {
          ...f,
          recipientType: f.recipientType as RecipientType,
          usage: f.usage as Usage,
          handover: f.handover as "Direct" | "Intermediary",
          lines: lines.map((l) => ({ productId: l.productId, qty: toBase(l, db.products) })),
        }),
      { module: "Distribution", action: "Create distribution", detail: `${f.recipientType} · ${f.usage}` }
    );
    if (ok) {
      setF(blank());
      setLines([blankLine()]);
    }
  }

  const rows = db.issues.filter(
    (i) => (usageFilter === "All" || i.usage === usageFilter) && `${i.no} ${recipientLabel(db, i)} ${i.event} ${i.purpose}`.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card title="New Distribution" subtitle="One distribution can contain many products. Employee issues stay pending until the employee acknowledges.">
        <fieldset disabled={!allowed} className="m-0 min-w-0 border-0 p-0">
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Recipient Type">
                <select className={inputCls} {...bind(f, setF, "recipientType")}><option>Employee</option><option>Department</option><option>Client</option><option>Guest</option><option>Other</option></select>
              </Field>
              {isEmp && (
                <Field label="Use Type">
                  <select className={inputCls} {...bind(f, setF, "usage")}><option value="Office">Office use</option><option value="Personal">Personal use</option></select>
                </Field>
              )}
              {(isEmp || isDept) && (
                <Field label={isDept ? "Custodian (optional)" : "Employee *"}>
                  <select className={inputCls} {...bind(f, setF, "employeeId")}>
                    <option value="">{isDept ? "No custodian" : "Select employee"}</option>
                    {db.employees.filter((x) => x.status === "Active").map((x) => <option key={x.id} value={x.id}>{x.empId} — {x.name}</option>)}
                  </select>
                </Field>
              )}
              {isDept && (
                <Field label="Department / Office *">
                  <select className={inputCls} {...bind(f, setF, "departmentId")}>
                    <option value="">Select</option>
                    {db.departments.map((d) => <option key={d.id} value={d.id}>{db.companies.find((c) => c.id === d.companyId)?.code} — {d.name}</option>)}
                  </select>
                </Field>
              )}
              {!isEmp && !isDept && (
                <>
                  <Field label="Recipient Name *"><input className={inputCls} {...bind(f, setF, "recipientName")} /></Field>
                  <Field label="Organization"><input className={inputCls} {...bind(f, setF, "recipientOrg")} /></Field>
                </>
              )}
              <Field label="Event / Occasion"><input className={inputCls} {...bind(f, setF, "event")} placeholder="e.g. Eid gift, welcome kit" /></Field>
              <Field label="Purpose"><input className={inputCls} {...bind(f, setF, "purpose")} /></Field>
              <Field label="Date"><input type="date" required className={inputCls} {...bind(f, setF, "date")} /></Field>
              <Field label="Issued By *"><input required className={inputCls} {...bind(f, setF, "issuedBy")} /></Field>
              <Field label="Handover">
                <select className={inputCls} {...bind(f, setF, "handover")}><option>Direct</option><option>Intermediary</option></select>
              </Field>
              {f.handover === "Intermediary" && <Field label="Intermediary Name *"><input className={inputCls} {...bind(f, setF, "intermediary")} /></Field>}
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Products *</p>
              <LineEditor lines={lines} setLines={setLines} products={available} stock={stock} />
            </div>
            <Field label="Notes"><input className={inputCls} {...bind(f, setF, "notes")} /></Field>
            <button className={btnPrimary} type="submit"><ArrowUpFromLine size={16} /> Submit Distribution</button>
          </form>
        </fieldset>
        {!allowed && <p className="mt-3 text-xs text-amber-700">Your role cannot distribute products.</p>}
      </Card>

      <Card
        title="Distribution History"
        action={
          <div className="flex gap-2">
            <select className={inputCls} value={usageFilter} onChange={(e) => setUsageFilter(e.target.value)}><option>All</option><option>Personal</option><option>Office</option><option>Gift</option></select>
            <input className={inputCls} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." />
          </div>
        }
      >
        <Table heads={["Reference", "Recipient", "Use / Purpose", "Items", "Handover", "Status", "Action"]} min={1100} empty="No distributions yet.">
          {rows.map((i) => (
            <tr key={i.id}>
              <td className={td}><p className="font-semibold">{i.no}</p><p className="text-xs text-slate-500">{i.date}</p></td>
              <td className={td}>{recipientLabel(db, i)}</td>
              <td className={td}><Badge>{i.usage}</Badge><p className="mt-1 text-xs text-slate-500">{i.event || i.purpose || "—"}</p></td>
              <td className={td}>{i.lines.map((l) => `${l.qty} × ${pname(db, l.productId)}`).join(", ")}</td>
              <td className={td}>{i.handover}{i.intermediary ? ` (${i.intermediary})` : ""}<p className="text-xs text-slate-500">by {i.issuedBy}</p></td>
              <td className={td}><Badge>{i.status}</Badge>{i.ackAt && <p className="mt-1 text-xs text-slate-500">Ack: {new Date(i.ackAt).toLocaleString()}</p>}</td>
              <td className={td}>
                {i.status === "Awaiting Acknowledgement" && (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500">Demo PIN <span className="font-mono font-semibold text-slate-800">{i.pin}</span> (give it to the employee)</p>
                    <div className="flex gap-2">
                      <input className={`${inputCls} w-24`} placeholder="PIN" value={pins[i.id] ?? ""} onChange={(e) => setPins({ ...pins, [i.id]: e.target.value })} />
                      <button className={btnPrimary} onClick={() => run((d) => acknowledgeIssue(d, i.id, pins[i.id] ?? ""), { module: "Distribution", action: "Acknowledge", detail: i.no })}>Confirm</button>
                    </div>
                    <button
                      className={btnDanger}
                      disabled={!allowed}
                      onClick={() => {
                        const reason = window.prompt("Reason for reversing this distribution:");
                        if (reason) run((d) => reverseIssue(d, i.id, user.name, reason), { module: "Distribution", action: "Reverse", detail: `${i.no}: ${reason}` });
                      }}
                    >
                      <Undo2 size={14} /> Reverse
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}

/* ---------- returns ---------- */

function ReturnsTab({ ctx }: { ctx: Ctx }) {
  const { db, can, run, user } = ctx;
  const allowed = can("return.manage");
  const [mode, setMode] = useState<"Employee" | "Vendor">("Employee");
  const [e, setE] = useState({ employeeId: "", date: todayStr(), reason: "Returned after use", receivedBy: user.name, notes: "" });
  const [eLines, setELines] = useState<FormLine[]>([blankLine("Good")]);
  const [v, setV] = useState({ vendorId: "", receiptId: "", date: todayStr(), reason: "", receivedBy: user.name, notes: "" });
  const [vLines, setVLines] = useState<FormLine[]>([blankLine("Defective")]);
  const [credit, setCredit] = useState<Record<string, string>>({});

  const held = useMemo(() => {
    const m = new Map<string, Product>();
    employeePossession(db, e.employeeId).forEach((r) => r.product && m.set(r.product.id, r.product));
    return Array.from(m.values());
  }, [db, e.employeeId]);
  const receipts = db.receipts.filter((r) => r.vendorId === v.vendorId && r.status === "Received");
  const receiptProducts = (db.receipts.find((r) => r.id === v.receiptId)?.lines ?? []).map((l) => db.products.find((p) => p.id === l.productId)).filter((p): p is Product => Boolean(p));

  function submitEmployee(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const ok = run(
      (d) => recordEmployeeReturn(d, user, { ...e, lines: eLines.map((l) => ({ productId: l.productId, qty: toBase(l, db.products), condition: l.condition })) }),
      { module: "Returns", action: "Employee return", detail: db.employees.find((x) => x.id === e.employeeId)?.empId ?? "" }
    );
    if (ok) { setE({ ...e, employeeId: "", notes: "" }); setELines([blankLine("Good")]); }
  }
  function submitVendor(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const ok = run(
      (d) => createVendorReturn(d, user, { ...v, lines: vLines.map((l) => ({ productId: l.productId, qty: toBase(l, db.products), condition: l.condition })) }),
      { module: "Returns", action: "Vendor return", detail: db.vendors.find((x) => x.id === v.vendorId)?.name ?? "" }
    );
    if (ok) { setV({ ...v, receiptId: "", reason: "", notes: "" }); setVLines([blankLine("Defective")]); }
  }

  return (
    <div className="space-y-6">
      <Card title="Record a Return" subtitle="Employee returns update the employee's possession. Vendor returns reduce stock after approval.">
        <div className="mb-4 flex gap-2">
          {(["Employee", "Vendor"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={mode === m ? btnPrimary : btnGhost}>{m} Return</button>
          ))}
        </div>
        <fieldset disabled={!allowed} className="m-0 min-w-0 border-0 p-0">
          {mode === "Employee" ? (
            <form onSubmit={submitEmployee} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Employee *">
                  <select required className={inputCls} {...bind(e, setE, "employeeId")}><option value="">Select</option>{db.employees.map((x) => <option key={x.id} value={x.id}>{x.empId} — {x.name}</option>)}</select>
                </Field>
                <Field label="Return Date"><input type="date" className={inputCls} {...bind(e, setE, "date")} /></Field>
                <Field label="Received By *"><input required className={inputCls} {...bind(e, setE, "receivedBy")} /></Field>
                <Field label="Reason"><input className={inputCls} {...bind(e, setE, "reason")} /></Field>
              </div>
              {e.employeeId && held.length === 0 && <p className="text-sm text-amber-700">This employee currently holds no returnable items.</p>}
              <LineEditor lines={eLines} setLines={setELines} products={held} conditions={["Good", "Damaged", "Lost"]} defaultCondition="Good" />
              <button className={btnPrimary} type="submit"><RotateCcw size={15} /> Record Employee Return</button>
            </form>
          ) : (
            <form onSubmit={submitVendor} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Vendor *">
                  <select required className={inputCls} value={v.vendorId} onChange={(ev) => setV({ ...v, vendorId: ev.target.value, receiptId: "" })}><option value="">Select</option>{db.vendors.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
                </Field>
                <Field label="Original Receipt *">
                  <select required className={inputCls} {...bind(v, setV, "receiptId")}><option value="">Select</option>{receipts.map((r) => <option key={r.id} value={r.id}>{r.no} · {r.challanNo}</option>)}</select>
                </Field>
                <Field label="Date"><input type="date" className={inputCls} {...bind(v, setV, "date")} /></Field>
                <Field label="Handled By *"><input required className={inputCls} {...bind(v, setV, "receivedBy")} /></Field>
                <Field label="Reason *" className="sm:col-span-2"><input required className={inputCls} {...bind(v, setV, "reason")} placeholder="e.g. Defect found after inspection" /></Field>
              </div>
              <LineEditor lines={vLines} setLines={setVLines} products={receiptProducts} conditions={["Defective", "Wrong Item", "Damaged", "Excess"]} defaultCondition="Defective" />
              <button className={btnPrimary} type="submit"><Truck size={15} /> Submit Vendor Return</button>
            </form>
          )}
        </fieldset>
        {!allowed && <p className="mt-3 text-xs text-amber-700">Your role cannot record returns.</p>}
      </Card>

      <Card title="Return Register">
        <Table heads={["Reference", "Type / Party", "Items", "Reason", "Status", "Action"]} min={1000} empty="No returns yet.">
          {db.returns.map((r) => (
            <tr key={r.id}>
              <td className={td}><p className="font-semibold">{r.no}</p><p className="text-xs text-slate-500">{r.date}</p></td>
              <td className={td}>{r.source}<p className="text-xs text-slate-500">{r.source === "Employee" ? db.employees.find((x) => x.id === r.employeeId)?.name : db.vendors.find((x) => x.id === r.vendorId)?.name}</p></td>
              <td className={td}>{r.lines.map((l) => `${l.qty} × ${pname(db, l.productId)} [${l.condition}]`).join(", ")}</td>
              <td className={td}>{r.reason}{r.inspection && <p className="text-xs text-slate-500">{r.inspection}</p>}</td>
              <td className={td}><Badge>{r.status}</Badge>{r.creditAmount > 0 && <p className="mt-1 text-xs text-slate-500">Credit {money(r.creditAmount)}</p>}</td>
              <td className={td}>
                {r.status === "Pending Inspection" && (
                  <div className="flex flex-wrap gap-2">
                    {(["Restock", "Write off", "Reject"] as const).map((dcs) => (
                      <button key={dcs} className={dcs === "Reject" ? btnDanger : btnGhost} disabled={!allowed} onClick={() => run((d) => inspectReturn(d, r.id, dcs, user.name), { module: "Returns", action: `Inspection: ${dcs}`, detail: r.no })}>{dcs}</button>
                    ))}
                  </div>
                )}
                {r.status === "Returned to Vendor" && (
                  <div className="flex gap-2">
                    <input className={`${inputCls} w-28`} type="number" min="0" placeholder="Credit ৳" value={credit[r.id] ?? String(Math.round(vendorReturnValue(db, r)))} onChange={(ev) => setCredit({ ...credit, [r.id]: ev.target.value })} />
                    <button className={btnGhost} disabled={!allowed} onClick={() => run((d) => markVendorCredit(d, r.id, num(credit[r.id] ?? String(vendorReturnValue(db, r)))), { module: "Returns", action: "Vendor credit", detail: r.no })}>Mark credited</button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}

/* ---------- vendors ---------- */

const blankVendor = { name: "", contact: "", phone: "", email: "", address: "", notes: "", status: "Active" };

function VendorsTab({ ctx }: { ctx: Ctx }) {
  const { db, can, run } = ctx;
  const allowed = can("vendor.manage");
  const [f, setF] = useState(blankVendor);
  const [editing, setEditing] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const ok = run(
      (d) => {
        const name = f.name.trim();
        if (!name) return fail(d, "Vendor name is required.");
        if (d.vendors.some((v) => v.name.toLowerCase() === name.toLowerCase() && v.id !== editing)) return fail(d, "This vendor already exists.");
        const data = { ...f, name, status: f.status as ActiveState };
        if (editing) return { db: { ...d, vendors: upd(d.vendors, editing, data) }, message: "Vendor updated." };
        return { db: { ...d, vendors: [...d.vendors, { id: makeId("v"), ...data }] }, message: "Vendor added." };
      },
      { module: "Vendors", action: editing ? "Update vendor" : "Create vendor", detail: f.name }
    );
    if (ok) { setF(blankVendor); setEditing(null); setShow(false); }
  }

  return (
    <div className="space-y-5">
      <Section title="Vendors" subtitle="Who supplied what, at which price, and what was returned." action={<button className={btnPrimary} disabled={!allowed} onClick={() => { setEditing(null); setF(blankVendor); setShow(true); }}><Plus size={16} /> Add Vendor</button>} />
      {show && (
        <Card title={editing ? "Edit Vendor" : "New Vendor"} action={<button onClick={() => setShow(false)} aria-label="Close"><X size={18} /></button>}>
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Vendor Name *"><input required className={inputCls} {...bind(f, setF, "name")} /></Field>
            <Field label="Contact Person"><input className={inputCls} {...bind(f, setF, "contact")} /></Field>
            <Field label="Phone"><input className={inputCls} {...bind(f, setF, "phone")} /></Field>
            <Field label="Email"><input type="email" className={inputCls} {...bind(f, setF, "email")} /></Field>
            <Field label="Status"><select className={inputCls} {...bind(f, setF, "status")}><option>Active</option><option>Inactive</option></select></Field>
            <Field label="Address"><input className={inputCls} {...bind(f, setF, "address")} /></Field>
            <Field label="Notes" className="sm:col-span-2 lg:col-span-3"><input className={inputCls} {...bind(f, setF, "notes")} /></Field>
            <div className="flex gap-2 sm:col-span-2 lg:col-span-3"><button className={btnPrimary} type="submit">Save Vendor</button><button className={btnGhost} type="button" onClick={() => setShow(false)}>Cancel</button></div>
          </form>
        </Card>
      )}
      <Card>
        <Table heads={["Vendor", "Contact", "Receipts", "Purchased", "Returned value", "Credit received", "Net payable", "Status", "Actions"]} min={1100} empty="No vendors.">
          {db.vendors.flatMap((vd) => {
            const s = vendorStats(db, vd.id);
            const row = (
              <tr key={vd.id} className="hover:bg-slate-50">
                <td className={`${td} font-semibold`}>{vd.name}</td>
                <td className={td}>{vd.contact || "—"}<p className="text-xs text-slate-500">{vd.phone}</p></td>
                <td className={td}>{s.receipts}</td>
                <td className={td}>{money(s.purchased)}</td>
                <td className={td}>{money(s.returnedValue)}</td>
                <td className={td}>{money(s.credited)}</td>
                <td className={`${td} font-semibold`}>{money(Math.max(0, s.purchased - s.returnedValue))}</td>
                <td className={td}><Badge>{vd.status}</Badge></td>
                <td className={td}>
                  <div className="flex gap-2">
                    <button className={btnGhost} onClick={() => setOpen(open === vd.id ? null : vd.id)}>{open === vd.id ? "Hide" : "Products"}</button>
                    <button className={btnGhost} disabled={!allowed} onClick={() => { setEditing(vd.id); setF({ name: vd.name, contact: vd.contact, phone: vd.phone, email: vd.email, address: vd.address, notes: vd.notes, status: vd.status }); setShow(true); }}>Edit</button>
                  </div>
                </td>
              </tr>
            );
            if (open !== vd.id) return [row];
            return [
              row,
              <tr key={`${vd.id}-d`}>
                <td colSpan={9} className="bg-slate-50 px-4 py-4">
                  <Table heads={["Product", "Qty received", "Total value", "Latest price", "Qty returned"]} min={600} empty="No products received from this vendor yet.">
                    {Array.from(s.rows.entries()).map(([pid, x]) => (
                      <tr key={pid}><td className={td}>{pname(db, pid)}</td><td className={td}>{x.qty}</td><td className={td}>{money(x.value)}</td><td className={td}>{money(x.last)}</td><td className={td}>{x.returned}</td></tr>
                    ))}
                  </Table>
                </td>
              </tr>,
            ];
          })}
        </Table>
      </Card>
    </div>
  );
}

/* ---------- ledger & adjustments ---------- */

function LedgerTab({ ctx }: { ctx: Ctx }) {
  const { db, stock, can, run, user } = ctx;
  const allowed = can("stock.adjust");
  const [f, setF] = useState({ productId: "", kind: "Damage", qty: "1", reason: "", date: todayStr() });
  const [productFilter, setProductFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  const rows = useMemo(() => {
    const bal: Record<string, number> = {};
    const asc = [...db.ledger].sort((a, b) => a.at.localeCompare(b.at));
    const withBal = asc.map((e) => {
      bal[e.productId] = round3((bal[e.productId] ?? 0) + e.qty);
      return { e, balance: bal[e.productId] };
    });
    return withBal.reverse().filter(({ e }) => (!productFilter || e.productId === productFilter) && (typeFilter === "All" || e.type === typeFilter));
  }, [db.ledger, productFilter, typeFilter]);

  function submit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const ok = run((d) => createAdjustment(d, user, { ...f, kind: f.kind as AdjKind, qty: num(f.qty) }), { module: "Ledger", action: `${f.kind} request`, detail: pname(db, f.productId) });
    if (ok) setF({ ...f, qty: "1", reason: "" });
  }

  return (
    <div className="space-y-6">
      <Card title="Damage / Loss / Adjustment" subtitle="Reduces or corrects stock with a reason. Needs approval unless you are Super Admin.">
        <fieldset disabled={!allowed} className="m-0 min-w-0 border-0 p-0">
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Field label="Product *"><select required className={inputCls} {...bind(f, setF, "productId")}><option value="">Select</option>{db.products.map((p) => <option key={p.id} value={p.id}>{p.code} — {p.name} ({stock[p.id] ?? 0})</option>)}</select></Field>
            <Field label="Type"><select className={inputCls} {...bind(f, setF, "kind")}><option>Damage</option><option>Loss</option><option>Decrease</option><option>Increase</option></select></Field>
            <Field label="Quantity *"><input required type="number" min="0" step="any" className={inputCls} {...bind(f, setF, "qty")} /></Field>
            <Field label="Date"><input type="date" className={inputCls} {...bind(f, setF, "date")} /></Field>
            <Field label="Reason *"><input required className={inputCls} {...bind(f, setF, "reason")} /></Field>
            <div className="sm:col-span-2 lg:col-span-5"><button className={btnPrimary} type="submit"><ClipboardList size={15} /> Submit</button></div>
          </form>
        </fieldset>
        {!allowed && <p className="mt-3 text-xs text-amber-700">Your role cannot adjust stock.</p>}
        {db.adjustments.length > 0 && (
          <div className="mt-5">
            <Table heads={["Reference", "Product", "Type", "Qty", "Reason", "By", "Status"]} min={800}>
              {db.adjustments.slice(0, 6).map((a) => (
                <tr key={a.id}><td className={td}>{a.no}</td><td className={td}>{pname(db, a.productId)}</td><td className={td}>{a.kind}</td><td className={td}>{a.qty}</td><td className={td}>{a.reason}</td><td className={td}>{a.by}</td><td className={td}><Badge>{a.status}</Badge></td></tr>
              ))}
            </Table>
          </div>
        )}
      </Card>

      <Card
        title="Stock Ledger"
        subtitle="Current stock is always the sum of these entries."
        action={
          <div className="flex flex-wrap gap-2">
            <select className={inputCls} value={productFilter} onChange={(e) => setProductFilter(e.target.value)}><option value="">All products</option>{db.products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
            <select className={inputCls} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>{["All", "Opening", "Receive", "Issue", "Employee Return", "Vendor Return", "Adjustment", "Damage", "Loss", "Reversal"].map((t) => <option key={t}>{t}</option>)}</select>
            <button className={btnGhost} onClick={() => downloadCsv("stock-ledger.csv", [["Date", "Product", "Type", "Change", "Balance", "Reference", "Party", "By", "Note"], ...rows.map(({ e, balance }) => [e.date, pname(db, e.productId), e.type, e.qty, balance, e.ref, e.party, e.by, e.note])])}><Download size={15} /> CSV</button>
          </div>
        }
      >
        <Table heads={["Date", "Product", "Type", "Change", "Balance", "Reference", "Party", "By", "Note"]} min={1100} empty="No ledger entries.">
          {rows.map(({ e, balance }) => (
            <tr key={e.id} className="hover:bg-slate-50">
              <td className={td}>{e.date}</td>
              <td className={`${td} font-medium`}>{pname(db, e.productId)}</td>
              <td className={td}>{e.type}</td>
              <td className={`${td} font-semibold ${e.qty < 0 ? "text-rose-600" : "text-emerald-600"}`}>{e.qty > 0 ? "+" : ""}{e.qty}</td>
              <td className={td}>{balance}</td>
              <td className={td}>{e.ref}</td>
              <td className={td}>{e.party}</td>
              <td className={td}>{e.by}</td>
              <td className={`${td} max-w-[220px]`}>{e.note || "—"}</td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}

/* ---------- reports ---------- */

function ReportsTab({ ctx }: { ctx: Ctx }) {
  const { db, stock } = ctx;
  const [month, setMonth] = useState(todayStr().slice(0, 7));

  const rows = useMemo(
    () =>
      db.products.map((p) => {
        const entries = db.ledger.filter((e) => e.productId === p.id);
        const opening = round3(entries.filter((e) => e.date.slice(0, 7) < month).reduce((s, e) => s + e.qty, 0));
        const inM = entries.filter((e) => e.date.slice(0, 7) === month);
        const sum = (types: LedgerType[]) => round3(inM.filter((e) => types.includes(e.type)).reduce((s, e) => s + e.qty, 0));
        const received = sum(["Receive", "Opening"]);
        const issued = -sum(["Issue", "Reversal"]);
        const empReturn = sum(["Employee Return"]);
        const vendorRet = -sum(["Vendor Return"]);
        const adj = sum(["Adjustment"]);
        const dmg = -sum(["Damage", "Loss"]);
        const closing = round3(opening + received - issued + empReturn - vendorRet + adj - dmg);
        const issuedValue = db.issues
          .filter((i) => (i.status === "Awaiting Acknowledgement" || i.status === "Completed") && i.date.slice(0, 7) === month)
          .reduce((s, i) => s + i.lines.filter((l) => l.productId === p.id).reduce((a, l) => a + l.qty * l.unitCost, 0), 0);
        const receivedValue = db.receipts
          .filter((r) => r.status === "Received" && r.date.slice(0, 7) === month)
          .reduce((s, r) => s + r.lines.filter((l) => l.productId === p.id).reduce((a, l) => a + l.qty * l.unitPrice, 0), 0);
        const lossValue = db.damages.filter((x) => x.productId === p.id && x.date.slice(0, 7) === month).reduce((s, x) => s + x.value, 0);
        return { p, opening, received, issued, empReturn, vendorRet, adj, dmg, closing, issuedValue, receivedValue, lossValue };
      }),
    [db, month]
  );

  const tot = rows.reduce((t, r) => ({ rv: t.rv + r.receivedValue, iv: t.iv + r.issuedValue, lv: t.lv + r.lossValue }), { rv: 0, iv: 0, lv: 0 });
  const low = lowStock(db, stock);
  const dead = deadStock(db, stock);
  const dmgRows = db.damages.filter((x) => x.date.slice(0, 7) === month);

  return (
    <div className="space-y-6">
      <Section
        title="Reports"
        subtitle="Monthly movement, low stock, dead stock, damage and loss."
        action={
          <>
            <input type="month" className={inputCls} value={month} onChange={(e) => setMonth(e.target.value)} />
            <button className={btnGhost} onClick={() => downloadCsv(`movement-${month}.csv`, [["Product", "Opening", "Received/Opening", "Issued", "Employee return", "Vendor return", "Adjustment", "Damage/Loss", "Closing", "Purchased value", "Issued value", "Loss value"], ...rows.map((r) => [r.p.name, r.opening, r.received, r.issued, r.empReturn, r.vendorRet, r.adj, r.dmg, r.closing, r.receivedValue, r.issuedValue, r.lossValue])])}><Download size={15} /> Export month</button>
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat title="Purchased this month" value={money(tot.rv)} tone="blue" />
        <Stat title="Issued this month (cost)" value={money(tot.iv)} tone="violet" />
        <Stat title="Damage / loss (cost)" value={money(tot.lv)} tone="rose" />
      </div>

      <Card title={`Monthly Movement — ${month}`}>
        <Table heads={["Product", "Opening", "Received", "Issued", "Emp. return", "Vendor return", "Adj.", "Dmg/Loss", "Closing", "Issued value", "Loss value"]} min={1200}>
          {rows.map((r) => (
            <tr key={r.p.id}>
              <td className={`${td} font-medium`}>{r.p.name}</td><td className={td}>{r.opening}</td><td className={td}>{r.received}</td><td className={td}>{r.issued}</td>
              <td className={td}>{r.empReturn}</td><td className={td}>{r.vendorRet}</td><td className={td}>{r.adj}</td><td className={td}>{r.dmg}</td>
              <td className={`${td} font-semibold`}>{r.closing}</td><td className={td}>{money(r.issuedValue)}</td><td className={td}>{money(r.lossValue)}</td>
            </tr>
          ))}
        </Table>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Low Stock & Reorder Suggestion">
          <Table heads={["Product", "Stock", "Minimum", "Suggested order"]} min={500} empty="Nothing is below the minimum level.">
            {low.map((p) => (<tr key={p.id}><td className={td}>{p.name}</td><td className={td}>{packText(p, stock[p.id] ?? 0)}</td><td className={td}>{p.minStock}</td><td className={td}>{Math.max(0, round3(p.minStock * 2 - (stock[p.id] ?? 0)))} {p.baseUnit}</td></tr>))}
          </Table>
        </Card>
        <Card title={`Dead / Slow Stock (${db.settings.deadStockDays}+ days without issue)`}>
          <Table heads={["Product", "Stock", "Days idle", "Value locked"]} min={500} empty="No dead stock.">
            {dead.map((x) => (<tr key={x.product.id}><td className={td}>{x.product.name}</td><td className={td}>{stock[x.product.id] ?? 0}</td><td className={td}>{x.days}</td><td className={td}>{money((stock[x.product.id] ?? 0) * x.product.unitCost)}</td></tr>))}
          </Table>
        </Card>
      </div>

      <Card title={`Damage & Loss Register — ${month}`}>
        <Table heads={["Date", "Product", "Type", "Qty", "Source", "Employee", "Reference", "Reason", "Value"]} min={1000} empty="No damage or loss this month.">
          {dmgRows.map((x) => (
            <tr key={x.id}><td className={td}>{x.date}</td><td className={td}>{pname(db, x.productId)}</td><td className={td}><Badge>{x.kind}</Badge></td><td className={td}>{x.qty}</td><td className={td}>{x.source}</td><td className={td}>{db.employees.find((e) => e.id === x.employeeId)?.name ?? "—"}</td><td className={td}>{x.reference}</td><td className={td}>{x.reason}</td><td className={td}>{money(x.value)}</td></tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}