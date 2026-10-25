"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import {
  AlertTriangle, Award, Bell, Boxes, Building2, CheckCircle2, ChevronRight, ClipboardCheck, Clock, Database,
  Download, History, LayoutDashboard, Menu, Monitor, Package, Plus, Search, ShieldCheck, Trophy, Upload, Users, X,
} from "lucide-react";
import AuthGate from "./components/AuthGate";
import type { Initial, Session } from "./components/AuthGate";
import CompanyManagement from "./components/CompanyManagement";
import ImageUpload from "./components/ImageUpload";
import InventoryManagement, {
  Badge, Card, Empty, Field, Img, Notice, PERMS, RANK, ROLES, Section, Stat, Table, bind, btnDanger, btnGhost, btnPrimary,
  decideApproval, deadStock, downloadCsv, fadeIn, fail, inputCls, lowStock, makeId, money, normalizeDb, nowIso, routeApproval,
  td, todayStr, upd, useApp,
} from "./components/InventoryManagement";
import type { Achievement, AppUser, Ctx, Perm, Role } from "./components/InventoryManagement";

/* The app needs a signed-in user, so everything renders inside AuthGate. */
export default function Page() {
  return <AuthGate>{(session, initial, logout) => <Home session={session} initial={initial} logout={logout} />}</AuthGate>;
}

type PageName = "Dashboard" | "Companies" | "Employees" | "Assets" | "Inventory" | "Approvals" | "Achievements" | "Users" | "Audit" | "Backup";

type NavItem = { name: PageName; label: string; icon: typeof Package; show: boolean; badge?: number };

function Home({ session, initial, logout }: { session: Session; initial: Initial; logout: () => void }) {
  const app = useApp(session.id, initial);
  const { ctx } = app;
  const { db, user, can } = ctx;
  const [page, setPage] = useState<PageName>("Dashboard");
  const [sidebar, setSidebar] = useState(false);
  const [bell, setBell] = useState(false);
  const [palette, setPalette] = useState(false);

  useEffect(() => {
    if (!app.valid) logout();
  }, [app.valid, logout]);

  const pending = db.approvals.filter((a) => a.status === "Pending").length;
  const lowCount = lowStock(db, ctx.stock).length;

  const nav: { group: string; items: NavItem[] }[] = [
    { group: "OVERVIEW", items: [{ name: "Dashboard", label: "Dashboard", icon: LayoutDashboard, show: true }] },
    {
      group: "ORGANIZATION",
      items: [
        { name: "Companies", label: "Companies & Offices", icon: Building2, show: true },
        { name: "Employees", label: "Employees", icon: Users, show: true },
        { name: "Assets", label: "Asset Register", icon: Monitor, show: true },
      ],
    },
    { group: "INVENTORY", items: [{ name: "Inventory", label: "Inventory", icon: Package, show: true, badge: lowCount }] },
    {
      group: "CONTROL",
      items: [
        { name: "Approvals", label: "Approvals", icon: ClipboardCheck, show: true, badge: pending },
        { name: "Achievements", label: "Achievements", icon: Trophy, show: true },
      ],
    },
    {
      group: "ADMINISTRATION",
      items: [
        { name: "Users", label: "Users & Access", icon: ShieldCheck, show: can("user.manage") },
        { name: "Audit", label: "Audit Log", icon: History, show: can("audit.view") },
        { name: "Backup", label: "Backup & Settings", icon: Database, show: can("backup") || user.role === "Super Admin" },
      ],
    },
  ];

  const allItems = nav.flatMap((g) => g.items);
  const allowedPage = allItems.find((i) => i.name === page)?.show ?? false;
  const current: PageName = allowedPage ? page : "Dashboard";

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function go(p: PageName) {
    setPage(p);
    setSidebar(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function render() {
    switch (current) {
      case "Dashboard": return <Dashboard ctx={ctx} go={go} />;
      case "Companies": return <CompanyManagement ctx={ctx} view="companies" />;
      case "Employees": return <CompanyManagement ctx={ctx} view="employees" />;
      case "Assets": return <CompanyManagement ctx={ctx} view="assets" />;
      case "Inventory": return <InventoryManagement ctx={ctx} />;
      case "Approvals": return <Approvals ctx={ctx} />;
      case "Achievements": return <Achievements ctx={ctx} />;
      case "Users": return <UsersPage ctx={ctx} />;
      case "Audit": return <AuditPage ctx={ctx} />;
      default: return <BackupPage ctx={ctx} />;
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-blue-50/40 text-slate-800">
      <style>{`@keyframes pidsIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
      @keyframes pidsToast{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:none}}`}</style>

      {sidebar && <button aria-label="Close sidebar" onClick={() => setSidebar(false)} className="fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-sm lg:hidden" />}

      <aside className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:translate-x-0 ${sidebar ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-20 items-center justify-between border-b border-slate-100 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-200"><Boxes size={23} /></div>
            <div><p className="text-base font-extrabold tracking-tight text-slate-900">REAL CAPITA</p><p className="text-[10px] font-semibold tracking-[0.18em] text-slate-500">PIDS</p></div>
          </div>
          <button onClick={() => setSidebar(false)} className="rounded-lg p-2 hover:bg-slate-100 lg:hidden"><X size={19} /></button>
        </div>

        <div className="border-b border-slate-100 p-4">
          <p className="text-[10px] font-bold tracking-wider text-slate-400">SIGNED IN AS</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">{user.name}</p>
          <p className="text-xs text-slate-500">{user.role}</p>
          <button onClick={logout} className={`${btnGhost} mt-3 w-full`}>Sign out</button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {nav.map((g) => {
            const items = g.items.filter((i) => i.show);
            if (!items.length) return null;
            return (
              <div key={g.group}>
                <p className="mb-2 px-3 text-[10px] font-bold tracking-[0.15em] text-slate-400">{g.group}</p>
                <div className="space-y-1">
                  {items.map((i) => {
                    const Icon = i.icon;
                    const active = current === i.name;
                    return (
                      <button key={i.name} onClick={() => go(i.name)} className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all ${active ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-200" : "text-slate-600 hover:translate-x-0.5 hover:bg-slate-100"}`}>
                        <Icon size={18} /><span className="flex-1">{i.label}</span>
                        {!!i.badge && <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${active ? "bg-white/25 text-white" : "bg-amber-100 text-amber-800"}`}>{i.badge}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 p-4 text-[11px] leading-5 text-slate-500">
          <div className="mb-1 flex items-center gap-2 font-semibold text-slate-700"><CheckCircle2 size={15} className="text-emerald-600" /> Connected to server</div>
          Data is saved in the server database and shared by all users.
        </div>
      </aside>

      <div className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between gap-4 border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md sm:px-6 xl:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebar(true)} className="rounded-lg p-2 hover:bg-slate-100 lg:hidden" aria-label="Open menu"><Menu size={21} /></button>
            <div className="hidden text-sm text-slate-400 sm:block">PIDS <ChevronRight className="mx-1 inline" size={14} /> <span className="font-semibold text-slate-700">{current}</span></div>
          </div>

          <button onClick={() => setPalette(true)} className="hidden max-w-md flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left text-sm text-slate-400 transition hover:border-blue-300 hover:bg-white md:flex">
            <Search size={16} /> <span className="flex-1">Search products, employees, challans...</span>
            <kbd className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">Ctrl K</kbd>
          </button>

          <div className="flex items-center gap-3">
            <button onClick={() => setPalette(true)} className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50 md:hidden" aria-label="Search"><Search size={19} /></button>
            <div className="relative">
              <button aria-label="Notifications" onClick={() => setBell(!bell)} className="relative rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-50">
                <Bell size={19} />{pending + lowCount > 0 && <span className="absolute right-2 top-2 h-2 w-2 animate-pulse rounded-full bg-rose-500" />}
              </button>
              {bell && (
                <div className={`absolute right-0 top-12 z-50 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-xl ${fadeIn}`}>
                  <p className="font-bold text-slate-900">Notifications</p>
                  <p className="mt-3 text-sm text-slate-600">{pending} request(s) waiting for approval.</p>
                  <p className="mt-1 text-sm text-slate-600">{lowCount} product(s) at or below minimum stock.</p>
                  <button onClick={() => { setBell(false); go("Approvals"); }} className="mt-3 text-sm font-semibold text-blue-600">Open approvals</button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-slate-800 to-slate-950 text-xs font-bold text-white">{user.name.slice(0, 2).toUpperCase()}</div>
              <div className="hidden sm:block"><p className="text-xs font-semibold text-slate-800">{user.name}</p><p className="text-[10px] text-slate-500">{user.role}</p></div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] p-4 sm:p-6 xl:p-8">
          <div key={current} className={fadeIn}>{render()}</div>
          <footer className="mt-10 flex flex-col justify-between gap-2 border-t border-slate-200 py-5 text-xs text-slate-400 sm:flex-row">
            <span>© 2026 Real Capita · Product Inventory & Distribution System</span>
            <span>Permissions are checked in the browser only (server check is the next stage)</span>
          </footer>
        </main>
      </div>

      {palette && <Palette ctx={ctx} items={allItems.filter((i) => i.show)} go={(p) => { setPalette(false); go(p); }} onClose={() => setPalette(false)} />}

      {app.toast && (
        <div role="status" style={{ animation: "pidsToast 0.3s ease-out" }} className={`fixed bottom-5 right-5 z-50 flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg ${app.toast.tone === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}>
          {app.toast.tone === "ok" ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" /> : <AlertTriangle size={18} className="mt-0.5 shrink-0" />}
          <span>{app.toast.msg}</span>
          <button onClick={app.dismissToast} aria-label="Dismiss"><X size={16} /></button>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   GLOBAL SEARCH (Ctrl + K)
========================================================= */

type Hit = { label: string; sub: string; page: PageName; icon: typeof Package };

function Palette({ ctx, items, go, onClose }: { ctx: Ctx; items: NavItem[]; go: (p: PageName) => void; onClose: () => void }) {
  const { db } = ctx;
  const [q, setQ] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const hits = useMemo<Hit[]>(() => {
    const t = q.trim().toLowerCase();
    const pages: Hit[] = items.map((i) => ({ label: i.label, sub: "Go to page", page: i.name, icon: i.icon }));
    if (!t) return pages;
    const m = (s: string) => s.toLowerCase().includes(t);
    const out: Hit[] = pages.filter((p) => m(p.label));
    db.products.filter((p) => m(`${p.code} ${p.name} ${p.category}`)).slice(0, 5).forEach((p) => out.push({ label: p.name, sub: `Product · ${p.code} · ${ctx.stock[p.id] ?? 0} ${p.baseUnit}`, page: "Inventory", icon: Package }));
    db.employees.filter((e) => m(`${e.empId} ${e.name} ${e.designation}`)).slice(0, 5).forEach((e) => out.push({ label: e.name, sub: `Employee · ${e.empId}`, page: "Employees", icon: Users }));
    db.vendors.filter((v) => m(`${v.name} ${v.contact}`)).slice(0, 4).forEach((v) => out.push({ label: v.name, sub: "Vendor", page: "Inventory", icon: Package }));
    db.receipts.filter((r) => m(`${r.no} ${r.challanNo} ${r.invoiceNo}`)).slice(0, 4).forEach((r) => out.push({ label: `${r.no} · challan ${r.challanNo}`, sub: `Receipt · ${r.status}`, page: "Inventory", icon: Package }));
    db.issues.filter((i) => m(`${i.no} ${i.recipientName} ${i.event}`)).slice(0, 4).forEach((i) => out.push({ label: i.no, sub: `Distribution · ${i.status}`, page: "Inventory", icon: Package }));
    db.assets.filter((a) => m(`${a.tag} ${a.name} ${a.serial}`)).slice(0, 4).forEach((a) => out.push({ label: `${a.name} (${a.tag})`, sub: `Asset · ${a.status}`, page: "Assets", icon: Monitor }));
    db.companies.filter((c) => m(`${c.name} ${c.code}`)).slice(0, 3).forEach((c) => out.push({ label: c.name, sub: `${c.officeCategory} · ${c.code}`, page: "Companies", icon: Building2 }));
    return out.slice(0, 14);
  }, [q, items, db, ctx.stock]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/40 p-4 pt-[12vh] backdrop-blur-sm" onClick={onClose}>
      <div className={`w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl ${fadeIn}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-slate-100 px-4">
          <Search size={18} className="text-slate-400" />
          <input
            ref={ref}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && hits[0] && go(hits[0].page)}
            placeholder="Search products, employees, vendors, challan, assets..."
            className="h-14 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
          <kbd className="rounded-md border border-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">Esc</kbd>
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {hits.length === 0 && <p className="p-6 text-center text-sm text-slate-500">Nothing found for &ldquo;{q}&rdquo;.</p>}
          {hits.map((h, i) => {
            const Icon = h.icon;
            return (
              <button key={i} onClick={() => go(h.page)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-blue-50">
                <span className="rounded-lg bg-slate-100 p-2 text-slate-600"><Icon size={16} /></span>
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-800">{h.label}</span><span className="block truncate text-xs text-slate-500">{h.sub}</span></span>
                <ChevronRight size={15} className="text-slate-300" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   DASHBOARD
========================================================= */

function monthKeys(count: number) {
  const keys: string[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
}

function Dashboard({ ctx, go }: { ctx: Ctx; go: (p: PageName) => void }) {
  const { db, stock, user } = ctx;
  const low = lowStock(db, stock);
  const dead = deadStock(db, stock);
  const pending = db.approvals.filter((a) => a.status === "Pending");
  const value = db.products.reduce((s, p) => s + (stock[p.id] ?? 0) * p.unitCost, 0);
  const awaiting = db.issues.filter((i) => i.status === "Awaiting Acknowledgement").length;
  const last = db.settings.lastBackupAt;
  const backupAge = last ? Math.floor((Date.now() - new Date(last).getTime()) / 86400000) : null;
  const backupDue = backupAge === null || backupAge >= db.settings.backupReminderDays;
  const month = todayStr().slice(0, 7);
  const issuedCost = (key: string) =>
    db.issues.filter((i) => ["Awaiting Acknowledgement", "Completed"].includes(i.status) && i.date.slice(0, 7) === key).reduce((s, i) => s + i.lines.reduce((a, l) => a + l.qty * l.unitCost, 0), 0);
  const purchaseCost = (key: string) =>
    db.receipts.filter((r) => r.status === "Received" && r.date.slice(0, 7) === key).reduce((s, r) => s + r.lines.reduce((a, l) => a + l.qty * l.unitPrice, 0), 0);
  const months = monthKeys(6).map((k) => ({ k, bought: purchaseCost(k), issued: issuedCost(k) }));
  const max = Math.max(1, ...months.flatMap((m) => [m.bought, m.issued]));
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      <Section title={`${greet}, ${user.name.split(" ")[0]}`} subtitle="Inventory, assets, approvals and the latest activity at a glance." action={<button className={btnPrimary} onClick={() => go("Inventory")}><Plus size={16} /> Open Inventory</button>} />
      {backupDue && (ctx.can("backup") || user.role === "Super Admin") && (
        <Notice tone="amber">Backup reminder: {backupAge === null ? "no backup has been downloaded yet." : `last backup was ${backupAge} day(s) ago.`} <button className="font-semibold underline" onClick={() => go("Backup")}>Back up now</button></Notice>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat title="Product Types" value={db.products.filter((p) => p.status === "Active").length} detail="Active products" icon={<Package size={18} />} />
        <Stat title="Stock Value" value={value} format={money} detail="Quantity × latest unit cost" tone="violet" icon={<Boxes size={18} />} />
        <Stat title="Low Stock" value={low.length} detail={`${dead.length} dead / slow-moving`} tone="amber" icon={<AlertTriangle size={18} />} />
        <Stat title="Pending Approvals" value={pending.length} detail={`${awaiting} awaiting employee acknowledgement`} tone="emerald" icon={<Clock size={18} />} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat title="Issued This Month (cost)" value={issuedCost(month)} format={money} icon={<Package size={18} />} />
        <Stat title="Active Employees" value={db.employees.filter((e) => e.status === "Active").length} tone="blue" icon={<Users size={18} />} />
        <Stat title="Assets Assigned" value={db.assets.filter((a) => a.status === "Assigned").length} detail={`of ${db.assets.length} registered`} tone="violet" icon={<Monitor size={18} />} />
      </div>

      <Card title="Purchase vs Issue (last 6 months)" subtitle="Cost value. Blue = purchased, violet = issued">
        <div className="flex h-44 items-end gap-3">
          {months.map((m) => (
            <div key={m.k} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-36 w-full items-end justify-center gap-1.5">
                <div title={`Purchased ${money(m.bought)}`} className="w-1/3 max-w-8 rounded-t-md bg-blue-500 transition-all duration-700" style={{ height: `${Math.max(2, (m.bought / max) * 100)}%` }} />
                <div title={`Issued ${money(m.issued)}`} className="w-1/3 max-w-8 rounded-t-md bg-violet-500 transition-all duration-700" style={{ height: `${Math.max(2, (m.issued / max) * 100)}%` }} />
              </div>
              <span className="text-xs text-slate-500">{m.k.slice(5)}/{m.k.slice(2, 4)}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Card title="Latest 10 Activities" subtitle="Every important action is written to the audit log">
            <Table heads={["When", "User", "Module", "Action", "Detail"]} min={750} empty="No activity yet. Actions you perform appear here.">
              {[...db.audit].reverse().slice(0, 10).map((a) => (
                <tr key={a.id} className="hover:bg-slate-50"><td className={td}>{new Date(a.at).toLocaleString()}</td><td className={td}>{a.userName}</td><td className={td}>{a.module}</td><td className={td}>{a.action}</td><td className={td}>{a.detail}</td></tr>
              ))}
            </Table>
          </Card>
        </div>
        <Card title="Pending Approvals" action={<button className="text-sm font-semibold text-blue-600" onClick={() => go("Approvals")}>View all</button>}>
          {pending.length === 0 ? <Empty text="Nothing is waiting for approval." /> : (
            <div className="space-y-3">
              {pending.slice(0, 5).map((a) => (
                <div key={a.id} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3">
                  <Clock size={18} className="mt-0.5 text-amber-600" />
                  <div className="min-w-0"><p className="text-sm font-semibold text-slate-800">{a.title}</p><p className="mt-1 text-xs text-slate-500">{a.detail} · by {a.requestedByName}</p></div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Low Stock Alerts" action={<AlertTriangle size={19} className="text-amber-500" />}>
          {low.length === 0 ? <Empty text="No low-stock items." /> : (
            <div className="space-y-3">
              {low.map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-xl bg-amber-50 p-3">
                  <Img src={p.image} alt={p.name} className="h-10 w-10" />
                  <div className="flex-1"><p className="text-sm font-semibold text-slate-800">{p.name}</p><p className="text-xs text-slate-500">Minimum {p.minStock} {p.baseUnit}</p></div>
                  <Badge>{`Low · ${stock[p.id] ?? 0}`}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card title="Dead / Slow-moving Stock" subtitle={`No issue for ${db.settings.deadStockDays}+ days`}>
          {dead.length === 0 ? <Empty text="No dead stock detected." /> : (
            <div className="space-y-3">
              {dead.slice(0, 6).map((x) => (
                <div key={x.product.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 text-sm">
                  <span className="font-medium text-slate-800">{x.product.name}</span><span className="text-slate-500">{x.days} days idle · {money((stock[x.product.id] ?? 0) * x.product.unitCost)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

/* =========================================================
   APPROVALS
========================================================= */

function Approvals({ ctx }: { ctx: Ctx }) {
  const { db, user, can, run } = ctx;
  const [comments, setComments] = useState<Record<string, string>>({});
  const pending = db.approvals.filter((a) => a.status === "Pending");
  const history = db.approvals.filter((a) => a.status !== "Pending");

  function decide(id: string, decision: "Approved" | "Rejected", title: string) {
    run((d) => decideApproval(d, id, decision, user, can("approve"), comments[id] ?? ""), { module: "Approvals", action: decision, detail: title });
  }

  return (
    <div className="space-y-6">
      <Section title="Approvals" subtitle="MD / authorized approver decisions. Nobody can approve their own request." />
      {!can("approve") && <Notice tone="amber">Your role cannot approve requests. You can follow the status of your own requests here.</Notice>}
      <Card title={`Pending (${pending.length})`}>
        {pending.length === 0 ? <Empty text="No pending requests." /> : (
          <div className="space-y-3">
            {pending.map((a) => {
              const own = a.requestedBy === user.id;
              return (
                <div key={a.id} className="rounded-xl border border-slate-200 p-4 transition hover:shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><p className="font-semibold text-slate-900">{a.title}</p><p className="mt-1 text-sm text-slate-600">{a.detail}</p><p className="mt-1 text-xs text-slate-500">Requested by {a.requestedByName} · {new Date(a.requestedAt).toLocaleString()}</p></div>
                    <Badge>Pending</Badge>
                  </div>
                  {can("approve") && (
                    own ? <p className="mt-3 text-xs text-amber-700">You requested this, so another approver must decide.</p> : (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <input className={`${inputCls} max-w-sm`} placeholder="Comment (required to reject)" value={comments[a.id] ?? ""} onChange={(e) => setComments({ ...comments, [a.id]: e.target.value })} />
                        <button className={btnPrimary} onClick={() => decide(a.id, "Approved", a.title)}>Approve</button>
                        <button className={btnDanger} onClick={() => decide(a.id, "Rejected", a.title)}>Reject</button>
                      </div>
                    )
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
      <Card title="History">
        <Table heads={["Request", "Requested by", "Decision", "Decided by", "Comment"]} min={800} empty="No decisions yet.">
          {history.map((a) => (
            <tr key={a.id} className="hover:bg-slate-50"><td className={td}><p className="font-medium">{a.title}</p><p className="text-xs text-slate-500">{a.detail}</p></td><td className={td}>{a.requestedByName}<p className="text-xs text-slate-500">{new Date(a.requestedAt).toLocaleString()}</p></td><td className={td}><Badge>{a.status}</Badge></td><td className={td}>{a.decidedBy}<p className="text-xs text-slate-500">{a.decidedAt && new Date(a.decidedAt).toLocaleString()}</p></td><td className={td}>{a.comment || "—"}</td></tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}

/* =========================================================
   ACHIEVEMENTS / OUTCOMES
========================================================= */

const blankAch = { title: "", category: "Milestone", date: todayStr(), companyId: "", outcome: "", metric: "", notes: "", image: "" };

function Achievements({ ctx }: { ctx: Ctx }) {
  const { db, can, run, user } = ctx;
  const allowed = can("achievement.manage");
  const [f, setF] = useState(blankAch);
  const [show, setShow] = useState(false);
  const [company, setCompany] = useState("All");
  const [q, setQ] = useState("");
  const list = db.achievements
    .filter((a) => (company === "All" || a.companyId === company) && `${a.title} ${a.outcome} ${a.metric} ${a.category}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date));
  const byCat = list.reduce<Record<string, number>>((m, a) => ({ ...m, [a.category]: (m[a.category] ?? 0) + 1 }), {});

  function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const ok = run(
      (d) => {
        if (!f.title.trim() || !f.outcome.trim()) return fail(d, "Title and outcome are required.");
        const a: Achievement = { id: makeId("ac"), ...f, title: f.title.trim(), outcome: f.outcome.trim(), createdBy: user.name };
        return { db: { ...d, achievements: [a, ...d.achievements] }, message: "Achievement recorded." };
      },
      { module: "Achievements", action: "Create", detail: f.title }
    );
    if (ok) { setF(blankAch); setShow(false); }
  }

  return (
    <div className="space-y-6">
      <Section title="Achievements & Outcomes" subtitle="A record of what the company achieved and the result of each effort." action={<button className={btnPrimary} disabled={!allowed} onClick={() => setShow(true)}><Plus size={16} /> Add Achievement</button>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat title="Total Records" value={list.length} tone="blue" icon={<Trophy size={18} />} />
        {Object.entries(byCat).slice(0, 3).map(([k, v]) => <Stat key={k} title={k} value={v} tone="emerald" icon={<Award size={18} />} />)}
      </div>
      {show && (
        <Card title="New Achievement" action={<button onClick={() => setShow(false)} aria-label="Close"><X size={18} /></button>}>
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Title *"><input required className={inputCls} {...bind(f, setF, "title")} /></Field>
            <Field label="Category"><select className={inputCls} {...bind(f, setF, "category")}>{["Milestone", "Sales", "Project", "Award", "Compliance", "Cost Saving", "Other"].map((c) => <option key={c}>{c}</option>)}</select></Field>
            <Field label="Date"><input type="date" className={inputCls} {...bind(f, setF, "date")} /></Field>
            <Field label="Company / Office"><select className={inputCls} {...bind(f, setF, "companyId")}><option value="">Group level</option>{db.companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
            <Field label="Measured Result"><input className={inputCls} {...bind(f, setF, "metric")} placeholder="e.g. 120 units sold" /></Field>
            <Field label="Outcome *"><input required className={inputCls} {...bind(f, setF, "outcome")} /></Field>
            <Field label="Notes" className="sm:col-span-2 lg:col-span-3"><input className={inputCls} {...bind(f, setF, "notes")} /></Field>
            <div className="sm:col-span-2 lg:col-span-3"><ImageUpload label="Photo / Evidence" value={f.image} onChange={(v) => setF({ ...f, image: v })} compact /></div>
            <div className="flex gap-2 sm:col-span-2 lg:col-span-3"><button className={btnPrimary} type="submit">Save</button><button type="button" className={btnGhost} onClick={() => setShow(false)}>Cancel</button></div>
          </form>
        </Card>
      )}
      <Card
        title="Achievement Log"
        action={
          <div className="flex flex-wrap gap-2">
            <select className={inputCls} value={company} onChange={(e) => setCompany(e.target.value)}><option value="All">All companies</option>{db.companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            <div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className={`${inputCls} pl-9`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." /></div>
          </div>
        }
      >
        <Table heads={["Achievement", "Category", "Company", "Result", "Outcome", "Date"]} min={900} empty="No achievements recorded.">
          {list.map((a) => (
            <tr key={a.id} className="hover:bg-slate-50"><td className={td}><div className="flex items-center gap-3"><Img src={a.image} alt={a.title} /><div><p className="font-semibold">{a.title}</p><p className="text-xs text-slate-500">{a.notes}</p></div></div></td><td className={td}><span className="inline-flex items-center gap-1"><Award size={14} className="text-amber-500" />{a.category}</span></td><td className={td}>{db.companies.find((c) => c.id === a.companyId)?.name ?? "Group"}</td><td className={td}>{a.metric || "—"}</td><td className={td}>{a.outcome}</td><td className={td}>{a.date}</td></tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}

/* =========================================================
   USERS & ACCESS
========================================================= */

function UsersPage({ ctx }: { ctx: Ctx }) {
  const { db, user, run } = ctx;
  const isSA = user.role === "Super Admin";
  const creatable = ROLES.filter((r) => isSA || RANK[r] > RANK[user.role]);
  const [f, setF] = useState({ name: "", role: creatable[0] ?? "Receptionist", employeeId: "", password: "" });
  const [reset, setReset] = useState({ userId: "", password: "" });

  async function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const id = makeId("u");
    const ok = run(
      (d) => {
        const name = f.name.trim();
        if (!name) return fail(d, "User name is required.");
        if (isSA && f.password.length < 8) return fail(d, "Password must be at least 8 characters.");
        if (!creatable.includes(f.role as Role)) return fail(d, "You cannot create a user at this level.");
        if (d.users.some((u) => u.name.toLowerCase() === name.toLowerCase())) return fail(d, "A user with this name already exists.");
        const u: AppUser = { id, name, role: f.role as Role, employeeId: f.employeeId, active: true, backupAccess: false, createdBy: user.name, createdAt: todayStr() };
        return { db: { ...d, users: [...d.users, u] }, message: "User created." };
      },
      { module: "Users", action: "Create user", detail: `${f.name} (${f.role})` }
    );
    if (!ok) return;
    if (isSA) {
      await ctx.flush?.();
      const res = await fetch("/api/auth/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: id, password: f.password }) });
      if (!res.ok) ctx.notify("User created, but the password was not set. Use Set / reset password below.", "error");
    } else {
      ctx.notify("User created. The Super Admin must set a password before this user can sign in.");
    }
    setF({ ...f, name: "", employeeId: "", password: "" });
  }

  async function resetPassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await ctx.flush?.();
    const res = await fetch("/api/auth/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(reset) });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      ctx.notify("Password saved. That user was signed out everywhere.");
      setReset({ userId: "", password: "" });
    } else {
      ctx.notify(data.error ?? "Could not set the password.", "error");
    }
  }

  function deactivate(u: AppUser) {
    if (u.id === user.id) { ctx.notify("You cannot deactivate yourself.", "error"); return; }
    if (!isSA && RANK[u.role] <= RANK[user.role]) { ctx.notify("You cannot manage a user at an equal or higher level.", "error"); return; }
    run((d) => routeApproval(d, user, "userDeactivate", u.id, `Deactivate ${u.name}`, `${u.role} account`), { module: "Users", action: "Deactivate request", detail: u.name });
  }

  function reactivate(u: AppUser) {
    run((d) => ({ db: { ...d, users: upd(d.users, u.id, { active: true }) }, message: `${u.name} reactivated.` }), { module: "Users", action: "Reactivate user", detail: u.name });
  }

  function toggleBackup(u: AppUser) {
    run(
      (d) => ({ db: { ...d, users: upd(d.users, u.id, { backupAccess: !u.backupAccess }) }, message: `Backup access ${u.backupAccess ? "removed from" : "granted to"} ${u.name}.` }),
      { module: "Users", action: "Backup access", detail: `${u.name}: ${u.backupAccess ? "removed" : "granted"}` }
    );
  }

  function togglePerm(role: Role, perm: Perm) {
    run(
      (d) => {
        const has = d.perms[role].includes(perm);
        const next = has ? d.perms[role].filter((x) => x !== perm) : [...d.perms[role], perm];
        return { db: { ...d, perms: { ...d.perms, [role]: next } }, message: "Permission updated." };
      },
      { module: "Users", action: "Change permission", detail: `${role}: ${perm}` }
    );
  }

  return (
    <div className="space-y-6">
      <Section title="Users & Access" subtitle="Four roles, hierarchy rules, backup access and the permission matrix." />
      <Notice>Hierarchy rule: you can only create or deactivate users below your own level. Deactivation by anyone except the Super Admin goes through approval, and history is always preserved.</Notice>

      <Card title="Add User">
        <form onSubmit={add} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Full name *"><input required className={inputCls} {...bind(f, setF, "name")} /></Field>
          <Field label="Role"><select className={inputCls} {...bind(f, setF, "role")}>{creatable.map((r) => <option key={r}>{r}</option>)}</select></Field>
          <Field label="Linked employee (optional)">
            <select className={inputCls} {...bind(f, setF, "employeeId")}>
              <option value="">None</option>
              {db.employees.filter((e) => e.status === "Active").map((e) => <option key={e.id} value={e.id}>{e.empId} — {e.name}</option>)}
            </select>
          </Field>
          {isSA && <Field label="Password * (min 8)"><input type="password" required minLength={8} className={inputCls} {...bind(f, setF, "password")} /></Field>}
          <div className="flex items-end"><button className={btnPrimary} type="submit" disabled={!creatable.length}><Plus size={16} /> Create user</button></div>
        </form>
      </Card>

      {isSA && (
        <Card title="Set / reset password" subtitle="Also use this to give a password to the demo users (Sub Admin, Manager, Receptionist).">
          <form onSubmit={resetPassword} className="grid gap-4 sm:grid-cols-3">
            <Field label="User">
              <select required className={inputCls} value={reset.userId} onChange={(e) => setReset({ ...reset, userId: e.target.value })}>
                <option value="">Select</option>
                {db.users.map((u) => <option key={u.id} value={u.id}>{u.name} — {u.role}</option>)}
              </select>
            </Field>
            <Field label="New password (min 8)"><input type="password" required minLength={8} className={inputCls} value={reset.password} onChange={(e) => setReset({ ...reset, password: e.target.value })} /></Field>
            <div className="flex items-end"><button className={btnPrimary} type="submit">Save password</button></div>
          </form>
        </Card>
      )}

      <Card title={`Users (${db.users.length})`}>
        <Table heads={["User", "Role", "Linked employee", "Created by", "Backup access", "Status", "Actions"]} min={1000} empty="No users.">
          {db.users.map((u) => {
            const pendingReq = db.approvals.some((a) => a.kind === "userDeactivate" && a.refId === u.id && a.status === "Pending");
            return (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className={`${td} font-semibold`}>{u.name}</td>
                <td className={td}>{u.role}</td>
                <td className={td}>{db.employees.find((e) => e.id === u.employeeId)?.name ?? "—"}</td>
                <td className={td}>{u.createdBy}<p className="text-xs text-slate-500">{u.createdAt}</p></td>
                <td className={td}>
                  {u.role === "Super Admin" ? <Badge>Always</Badge> : isSA ? (
                    <label className="inline-flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" checked={u.backupAccess} onChange={() => toggleBackup(u)} />{u.backupAccess ? "Granted" : "Not granted"}</label>
                  ) : <Badge>{u.backupAccess ? "Granted" : "Not granted"}</Badge>}
                </td>
                <td className={td}><Badge>{u.active ? "Active" : "Inactive"}</Badge>{pendingReq && <p className="mt-1"><Badge>Deactivation pending</Badge></p>}</td>
                <td className={td}>
                  {u.active ? (
                    <button className={btnDanger} disabled={pendingReq} onClick={() => deactivate(u)}>{isSA ? "Deactivate" : "Request deactivation"}</button>
                  ) : isSA && <button className={btnGhost} onClick={() => reactivate(u)}>Reactivate</button>}
                </td>
              </tr>
            );
          })}
        </Table>
      </Card>

      <Card title="Permission Matrix" subtitle="Only the Super Admin can change permissions. Super Admin always has every permission.">
        <Table heads={["Permission", "Super Admin", "Sub Admin", "Manager", "Receptionist"]} min={800}>
          {PERMS.map(([key, label]) => (
            <tr key={key} className="hover:bg-slate-50">
              <td className={`${td} font-medium`}>{label}</td>
              <td className={td}><Badge>Yes</Badge></td>
              {(["Sub Admin", "Manager", "Receptionist"] as Role[]).map((role) => (
                <td key={role} className={td}>
                  <input type="checkbox" aria-label={`${role} ${label}`} disabled={!isSA} checked={db.perms[role].includes(key)} onChange={() => togglePerm(role, key)} />
                </td>
              ))}
            </tr>
          ))}
        </Table>
        <p className="mt-3 text-xs text-slate-500">Database backup is not part of this matrix: only the Super Admin can back up by default, and can grant backup access to individual users above.</p>
      </Card>
    </div>
  );
}

/* =========================================================
   AUDIT LOG
========================================================= */

function AuditPage({ ctx }: { ctx: Ctx }) {
  const { db } = ctx;
  const [q, setQ] = useState("");
  const [mod, setMod] = useState("All");
  const [who, setWho] = useState("All");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const modules = useMemo(() => ["All", ...Array.from(new Set(db.audit.map((a) => a.module)))], [db.audit]);
  const people = useMemo(() => ["All", ...Array.from(new Set(db.audit.map((a) => a.userName)))], [db.audit]);

  const rows = useMemo(
    () =>
      [...db.audit].reverse().filter((a) => {
        const day = a.at.slice(0, 10);
        return (
          (mod === "All" || a.module === mod) &&
          (who === "All" || a.userName === who) &&
          (!from || day >= from) &&
          (!to || day <= to) &&
          `${a.action} ${a.detail} ${a.userName}`.toLowerCase().includes(q.toLowerCase())
        );
      }),
    [db.audit, mod, who, q, from, to]
  );

  return (
    <div className="space-y-6">
      <Section
        title="Audit Log"
        subtitle="Who did what and when. The interface has no edit or delete option for these records."
        action={<button className={btnGhost} onClick={() => downloadCsv("audit-log.csv", [["When", "User", "Role", "Module", "Action", "Detail"], ...rows.map((a) => [a.at, a.userName, a.role, a.module, a.action, a.detail])])}><Download size={15} /> Export CSV</button>}
      />
      <Card>
        <div className="mb-4 grid gap-3 md:grid-cols-5">
          <input className={`${inputCls} md:col-span-2`} placeholder="Search action or detail..." value={q} onChange={(e) => setQ(e.target.value)} />
          <select className={inputCls} value={mod} onChange={(e) => setMod(e.target.value)}>{modules.map((m) => <option key={m}>{m}</option>)}</select>
          <select className={inputCls} value={who} onChange={(e) => setWho(e.target.value)}>{people.map((p) => <option key={p}>{p}</option>)}</select>
          <div className="flex gap-2"><input type="date" className={inputCls} value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" /><input type="date" className={inputCls} value={to} onChange={(e) => setTo(e.target.value)} aria-label="To date" /></div>
        </div>
        <Table heads={["When", "User", "Role", "Module", "Action", "Detail"]} min={950} empty="No audit entries match.">
          {rows.slice(0, 500).map((a) => (
            <tr key={a.id} className="hover:bg-slate-50">
              <td className={td}>{new Date(a.at).toLocaleString()}</td><td className={td}>{a.userName}</td><td className={td}>{a.role}</td>
              <td className={td}>{a.module}</td><td className={`${td} font-medium`}>{a.action}</td><td className={td}>{a.detail}</td>
            </tr>
          ))}
        </Table>
        {rows.length > 500 && <p className="mt-3 text-xs text-slate-500">Showing the latest 500 of {rows.length} entries. Use Export CSV for all of them.</p>}
      </Card>
      <Notice tone="amber">In production the audit table must be append-only on the server (no update or delete rights for any application user). This version still saves the whole data set as one record, so the next stage moves audit writes to the server.</Notice>
    </div>
  );
}

/* =========================================================
   BACKUP & SETTINGS
========================================================= */

function BackupPage({ ctx }: { ctx: Ctx }) {
  const { db, user, can, run, notify } = ctx;
  const isSA = user.role === "Super Admin";
  const [nums, setNums] = useState({ dead: String(db.settings.deadStockDays), remind: String(db.settings.backupReminderDays) });
  const sizeKb = useMemo(() => Math.round(JSON.stringify(db).length / 1024), [db]);
  const rules: { key: keyof typeof db.settings.approvals; label: string; locked?: boolean }[] = [
    { key: "issue", label: "Distribution to employees, clients and guests" },
    { key: "receipt", label: "Stock receiving" },
    { key: "adjustment", label: "Stock adjustment, damage, loss and stock take" },
    { key: "vendorReturn", label: "Vendor returns" },
    { key: "userDeactivate", label: "User deactivation (always required for non-Super Admin)", locked: true },
  ];

  function download() {
    if (!can("backup")) {
      notify("You do not have backup permission.", "error");
      return;
    }
    const d = new Date();
    const stamp = `${todayStr()}-${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}`;
    const url = URL.createObjectURL(new Blob([JSON.stringify(db)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `pids-backup-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    run((x) => ({ db: { ...x, settings: { ...x.settings, lastBackupAt: nowIso() } }, message: "Backup downloaded." }), {
      module: "Backup", action: "Download backup", detail: `${db.products.length} products, ${db.ledger.length} ledger entries, ${sizeKb} KB`,
    });
  }

  function restore(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!isSA) {
      notify("Only the Super Admin can restore a backup.", "error");
      return;
    }
    file
      .text()
      .then((text) => {
        const restored = normalizeDb(JSON.parse(text));
        if (!restored) {
          notify("This file is not a valid PIDS backup.", "error");
          return;
        }
        if (!window.confirm("Restore this backup? Current data on the server will be replaced.")) return;
        run(() => ({ db: restored, message: "Backup restored." }), { module: "Backup", action: "Restore backup", detail: file.name });
      })
      .catch(() => notify("Could not read this backup file.", "error"));
  }

  function toggleRule(kind: keyof typeof db.settings.approvals) {
    run(
      (d) => ({ db: { ...d, settings: { ...d.settings, approvals: { ...d.settings.approvals, [kind]: !d.settings.approvals[kind] } } }, message: "Approval rule updated." }),
      { module: "Settings", action: "Approval rule", detail: `${kind}: ${db.settings.approvals[kind] ? "off" : "on"}` }
    );
  }

  function saveNumbers(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const dead = Math.floor(Number(nums.dead));
    const remind = Math.floor(Number(nums.remind));
    run(
      (d) => {
        if (!(dead >= 1) || !(remind >= 1)) return fail(d, "Both values must be whole numbers of 1 or more.");
        return { db: { ...d, settings: { ...d.settings, deadStockDays: dead, backupReminderDays: remind } }, message: "Settings saved." };
      },
      { module: "Settings", action: "Thresholds", detail: `dead stock ${dead} days, backup reminder ${remind} days` }
    );
  }

  const last = db.settings.lastBackupAt;

  return (
    <div className="space-y-6">
      <Section title="Backup & Settings" subtitle="Database backup is limited to the Super Admin and users the Super Admin has authorized." />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat title="Last Backup" value={last ? new Date(last).toLocaleDateString() : "Never"} detail={last ? new Date(last).toLocaleTimeString() : "Download a backup now"} tone={last ? "emerald" : "rose"} icon={<Database size={18} />} />
        <Stat title="Data Size" value={`${sizeKb} KB`} detail="Size of the whole data set" tone="violet" icon={<Boxes size={18} />} />
        <Stat title="Ledger Entries" value={db.ledger.length} detail={`${db.audit.length} audit entries`} icon={<History size={18} />} />
      </div>

      <Card title="Database Backup" subtitle="The backup file contains all data including images and challan copies.">
        <div className="flex flex-wrap items-center gap-3">
          <button className={btnPrimary} disabled={!can("backup")} onClick={download}><Download size={16} /> Download Backup</button>
          {isSA && (
            <label className={`${btnGhost} cursor-pointer`}>
              <Upload size={15} /> Restore from file
              <input type="file" accept="application/json,.json" className="sr-only" onChange={restore} />
            </label>
          )}
        </div>
        {!can("backup") && <p className="mt-3 text-xs text-amber-700">You do not have backup permission. Ask the Super Admin to grant it in Users & Access.</p>}
        {!isSA && can("backup") && <p className="mt-3 text-xs text-slate-500">Restoring a backup is reserved for the Super Admin.</p>}
      </Card>

      {isSA ? (
        <>
          <Card title="Approval Rules" subtitle="Requests from non-Super Admin users wait for an approver when a rule is on. The Super Admin acts as MD.">
            <div className="space-y-2">
              {rules.map((r) => (
                <label key={r.key} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 text-sm transition hover:bg-slate-50">
                  <span className="font-medium text-slate-700">{r.label}</span>
                  <input type="checkbox" disabled={r.locked} checked={r.locked ? true : db.settings.approvals[r.key]} onChange={() => toggleRule(r.key)} />
                </label>
              ))}
            </div>
          </Card>

          <Card title="Thresholds">
            <form onSubmit={saveNumbers} className="grid gap-4 sm:grid-cols-3">
              <Field label="Dead stock after (days without issue)"><input type="number" min="1" className={inputCls} value={nums.dead} onChange={(e) => setNums({ ...nums, dead: e.target.value })} /></Field>
              <Field label="Backup reminder every (days)"><input type="number" min="1" className={inputCls} value={nums.remind} onChange={(e) => setNums({ ...nums, remind: e.target.value })} /></Field>
              <div className="flex items-end"><button className={btnPrimary} type="submit">Save</button></div>
            </form>
          </Card>
        </>
      ) : (
        <Notice>Approval rules and thresholds can only be changed by the Super Admin.</Notice>
      )}
    </div>
  );
}