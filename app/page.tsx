
"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  Award,
  Bell,
  Boxes,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Database,
  Download,
  History,
  LayoutDashboard,
  Menu,
  Monitor,
  Package,
  Plus,
  ShieldCheck,
  Trophy,
  Upload,
  Users,
  X,
  ChevronRight,
  AlertTriangle,
  Clock,
} from "lucide-react";

import CompanyManagement from "./components/CompanyManagement";
import ImageUpload from "./components/ImageUpload";

import InventoryManagement, {
  Badge,
  Card,
  Empty,
  Field,
  Img,
  Notice,
  PERMS,
  RANK,
  ROLES,
  Section,
  Stat,
  Table,
  bind,
  btnDanger,
  btnGhost,
  btnPrimary,
  decideApproval,
  deadStock,
  downloadCsv,
  fail,
  inputCls,
  lowStock,
  makeId,
  money,
  normalizeDb,
  nowIso,
  routeApproval,
  td,
  todayStr,
  upd,
  useApp,
} from "./components/InventoryManagement";

import type {
  Achievement,
  AppUser,
  Ctx,
  Perm,
  Role,
} from "./components/InventoryManagement";

type Page =
  | "Dashboard"
  | "Companies"
  | "Employees"
  | "Assets"
  | "Inventory"
  | "Approvals"
  | "Achievements"
  | "Users"
  | "Audit"
  | "Backup";

export default function Home() {
  const app = useApp();
  const { ctx } = app;
  const { db, user, can } = ctx;

  const [page, setPage] = useState<Page>("Dashboard");
  const [sidebar, setSidebar] = useState(false);
  const [bell, setBell] = useState(false);

  const pending = db.approvals.filter(
    (a) => a.status === "Pending"
  ).length;

  const lowCount = lowStock(db, ctx.stock).length;

  const nav: {
    group: string;
    items: {
      name: Page;
      label: string;
      icon: typeof Package;
      show: boolean;
      badge?: number;
    }[];
  }[] = [
    {
      group: "OVERVIEW",
      items: [
        {
          name: "Dashboard",
          label: "Dashboard",
          icon: LayoutDashboard,
          show: true,
        },
      ],
    },
    {
      group: "ORGANIZATION",
      items: [
        {
          name: "Companies",
          label: "Companies & Offices",
          icon: Building2,
          show: true,
        },
        {
          name: "Employees",
          label: "Employees",
          icon: Users,
          show: true,
        },
        {
          name: "Assets",
          label: "Asset Register",
          icon: Monitor,
          show: true,
        },
      ],
    },
    {
      group: "INVENTORY",
      items: [
        {
          name: "Inventory",
          label: "Inventory",
          icon: Package,
          show: true,
          badge: lowCount,
        },
      ],
    },
    {
      group: "CONTROL",
      items: [
        {
          name: "Approvals",
          label: "Approvals",
          icon: ClipboardCheck,
          show: true,
          badge: pending,
        },
        {
          name: "Achievements",
          label: "Achievements",
          icon: Trophy,
          show: true,
        },
      ],
    },
    {
      group: "ADMINISTRATION",
      items: [
        {
          name: "Users",
          label: "Users & Access",
          icon: ShieldCheck,
          show: can("user.manage"),
        },
        {
          name: "Audit",
          label: "Audit Log",
          icon: History,
          show: can("audit.view"),
        },
        {
          name: "Backup",
          label: "Backup & Settings",
          icon: Database,
          show: can("backup") || user.role === "Super Admin",
        },
      ],
    },
  ];

  const allowedPage =
    nav
      .flatMap((group) => group.items)
      .find((item) => item.name === page)?.show ?? false;

  const current: Page = allowedPage ? page : "Dashboard";

  function render() {
    switch (current) {
      case "Dashboard":
        return <Dashboard ctx={ctx} go={setPage} />;

      case "Companies":
        return <CompanyManagement ctx={ctx} view="companies" />;

      case "Employees":
        return <CompanyManagement ctx={ctx} view="employees" />;

      case "Assets":
        return <CompanyManagement ctx={ctx} view="assets" />;

      case "Inventory":
        return <InventoryManagement ctx={ctx} />;

      case "Approvals":
        return <Approvals ctx={ctx} />;

      case "Achievements":
        return <Achievements ctx={ctx} />;

      case "Users":
        return <UsersPage ctx={ctx} />;

      case "Audit":
        return <AuditPage ctx={ctx} />;

      case "Backup":
        return <BackupPage ctx={ctx} />;

      default:
        return <Dashboard ctx={ctx} go={setPage} />;
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {sidebar && (
        <button
          aria-label="Close sidebar"
          onClick={() => setSidebar(false)}
          className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${
          sidebar ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-slate-100 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Boxes size={23} />
            </div>

            <div>
              <p className="text-base font-extrabold tracking-tight text-slate-900">
                REAL CAPITA
              </p>
              <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-500">
                PIDS · DEMO
              </p>
            </div>
          </div>

          <button
            onClick={() => setSidebar(false)}
            className="rounded-lg p-2 hover:bg-slate-100 lg:hidden"
            aria-label="Close menu"
          >
            <X size={19} />
          </button>
        </div>

        <div className="border-b border-slate-100 p-4">
          <label className="mb-1 block text-[10px] font-bold tracking-wider text-slate-400">
            ACTING AS (DEMO SWITCH)
          </label>

          <select
            className={inputCls}
            value={app.userId}
            onChange={(e) => app.setUserId(e.target.value)}
          >
            {db.users
              .filter((u) => u.active)
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} — {u.role}
                </option>
              ))}
          </select>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {nav.map((group) => {
            const items = group.items.filter((item) => item.show);

            if (!items.length) return null;

            return (
              <div key={group.group}>
                <p className="mb-2 px-3 text-[10px] font-bold tracking-[0.15em] text-slate-400">
                  {group.group}
                </p>

                <div className="space-y-1">
                  {items.map((item) => {
                    const Icon = item.icon;
                    const active = current === item.name;

                    return (
                      <button
                        key={item.name}
                        onClick={() => {
                          setPage(item.name);
                          setSidebar(false);
                        }}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                          active
                            ? "bg-blue-600 text-white shadow-sm"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <Icon size={18} />

                        <span className="flex-1">{item.label}</span>

                        {!!item.badge && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                              active
                                ? "bg-white/20 text-white"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 p-4 text-[11px] leading-5 text-slate-500">
          <div className="mb-1 flex items-center gap-2 font-semibold text-slate-700">
            <CheckCircle2 size={15} className="text-emerald-600" />
            Browser demo
          </div>
          Data is saved in this browser only. The role switch is not real security.
        </div>
      </aside>

      <div className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 xl:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebar(true)}
              className="rounded-lg p-2 hover:bg-slate-100 lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={21} />
            </button>

            <div className="text-sm text-slate-400">
              PIDS <ChevronRight className="mx-1 inline" size={14} />
              <span className="font-semibold text-slate-700">{current}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                aria-label="Notifications"
                onClick={() => setBell((value) => !value)}
                className="relative rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50"
              >
                <Bell size={19} />

                {pending + lowCount > 0 && (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500" />
                )}
              </button>

              {bell && (
                <div className="absolute right-0 top-12 z-50 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
                  <p className="font-bold text-slate-900">Notifications</p>

                  <p className="mt-3 text-sm text-slate-600">
                    {pending} request(s) waiting for approval.
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    {lowCount} product(s) at or below minimum stock.
                  </p>

                  <button
                    onClick={() => {
                      setBell(false);
                      setPage("Approvals");
                    }}
                    className="mt-3 text-sm font-semibold text-blue-600"
                  >
                    Open approvals
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                {user.name.slice(0, 2).toUpperCase()}
              </div>

              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-slate-800">
                  {user.name}
                </p>
                <p className="text-[10px] text-slate-500">{user.role}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] p-4 sm:p-6 xl:p-8">
          {render()}

          <footer className="mt-10 flex flex-col justify-between gap-2 border-t border-slate-200 py-5 text-xs text-slate-400 sm:flex-row">
            <span>
              © 2026 Real Capita · Product Inventory & Distribution System
            </span>
            <span>
              Frontend demo · connect a server database before production use
            </span>
          </footer>
        </main>
      </div>

      {app.toast && (
        <div
          role="status"
          className={`fixed bottom-5 right-5 z-50 flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg ${
            app.toast.tone === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {app.toast.tone === "ok" ? (
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          ) : (
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          )}

          <span>{app.toast.msg}</span>

          <button
            onClick={app.dismissToast}
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   DASHBOARD
========================================================= */

function Dashboard({
  ctx,
  go,
}: {
  ctx: Ctx;
  go: (page: Page) => void;
}) {
  const { db, stock } = ctx;

  const low = lowStock(db, stock);
  const dead = deadStock(db, stock);

  const pending = db.approvals.filter(
    (approval) => approval.status === "Pending"
  );

  const value = db.products.reduce(
    (sum, product) =>
      sum + (stock[product.id] ?? 0) * product.unitCost,
    0
  );

  const awaiting = db.issues.filter(
    (issue) => issue.status === "Awaiting Acknowledgement"
  ).length;

  const last = db.settings.lastBackupAt;

  const backupAge = last
    ? Math.floor(
        (Date.now() - new Date(last).getTime()) / 86400000
      )
    : null;

  const backupDue =
    backupAge === null ||
    backupAge >= db.settings.backupReminderDays;

  const month = todayStr().slice(0, 7);

  const issuedThisMonth = db.issues
    .filter(
      (issue) =>
        ["Awaiting Acknowledgement", "Completed"].includes(issue.status) &&
        issue.date.slice(0, 7) === month
    )
    .reduce(
      (sum, issue) =>
        sum +
        issue.lines.reduce(
          (lineSum, line) => lineSum + line.qty * line.unitCost,
          0
        ),
      0
    );

  return (
    <div className="space-y-6">
      <Section
        title="Dashboard"
        subtitle="Inventory, assets, approvals and the latest activity."
        action={
          <button
            className={btnPrimary}
            onClick={() => go("Inventory")}
          >
            <Plus size={16} />
            Open Inventory
          </button>
        }
      />

      {backupDue &&
        (ctx.can("backup") || ctx.user.role === "Super Admin") && (
          <Notice tone="amber">
            Backup reminder:{" "}
            {backupAge === null
              ? "no backup has been downloaded yet."
              : `last backup was ${backupAge} day(s) ago.`}{" "}
            <button
              className="font-semibold underline"
              onClick={() => go("Backup")}
            >
              Back up now
            </button>
          </Notice>
        )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          title="Product Types"
          value={String(
            db.products.filter((product) => product.status === "Active").length
          )}
          detail="Active products"
        />

        <Stat
          title="Stock Value"
          value={money(value)}
          detail="Quantity × latest unit cost"
          tone="violet"
        />

        <Stat
          title="Low Stock"
          value={String(low.length)}
          detail={`${dead.length} dead / slow-moving`}
          tone="amber"
        />

        <Stat
          title="Pending Approvals"
          value={String(pending.length)}
          detail={`${awaiting} awaiting employee acknowledgement`}
          tone="emerald"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          title="Issued This Month (cost)"
          value={money(issuedThisMonth)}
        />

        <Stat
          title="Active Employees"
          value={String(
            db.employees.filter((employee) => employee.status === "Active")
              .length
          )}
          tone="blue"
        />

        <Stat
          title="Assets Assigned"
          value={`${db.assets.filter((asset) => asset.status === "Assigned").length} / ${db.assets.length}`}
          tone="violet"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Card
            title="Latest 10 Activities"
            subtitle="Every important action is written to the audit log"
          >
            <Table
              heads={["When", "User", "Module", "Action", "Detail"]}
              min={750}
              empty="No activity yet. Actions you perform appear here."
            >
              {[...db.audit]
                .reverse()
                .slice(0, 10)
                .map((activity) => (
                  <tr key={activity.id}>
                    <td className={td}>
                      {new Date(activity.at).toLocaleString()}
                    </td>
                    <td className={td}>{activity.userName}</td>
                    <td className={td}>{activity.module}</td>
                    <td className={td}>{activity.action}</td>
                    <td className={td}>{activity.detail}</td>
                  </tr>
                ))}
            </Table>
          </Card>
        </div>

        <Card
          title="Pending Approvals"
          action={
            <button
              className="text-sm font-semibold text-blue-600"
              onClick={() => go("Approvals")}
            >
              View all
            </button>
          }
        >
          {pending.length === 0 ? (
            <Empty text="Nothing is waiting for approval." />
          ) : (
            <div className="space-y-3">
              {pending.slice(0, 5).map((approval) => (
                <div
                  key={approval.id}
                  className="flex items-start gap-3 rounded-xl border border-slate-100 p-3"
                >
                  <Clock
                    size={18}
                    className="mt-0.5 text-amber-600"
                  />

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                      {approval.title}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {approval.detail} · by {approval.requestedByName}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card
          title="Low Stock Alerts"
          action={
            <AlertTriangle size={19} className="text-amber-500" />
          }
        >
          {low.length === 0 ? (
            <Empty text="No low-stock items." />
          ) : (
            <div className="space-y-3">
              {low.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 rounded-xl bg-amber-50 p-3"
                >
                  <Img
                    src={product.image}
                    alt={product.name}
                    className="h-10 w-10"
                  />

                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">
                      {product.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      Minimum {product.minStock} {product.baseUnit}
                    </p>
                  </div>

                  <Badge>{`Low · ${stock[product.id] ?? 0}`}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card
          title="Dead / Slow-moving Stock"
          subtitle={`No issue for ${db.settings.deadStockDays}+ days`}
        >
          {dead.length === 0 ? (
            <Empty text="No dead stock detected." />
          ) : (
            <div className="space-y-3">
              {dead.slice(0, 6).map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 p-3 text-sm"
                >
                  <span className="font-medium text-slate-800">
                    {item.product.name}
                  </span>

                  <span className="text-slate-500">
                    {item.days} days idle ·{" "}
                    {money(
                      (stock[item.product.id] ?? 0) *
                        item.product.unitCost
                    )}
                  </span>
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

  const pending = db.approvals.filter(
    (approval) => approval.status === "Pending"
  );

  const history = db.approvals.filter(
    (approval) => approval.status !== "Pending"
  );

  function decide(
    id: string,
    decision: "Approved" | "Rejected",
    title: string
  ) {
    run(
      (data) =>
        decideApproval(
          data,
          id,
          decision,
          user,
          can("approve"),
          comments[id] ?? ""
        ),
      {
        module: "Approvals",
        action: decision,
        detail: title,
      }
    );
  }

  return (
    <div className="space-y-6">
      <Section
        title="Approvals"
        subtitle="MD / authorized approver decisions. Nobody can approve their own request."
      />

      {!can("approve") && (
        <Notice tone="amber">
          Your role cannot approve requests. You can follow the status of your
          own requests here.
        </Notice>
      )}

      <Card title={`Pending (${pending.length})`}>
        {pending.length === 0 ? (
          <Empty text="No pending requests." />
        ) : (
          <div className="space-y-3">
            {pending.map((approval) => {
              const own = approval.requestedBy === user.id;

              return (
                <div
                  key={approval.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {approval.title}
                      </p>

                      <p className="mt-1 text-sm text-slate-600">
                        {approval.detail}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Requested by {approval.requestedByName} ·{" "}
                        {new Date(approval.requestedAt).toLocaleString()}
                      </p>
                    </div>

                    <Badge>Pending</Badge>
                  </div>

                  {can("approve") &&
                    (own ? (
                      <p className="mt-3 text-xs text-amber-700">
                        You requested this, so another approver must decide.
                      </p>
                    ) : (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <input
                          className={`${inputCls} max-w-sm`}
                          placeholder="Comment (required to reject)"
                          value={comments[approval.id] ?? ""}
                          onChange={(event) =>
                            setComments({
                              ...comments,
                              [approval.id]: event.target.value,
                            })
                          }
                        />

                        <button
                          className={btnPrimary}
                          onClick={() =>
                            decide(
                              approval.id,
                              "Approved",
                              approval.title
                            )
                          }
                        >
                          Approve
                        </button>

                        <button
                          className={btnDanger}
                          onClick={() =>
                            decide(
                              approval.id,
                              "Rejected",
                              approval.title
                            )
                          }
                        >
                          Reject
                        </button>
                      </div>
                    ))}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card title="History">
        <Table
          heads={[
            "Request",
            "Requested by",
            "Decision",
            "Decided by",
            "Comment",
          ]}
          min={800}
          empty="No decisions yet."
        >
          {history.map((approval) => (
            <tr key={approval.id}>
              <td className={td}>
                <p className="font-medium">{approval.title}</p>
                <p className="text-xs text-slate-500">
                  {approval.detail}
                </p>
              </td>

              <td className={td}>
                {approval.requestedByName}
                <p className="text-xs text-slate-500">
                  {new Date(approval.requestedAt).toLocaleString()}
                </p>
              </td>

              <td className={td}>
                <Badge>{approval.status}</Badge>
              </td>

              <td className={td}>
                {approval.decidedBy}
                <p className="text-xs text-slate-500">
                  {approval.decidedAt &&
                    new Date(approval.decidedAt).toLocaleString()}
                </p>
              </td>

              <td className={td}>{approval.comment || "—"}</td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}

/* =========================================================
   ACHIEVEMENTS / OUTCOMES
========================================================= */

const blankAch = {
  title: "",
  category: "Milestone",
  date: todayStr(),
  companyId: "",
  outcome: "",
  metric: "",
  notes: "",
  image: "",
};

function Achievements({ ctx }: { ctx: Ctx }) {
  const { db, can, run, user } = ctx;

  const allowed = can("achievement.manage");

  const [f, setF] = useState(blankAch);
  const [show, setShow] = useState(false);
  const [company, setCompany] = useState("All");

  const list = db.achievements
    .filter((achievement) =>
      company === "All" ? true : achievement.companyId === company
    )
    .sort((a, b) => b.date.localeCompare(a.date));

  const byCat = list.reduce<Record<string, number>>(
    (map, achievement) => ({
      ...map,
      [achievement.category]: (map[achievement.category] ?? 0) + 1,
    }),
    {}
  );

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const ok = run(
      (data) => {
        if (!f.title.trim() || !f.outcome.trim()) {
          return fail(data, "Title and outcome are required.");
        }

        const achievement: Achievement = {
          id: makeId("ac"),
          ...f,
          title: f.title.trim(),
          outcome: f.outcome.trim(),
          createdBy: user.name,
        };

        return {
          db: {
            ...data,
            achievements: [achievement, ...data.achievements],
          },
          message: "Achievement recorded.",
        };
      },
      {
        module: "Achievements",
        action: "Create",
        detail: f.title,
      }
    );

    if (ok) {
      setF({ ...blankAch, date: todayStr() });
      setShow(false);
    }
  }

  return (
    <div className="space-y-6">
      <Section
        title="Achievements & Outcomes"
        subtitle="A record of what the company achieved and the result of each effort."
        action={
          <button
            className={btnPrimary}
            disabled={!allowed}
            onClick={() => setShow(true)}
          >
            <Plus size={16} />
            Add Achievement
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          title="Total Records"
          value={String(list.length)}
          tone="blue"
        />

        {Object.entries(byCat)
          .slice(0, 3)
          .map(([category, count]) => (
            <Stat
              key={category}
              title={category}
              value={String(count)}
              tone="emerald"
            />
          ))}
      </div>

      {show && (
        <Card
          title="New Achievement"
          action={
            <button
              onClick={() => setShow(false)}
              aria-label="Close achievement form"
            >
              <X size={18} />
            </button>
          }
        >
          <form
            onSubmit={save}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            <Field label="Title *">
              <input
                required
                className={inputCls}
                {...bind(f, setF, "title")}
              />
            </Field>

            <Field label="Category">
              <select
                className={inputCls}
                {...bind(f, setF, "category")}
              >
                {[
                  "Milestone",
                  "Sales",
                  "Project",
                  "Award",
                  "Compliance",
                  "Cost Saving",
                  "Other",
                ].map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </Field>

            <Field label="Date">
              <input
                type="date"
                className={inputCls}
                {...bind(f, setF, "date")}
              />
            </Field>

            <Field label="Company / Office">
              <select
                className={inputCls}
                {...bind(f, setF, "companyId")}
              >
                <option value="">Group level</option>
                {db.companies.map((companyItem) => (
                  <option key={companyItem.id} value={companyItem.id}>
                    {companyItem.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Measured Result">
              <input
                className={inputCls}
                {...bind(f, setF, "metric")}
                placeholder="e.g. 120 units sold"
              />
            </Field>

            <Field label="Outcome *">
              <input
                required
                className={inputCls}
                {...bind(f, setF, "outcome")}
              />
            </Field>

            <Field
              label="Notes"
              className="sm:col-span-2 lg:col-span-3"
            >
              <input
                className={inputCls}
                {...bind(f, setF, "notes")}
              />
            </Field>

            <div className="sm:col-span-2 lg:col-span-3">
              <ImageUpload
                label="Photo / Evidence"
                value={f.image}
                onChange={(value) => setF({ ...f, image: value })}
              />
            </div>

            <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
              <button className={btnPrimary} type="submit">
                Save
              </button>

              <button
                type="button"
                className={btnGhost}
                onClick={() => setShow(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      <Card
        title="Achievement Log"
        action={
          <select
            className={inputCls}
            value={company}
            onChange={(event) => setCompany(event.target.value)}
          >
            <option>All</option>
            {db.companies.map((companyItem) => (
              <option key={companyItem.id} value={companyItem.id}>
                {companyItem.name}
              </option>
            ))}
          </select>
        }
      >
        <Table
          heads={[
            "Achievement",
            "Category",
            "Company",
            "Result",
            "Outcome",
            "Date",
          ]}
          min={900}
          empty="No achievements recorded."
        >
          {list.map((achievement) => (
            <tr key={achievement.id}>
              <td className={td}>
                <div className="flex items-center gap-3">
                  <Img src={achievement.image} alt={achievement.title} />

                  <div>
                    <p className="font-semibold">{achievement.title}</p>
                    <p className="text-xs text-slate-500">
                      {achievement.notes}
                    </p>
                  </div>
                </div>
              </td>

              <td className={td}>
                <span className="inline-flex items-center gap-1">
                  <Award size={14} className="text-amber-500" />
                  {achievement.category}
                </span>
              </td>

              <td className={td}>
                {db.companies.find(
                  (item) => item.id === achievement.companyId
                )?.name ?? "Group"}
              </td>

              <td className={td}>{achievement.metric || "—"}</td>
              <td className={td}>{achievement.outcome}</td>
              <td className={td}>{achievement.date}</td>
            </tr>
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

  const creatable = ROLES.filter(
    (role) => isSA || RANK[role] > RANK[user.role]
  );

  const [f, setF] = useState<{
    name: string;
    role: string;
    employeeId: string;
  }>({
    name: "",
    role: creatable[0] ?? "Receptionist",
    employeeId: "",
  });

  function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const ok = run(
      (data) => {
        const name = f.name.trim();

        if (!name) {
          return fail(data, "User name is required.");
        }

        if (!creatable.includes(f.role as Role)) {
          return fail(data, "You cannot create a user at this level.");
        }

        if (
          data.users.some(
            (existingUser) =>
              existingUser.name.toLowerCase() === name.toLowerCase()
          )
        ) {
          return fail(data, "A user with this name already exists.");
        }

        const newUser: AppUser = {
          id: makeId("u"),
          name,
          role: f.role as Role,
          employeeId: f.employeeId,
          active: true,
          backupAccess: false,
          createdBy: user.name,
          createdAt: todayStr(),
        };

        return {
          db: {
            ...data,
            users: [...data.users, newUser],
          },
          message: "User created.",
        };
      },
      {
        module: "Users",
        action: "Create user",
        detail: `${f.name} (${f.role})`,
      }
    );

    if (ok) {
      setF({
        ...f,
        name: "",
        employeeId: "",
      });
    }
  }

  function deactivate(targetUser: AppUser) {
    if (targetUser.id === user.id) {
      ctx.notify("You cannot deactivate yourself.", "error");
      return;
    }

    if (!isSA && RANK[targetUser.role] <= RANK[user.role]) {
      ctx.notify(
        "You cannot manage a user at an equal or higher level.",
        "error"
      );
      return;
    }

    run(
      (data) =>
        routeApproval(
          data,
          user,
          "userDeactivate",
          targetUser.id,
          `Deactivate ${targetUser.name}`,
          `${targetUser.role} account`
        ),
      {
        module: "Users",
        action: "Deactivate request",
        detail: targetUser.name,
      }
    );
  }

  function reactivate(targetUser: AppUser) {
    run(
      (data) => ({
        db: {
          ...data,
          users: upd(data.users, targetUser.id, { active: true }),
        },
        message: `${targetUser.name} reactivated.`,
      }),
      {
        module: "Users",
        action: "Reactivate user",
        detail: targetUser.name,
      }
    );
  }

  function toggleBackup(targetUser: AppUser) {
    run(
      (data) => ({
        db: {
          ...data,
          users: upd(data.users, targetUser.id, {
            backupAccess: !targetUser.backupAccess,
          }),
        },
        message: `Backup access ${
          targetUser.backupAccess ? "removed from" : "granted to"
        } ${targetUser.name}.`,
      }),
      {
        module: "Users",
        action: "Backup access",
        detail: `${targetUser.name}: ${
          targetUser.backupAccess ? "removed" : "granted"
        }`,
      }
    );
  }

  function togglePerm(role: Role, permission: Perm) {
    if (!isSA) {
      ctx.notify("Only the Super Admin can change permissions.", "error");
      return;
    }

    run(
      (data) => {
        const hasPermission = data.perms[role].includes(permission);

        const nextPermissions = hasPermission
          ? data.perms[role].filter((item) => item !== permission)
          : [...data.perms[role], permission];

        return {
          db: {
            ...data,
            perms: {
              ...data.perms,
              [role]: nextPermissions,
            },
          },
          message: "Permission updated.",
        };
      },
      {
        module: "Users",
        action: "Change permission",
        detail: `${role}: ${permission}`,
      }
    );
  }

  return (
    <div className="space-y-6">
      <Section
        title="Users & Access"
        subtitle="Four roles, hierarchy rules, backup access and the permission matrix."
      />

      <Notice>
        Hierarchy rule: you can only create or deactivate users below your own
        level. Deactivation by anyone except the Super Admin goes through
        approval, and history is always preserved.
      </Notice>

      <Card title="Add User">
        <form
          onSubmit={add}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <Field label="Full name *">
            <input
              required
              className={inputCls}
              {...bind(f, setF, "name")}
            />
          </Field>

          <Field label="Role">
            <select
              className={inputCls}
              {...bind(f, setF, "role")}
            >
              {creatable.map((role) => (
                <option key={role}>{role}</option>
              ))}
            </select>
          </Field>

          <Field label="Linked employee (optional)">
            <select
              className={inputCls}
              {...bind(f, setF, "employeeId")}
            >
              <option value="">None</option>

              {db.employees
                .filter((employee) => employee.status === "Active")
                .map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.empId} — {employee.name}
                  </option>
                ))}
            </select>
          </Field>

          <div className="flex items-end">
            <button
              className={btnPrimary}
              type="submit"
              disabled={!creatable.length}
            >
              <Plus size={16} />
              Create user
            </button>
          </div>
        </form>
      </Card>

      <Card title={`Users (${db.users.length})`}>
        <Table
          heads={[
            "User",
            "Role",
            "Linked employee",
            "Created by",
            "Backup access",
            "Status",
            "Actions",
          ]}
          min={1000}
          empty="No users."
        >
          {db.users.map((targetUser) => {
            const pendingReq = db.approvals.some(
              (approval) =>
                approval.kind === "userDeactivate" &&
                approval.refId === targetUser.id &&
                approval.status === "Pending"
            );

            return (
              <tr key={targetUser.id} className="hover:bg-slate-50">
                <td className={`${td} font-semibold`}>
                  {targetUser.name}
                </td>

                <td className={td}>{targetUser.role}</td>

                <td className={td}>
                  {db.employees.find(
                    (employee) => employee.id === targetUser.employeeId
                  )?.name ?? "—"}
                </td>

                <td className={td}>
                  {targetUser.createdBy}
                  <p className="text-xs text-slate-500">
                    {targetUser.createdAt}
                  </p>
                </td>

                <td className={td}>
                  {targetUser.role === "Super Admin" ? (
                    <Badge>Always</Badge>
                  ) : isSA ? (
                    <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={targetUser.backupAccess}
                        onChange={() => toggleBackup(targetUser)}
                      />
                      {targetUser.backupAccess ? "Granted" : "Not granted"}
                    </label>
                  ) : (
                    <Badge>
                      {targetUser.backupAccess ? "Granted" : "Not granted"}
                    </Badge>
                  )}
                </td>

                <td className={td}>
                  <Badge>
                    {targetUser.active ? "Active" : "Inactive"}
                  </Badge>

                  {pendingReq && (
                    <p className="mt-1">
                      <Badge>Deactivation pending</Badge>
                    </p>
                  )}
                </td>

                <td className={td}>
                  {targetUser.active ? (
                    <button
                      className={btnDanger}
                      disabled={pendingReq}
                      onClick={() => deactivate(targetUser)}
                    >
                      {isSA ? "Deactivate" : "Request deactivation"}
                    </button>
                  ) : (
                    isSA && (
                      <button
                        className={btnGhost}
                        onClick={() => reactivate(targetUser)}
                      >
                        Reactivate
                      </button>
                    )
                  )}
                </td>
              </tr>
            );
          })}
        </Table>
      </Card>

      <Card
        title="Permission Matrix"
        subtitle="Only the Super Admin can change permissions. Super Admin always has every permission."
      >
        <Table
          heads={[
            "Permission",
            "Super Admin",
            "Sub Admin",
            "Manager",
            "Receptionist",
          ]}
          min={800}
        >
          {PERMS.map(([permission, label]) => (
            <tr key={permission}>
              <td className={`${td} font-medium`}>{label}</td>

              <td className={td}>
                <Badge>Yes</Badge>
              </td>

              {(
                ["Sub Admin", "Manager", "Receptionist"] as Role[]
              ).map((role) => (
                <td key={role} className={td}>
                  <input
                    type="checkbox"
                    aria-label={`${role} ${label}`}
                    disabled={!isSA}
                    checked={db.perms[role].includes(permission)}
                    onChange={() => togglePerm(role, permission)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </Table>

        <p className="mt-3 text-xs text-slate-500">
          Database backup is not part of this matrix: only the Super Admin can
          back up by default, and can grant backup access to individual users
          above.
        </p>
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

  const modules = useMemo(
    () => ["All", ...Array.from(new Set(db.audit.map((item) => item.module)))],
    [db.audit]
  );

  const people = useMemo(
    () => ["All", ...Array.from(new Set(db.audit.map((item) => item.userName)))],
    [db.audit]
  );

  const rows = useMemo(
    () =>
      [...db.audit]
        .reverse()
        .filter(
          (activity) =>
            (mod === "All" || activity.module === mod) &&
            (who === "All" || activity.userName === who) &&
            `${activity.action} ${activity.detail} ${activity.userName}`
              .toLowerCase()
              .includes(q.toLowerCase())
        ),
    [db.audit, mod, who, q]
  );

  return (
    <div className="space-y-6">
      <Section
        title="Audit Log"
        subtitle="Who did what and when. The interface has no edit or delete option for these records."
        action={
          <button
            className={btnGhost}
            onClick={() =>
              downloadCsv("audit-log.csv", [
                ["When", "User", "Role", "Module", "Action", "Detail"],
                ...rows.map((activity) => [
                  activity.at,
                  activity.userName,
                  activity.role,
                  activity.module,
                  activity.action,
                  activity.detail,
                ]),
              ])
            }
          >
            <Download size={15} />
            Export CSV
          </button>
        }
      />

      <Card>
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <input
            className={inputCls}
            placeholder="Search action or detail..."
            value={q}
            onChange={(event) => setQ(event.target.value)}
          />

          <select
            className={inputCls}
            value={mod}
            onChange={(event) => setMod(event.target.value)}
          >
            {modules.map((module) => (
              <option key={module}>{module}</option>
            ))}
          </select>

          <select
            className={inputCls}
            value={who}
            onChange={(event) => setWho(event.target.value)}
          >
            {people.map((person) => (
              <option key={person}>{person}</option>
            ))}
          </select>
        </div>

        <Table
          heads={["When", "User", "Role", "Module", "Action", "Detail"]}
          min={950}
          empty="No audit entries match."
        >
          {rows.slice(0, 500).map((activity) => (
            <tr key={activity.id} className="hover:bg-slate-50">
              <td className={td}>
                {new Date(activity.at).toLocaleString()}
              </td>
              <td className={td}>{activity.userName}</td>
              <td className={td}>{activity.role}</td>
              <td className={td}>{activity.module}</td>
              <td className={`${td} font-medium`}>{activity.action}</td>
              <td className={td}>{activity.detail}</td>
            </tr>
          ))}
        </Table>

        {rows.length > 500 && (
          <p className="mt-3 text-xs text-slate-500">
            Showing the latest 500 of {rows.length} entries. Use Export CSV
            for all of them.
          </p>
        )}
      </Card>

      <Notice tone="amber">
        In production the audit table must be append-only on the server (no
        update or delete rights for any application user). A browser demo
        cannot guarantee that.
      </Notice>
    </div>
  );
}

/* =========================================================
   BACKUP & SETTINGS
========================================================= */

function BackupPage({ ctx }: { ctx: Ctx }) {
  const { db, user, can, run, notify } = ctx;

  const isSA = user.role === "Super Admin";

  const [nums, setNums] = useState({
    dead: String(db.settings.deadStockDays),
    remind: String(db.settings.backupReminderDays),
  });

  const sizeKb = useMemo(
    () => Math.round(JSON.stringify(db).length / 1024),
    [db]
  );

  const rules: {
    key: keyof typeof db.settings.approvals;
    label: string;
    locked?: boolean;
  }[] = [
    {
      key: "issue",
      label: "Distribution to employees, clients and guests",
    },
    {
      key: "receipt",
      label: "Stock receiving",
    },
    {
      key: "adjustment",
      label: "Stock adjustment, damage and loss",
    },
    {
      key: "vendorReturn",
      label: "Vendor returns",
    },
    {
      key: "userDeactivate",
      label: "User deactivation (always required for non-Super Admin)",
      locked: true,
    },
  ];

  function download() {
    if (!can("backup")) {
      notify("You do not have backup permission.", "error");
      return;
    }

    const date = new Date();

    const stamp = `${todayStr()}-${String(date.getHours()).padStart(
      2,
      "0"
    )}${String(date.getMinutes()).padStart(2, "0")}`;

    const url = URL.createObjectURL(
      new Blob([JSON.stringify(db)], {
        type: "application/json",
      })
    );

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `pids-backup-${stamp}.json`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);

    run(
      (data) => ({
        db: {
          ...data,
          settings: {
            ...data.settings,
            lastBackupAt: nowIso(),
          },
        },
        message: "Backup downloaded.",
      }),
      {
        module: "Backup",
        action: "Download backup",
        detail: `${db.products.length} products, ${db.ledger.length} ledger entries, ${sizeKb} KB`,
      }
    );
  }

  function restore(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

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

        if (
          !window.confirm(
            "Restore this backup? Current data in this browser will be replaced."
          )
        ) {
          return;
        }

        run(
          () => ({
            db: restored,
            message: "Backup restored.",
          }),
          {
            module: "Backup",
            action: "Restore backup",
            detail: file.name,
          }
        );
      })
      .catch(() => {
        notify("Could not read this backup file.", "error");
      });
  }

  function toggleRule(kind: keyof typeof db.settings.approvals) {
    if (!isSA) {
      notify("Only the Super Admin can change approval rules.", "error");
      return;
    }

    run(
      (data) => ({
        db: {
          ...data,
          settings: {
            ...data.settings,
            approvals: {
              ...data.settings.approvals,
              [kind]: !data.settings.approvals[kind],
            },
          },
        },
        message: "Approval rule updated.",
      }),
      {
        module: "Settings",
        action: "Approval rule",
        detail: `${kind}: ${db.settings.approvals[kind] ? "off" : "on"}`,
      }
    );
  }

  function saveNumbers(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const deadDays = Math.floor(Number(nums.dead));
    const reminderDays = Math.floor(Number(nums.remind));

    run(
      (data) => {
        if (!(deadDays >= 1) || !(reminderDays >= 1)) {
          return fail(
            data,
            "Both values must be whole numbers of 1 or more."
          );
        }

        return {
          db: {
            ...data,
            settings: {
              ...data.settings,
              deadStockDays: deadDays,
              backupReminderDays: reminderDays,
            },
          },
          message: "Settings saved.",
        };
      },
      {
        module: "Settings",
        action: "Thresholds",
        detail: `dead stock ${deadDays} days, backup reminder ${reminderDays} days`,
      }
    );
  }

  const last = db.settings.lastBackupAt;

  return (
    <div className="space-y-6">
      <Section
        title="Backup & Settings"
        subtitle="Database backup is limited to the Super Admin and users the Super Admin has authorized."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          title="Last Backup"
          value={last ? new Date(last).toLocaleDateString() : "Never"}
          detail={
            last
              ? new Date(last).toLocaleTimeString()
              : "Download a backup now"
          }
          tone={last ? "emerald" : "rose"}
        />

        <Stat
          title="Data Size"
          value={`${sizeKb} KB`}
          detail="Approximate JSON backup size"
          tone="violet"
        />

        <Stat
          title="Ledger Entries"
          value={String(db.ledger.length)}
          detail={`${db.audit.length} audit entries`}
        />
      </div>

      <Card
        title="Database Backup"
        subtitle="The backup file contains all data included in the current browser database, including stored images and challan copies."
      >
        <div className="flex flex-wrap items-center gap-3">
          <button
            className={btnPrimary}
            disabled={!can("backup")}
            onClick={download}
          >
            <Download size={16} />
            Download Backup
          </button>

          {isSA && (
            <label className={`${btnGhost} cursor-pointer`}>
              <Upload size={15} />
              Restore from file

              <input
                type="file"
                accept="application/json,.json"
                className="sr-only"
                onChange={restore}
              />
            </label>
          )}
        </div>

        {!can("backup") && (
          <p className="mt-3 text-xs text-amber-700">
            You do not have backup permission. Ask the Super Admin to grant it
            in Users & Access.
          </p>
        )}

        {!isSA && can("backup") && (
          <p className="mt-3 text-xs text-slate-500">
            Restoring a backup is reserved for the Super Admin.
          </p>
        )}
      </Card>

      {isSA ? (
        <>
          <Card
            title="Approval Rules"
            subtitle="Requests from non-Super Admin users wait for an approver when a rule is on. The Super Admin acts as MD."
          >
            <div className="space-y-2">
              {rules.map((rule) => (
                <label
                  key={rule.key}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 text-sm"
                >
                  <span className="font-medium text-slate-700">
                    {rule.label}
                  </span>

                  <input
                    type="checkbox"
                    disabled={rule.locked}
                    checked={
                      rule.locked
                        ? true
                        : db.settings.approvals[rule.key]
                    }
                    onChange={() => toggleRule(rule.key)}
                  />
                </label>
              ))}
            </div>
          </Card>

          <Card title="Thresholds">
            <form
              onSubmit={saveNumbers}
              className="grid gap-4 sm:grid-cols-3"
            >
              <Field label="Dead stock after (days without issue)">
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  className={inputCls}
                  value={nums.dead}
                  onChange={(event) =>
                    setNums({
                      ...nums,
                      dead: event.target.value,
                    })
                  }
                />
              </Field>

              <Field label="Backup reminder every (days)">
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  className={inputCls}
                  value={nums.remind}
                  onChange={(event) =>
                    setNums({
                      ...nums,
                      remind: event.target.value,
                    })
                  }
                />
              </Field>

              <div className="flex items-end">
                <button className={btnPrimary} type="submit">
                  Save
                </button>
              </div>
            </form>
          </Card>
        </>
      ) : (
        <Notice>
          Approval rules and thresholds can only be changed by the Super Admin.
        </Notice>
      )}
    </div>
  );
}
