"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Building2, ChevronDown, ChevronUp, Download, Layers3, Plus, Power, Search, UserRound, X } from "lucide-react";
import ImageUpload from "./ImageUpload";
import {
  Badge, Card, Empty, Field, Img, Notice, Section, Stat, Table, bind, btnDanger, btnGhost, btnPrimary, td, inputCls,
  downloadCsv, employeePossession, fail, makeId, money, nowIso, pname, todayStr, upd, withNo,
} from "./InventoryManagement";
import type { Asset, AssetStatus, Company, Ctx, Db, Employee, OfficeCategory } from "./InventoryManagement";

type View = "companies" | "employees" | "assets";

export default function CompanyManagement({ ctx, view }: { ctx: Ctx; view: View }) {
  if (view === "companies") return <Companies ctx={ctx} />;
  if (view === "employees") return <Employees ctx={ctx} />;
  return <Assets ctx={ctx} />;
}

const COMPANY_TYPES = ["Group Concern", "Property Development", "Holdings", "Real Estate", "Construction", "Corporate Services", "Other"];
const OFFICES: OfficeCategory[] = ["Corporate Office", "Sales Office", "Warehouse", "Other"];

const deptName = (db: Db, id: string) => {
  const d = db.departments.find((x) => x.id === id);
  return d ? `${db.companies.find((c) => c.id === d.companyId)?.code ?? ""} · ${d.name}` : "—";
};

/* =========================================================
   COMPANIES, OFFICES AND DEPARTMENTS
========================================================= */

type CompanyForm = Omit<Company, "id" | "createdAt" | "updatedAt">;
const blankCompany: CompanyForm = {
  name: "", code: "", type: "Group Concern", officeCategory: "Corporate Office", location: "", address: "", phone: "", email: "", manager: "", status: "Active", logo: "",
};

function Companies({ ctx }: { ctx: Ctx }) {
  const { db, can, run } = ctx;
  const allowed = can("company.manage");
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [f, setF] = useState<CompanyForm>(blankCompany);
  const [q, setQ] = useState("");
  const [office, setOffice] = useState("All");
  const [status, setStatus] = useState("All");
  const [open, setOpen] = useState<string[]>([]);
  const [dept, setDept] = useState<{ companyId: string; id: string | null; code: string; name: string; head: string } | null>(null);

  const list = useMemo(
    () =>
      db.companies.filter((c) => {
        const deps = db.departments.filter((d) => d.companyId === c.id).map((d) => `${d.name} ${d.code}`).join(" ");
        const text = `${c.name} ${c.code} ${c.type} ${c.location} ${c.manager} ${deps}`.toLowerCase();
        return text.includes(q.toLowerCase()) && (office === "All" || c.officeCategory === office) && (status === "All" || c.status === status);
      }),
    [db.companies, db.departments, q, office, status]
  );

  function saveCompany(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = f.name.trim();
    const code = f.code.trim().toUpperCase();
    const ok = run(
      (d) => {
        if (!name || !code) return fail(d, "Company name and code are required.");
        if (d.companies.some((c) => c.id !== editing && (c.code.toLowerCase() === code.toLowerCase() || c.name.toLowerCase() === name.toLowerCase()))) return fail(d, "A company with this name or code already exists.");
        const data = { ...f, name, code };
        if (editing) return { db: { ...d, companies: upd(d.companies, editing, { ...data, updatedAt: todayStr() }) }, message: "Company updated." };
        const c: Company = { id: makeId("c"), ...data, createdAt: todayStr(), updatedAt: todayStr() };
        return { db: { ...d, companies: [c, ...d.companies] }, message: "Company created." };
      },
      { module: "Companies", action: editing ? "Update company" : "Create company", detail: `${code} ${name}` }
    );
    if (ok) { setShow(false); setEditing(null); setF(blankCompany); }
  }

  function toggleCompany(c: Company) {
    const empCount = db.employees.filter((e) => e.companyId === c.id && e.status === "Active").length;
    if (c.status === "Active" && empCount > 0 && !window.confirm(`${c.name} has ${empCount} active employee(s). Deactivate anyway? Records are preserved.`)) return;
    run((d) => ({ db: { ...d, companies: upd(d.companies, c.id, { status: c.status === "Active" ? "Inactive" : "Active", updatedAt: todayStr() }) }, message: "Company status updated." }), {
      module: "Companies", action: "Change status", detail: c.code,
    });
  }

  function saveDept(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!dept) return;
    const code = dept.code.trim().toUpperCase();
    const name = dept.name.trim();
    const ok = run(
      (d) => {
        if (!name) return fail(d, "Department name is required.");
        const siblings = d.departments.filter((x) => x.companyId === dept.companyId && x.id !== dept.id);
        if (siblings.some((x) => x.name.toLowerCase() === name.toLowerCase())) return fail(d, "This department already exists in the company.");
        if (code && siblings.some((x) => x.code.toLowerCase() === code.toLowerCase())) return fail(d, "This department code already exists.");
        if (dept.id) return { db: { ...d, departments: upd(d.departments, dept.id, { code, name, head: dept.head.trim() }) }, message: "Department updated." };
        return { db: { ...d, departments: [...d.departments, { id: makeId("d"), companyId: dept.companyId, code, name, head: dept.head.trim(), status: "Active" }] }, message: "Department added." };
      },
      { module: "Departments", action: dept.id ? "Update department" : "Create department", detail: name }
    );
    if (ok) setDept(null);
  }

  return (
    <div className="space-y-6">
      <Section
        title="Companies, Offices & Departments"
        subtitle="Corporate and sales offices with their department structure."
        action={<button className={btnPrimary} disabled={!allowed} onClick={() => { setEditing(null); setF(blankCompany); setShow(true); }}><Plus size={16} /> Add Company</button>}
      />
      {!allowed && <Notice tone="amber">Your role can view organization data but cannot change it.</Notice>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat title="Companies" value={String(db.companies.length)} detail={`${db.companies.filter((c) => c.status === "Active").length} active`} />
        <Stat title="Corporate Offices" value={String(db.companies.filter((c) => c.officeCategory === "Corporate Office").length)} tone="violet" />
        <Stat title="Sales Offices" value={String(db.companies.filter((c) => c.officeCategory === "Sales Office").length)} tone="emerald" />
        <Stat title="Departments / Employees" value={`${db.departments.length} / ${db.employees.filter((e) => e.status === "Active").length}`} detail="Employees are counted live" tone="amber" />
      </div>

      {show && (
        <Card title={editing ? "Edit Company" : "Add Company"} action={<button onClick={() => setShow(false)} aria-label="Close"><X size={18} /></button>}>
          <form onSubmit={saveCompany} className="space-y-4">
            <ImageUpload label="Company / Office Logo" value={f.logo} onChange={(v) => setF({ ...f, logo: v })} />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <Field label="Company Name *"><input required className={inputCls} {...bind(f, setF, "name")} /></Field>
              <Field label="Unique Code *"><input required className={inputCls} value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} /></Field>
              <Field label="Company Type"><select className={inputCls} {...bind(f, setF, "type")}>{COMPANY_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
              <Field label="Office Category"><select className={inputCls} {...bind(f, setF, "officeCategory")}>{OFFICES.map((t) => <option key={t}>{t}</option>)}</select></Field>
              <Field label="Location"><input className={inputCls} {...bind(f, setF, "location")} /></Field>
              <Field label="Office Manager"><input className={inputCls} {...bind(f, setF, "manager")} /></Field>
              <Field label="Phone"><input className={inputCls} {...bind(f, setF, "phone")} /></Field>
              <Field label="Email"><input type="email" className={inputCls} {...bind(f, setF, "email")} /></Field>
              <Field label="Status"><select className={inputCls} {...bind(f, setF, "status")}><option>Active</option><option>Inactive</option></select></Field>
              <Field label="Full Address" className="sm:col-span-2 xl:col-span-3"><textarea rows={2} className={inputCls} {...bind(f, setF, "address")} /></Field>
            </div>
            <div className="flex gap-2"><button className={btnPrimary} type="submit">{editing ? "Save Changes" : "Create Company"}</button><button type="button" className={btnGhost} onClick={() => setShow(false)}>Cancel</button></div>
          </form>
        </Card>
      )}

      <Card>
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className={`${inputCls} pl-9`} placeholder="Search company, code, department..." value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <select className={inputCls} value={office} onChange={(e) => setOffice(e.target.value)}><option>All</option>{OFFICES.map((o) => <option key={o}>{o}</option>)}</select>
          <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}><option>All</option><option>Active</option><option>Inactive</option></select>
        </div>
        {list.length === 0 && <Empty text="No companies match the filters." />}
        <div className="divide-y divide-slate-100">
          {list.map((c) => {
            const deps = db.departments.filter((d) => d.companyId === c.id);
            const isOpen = open.includes(c.id);
            return (
              <article key={c.id} className="py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <button className="flex min-w-0 flex-1 items-start gap-3 text-left" onClick={() => setOpen(isOpen ? open.filter((x) => x !== c.id) : [...open, c.id])}>
                    <Img src={c.logo} alt={c.name} className="h-12 w-12" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-slate-900">{c.name}</h3><Badge>{c.status}</Badge></div>
                      <p className="mt-1 text-xs text-slate-500">{c.code} · {c.type} · {c.officeCategory} · {c.location || "Location not set"}</p>
                      <p className="mt-1 text-xs text-slate-500">{deps.length} departments · {db.employees.filter((e) => e.companyId === c.id && e.status === "Active").length} active employees</p>
                    </div>
                    {isOpen ? <ChevronUp size={18} className="mt-1 text-slate-400" /> : <ChevronDown size={18} className="mt-1 text-slate-400" />}
                  </button>
                  <div className="flex gap-2">
                    <button className={btnGhost} disabled={!allowed} onClick={() => { setEditing(c.id); setF({ name: c.name, code: c.code, type: c.type, officeCategory: c.officeCategory, location: c.location, address: c.address, phone: c.phone, email: c.email, manager: c.manager, status: c.status, logo: c.logo }); setShow(true); }}>Edit</button>
                    <button className={btnGhost} disabled={!allowed} onClick={() => toggleCompany(c)}><Power size={14} />{c.status === "Active" ? "Deactivate" : "Reactivate"}</button>
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-4 rounded-xl bg-slate-50 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-800">Departments</h4>
                      <button className={btnGhost} disabled={!allowed || c.status === "Inactive"} onClick={() => setDept({ companyId: c.id, id: null, code: "", name: "", head: "" })}><Plus size={14} /> Add Department</button>
                    </div>
                    {dept?.companyId === c.id && (
                      <form onSubmit={saveDept} className="mb-3 grid gap-3 rounded-xl border border-blue-100 bg-white p-4 sm:grid-cols-4">
                        <Field label="Name *"><input required autoFocus className={inputCls} value={dept.name} onChange={(e) => setDept({ ...dept, name: e.target.value })} /></Field>
                        <Field label="Code"><input className={inputCls} value={dept.code} onChange={(e) => setDept({ ...dept, code: e.target.value.toUpperCase() })} /></Field>
                        <Field label="Head"><input className={inputCls} value={dept.head} onChange={(e) => setDept({ ...dept, head: e.target.value })} /></Field>
                        <div className="flex items-end gap-2"><button className={btnPrimary} type="submit">Save</button><button type="button" className={btnGhost} onClick={() => setDept(null)}>Cancel</button></div>
                      </form>
                    )}
                    {deps.length === 0 ? <Empty text="No departments yet." /> : (
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {deps.map((d) => (
                          <div key={d.id} className="rounded-xl border border-slate-200 bg-white p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2"><Layers3 size={18} className="mt-0.5 text-violet-600" /><div><p className="text-sm font-semibold text-slate-800">{d.name}</p><p className="text-xs text-slate-500">{d.code || "No code"} · Head: {d.head || "Not assigned"}</p><p className="mt-1 text-xs text-slate-500">{db.employees.filter((e) => e.departmentId === d.id && e.status === "Active").length} employees</p></div></div>
                              <Badge>{d.status}</Badge>
                            </div>
                            <div className="mt-3 flex gap-2">
                              <button className={btnGhost} disabled={!allowed} onClick={() => setDept({ companyId: c.id, id: d.id, code: d.code, name: d.name, head: d.head })}>Edit</button>
                              <button className={btnGhost} disabled={!allowed} onClick={() => run((x) => ({ db: { ...x, departments: upd(x.departments, d.id, { status: d.status === "Active" ? "Inactive" : "Active" }) }, message: "Department status updated." }), { module: "Departments", action: "Change status", detail: d.name })}>{d.status === "Active" ? "Deactivate" : "Activate"}</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

/* =========================================================
   EMPLOYEES: profile, possession, history, transfer, clearance
========================================================= */

type EmpForm = Omit<Employee, "id" | "transfers" | "leftDate" | "clearanceNote">;
const blankEmp = (): EmpForm => ({ empId: "", name: "", companyId: "", departmentId: "", designation: "", joiningDate: todayStr(), phone: "", email: "", photo: "", status: "Active" });

function Employees({ ctx }: { ctx: Ctx }) {
  const { db, can, run, user } = ctx;
  const allowed = can("employee.manage");
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [f, setF] = useState<EmpForm>(blankEmp);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sel, setSel] = useState<string | null>(null);

  function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const ok = run(
      (d) => {
        const empId = f.empId.trim().toUpperCase();
        if (!empId || !f.name.trim()) return fail(d, "Employee ID and name are required.");
        if (!f.companyId) return fail(d, "Select a company / office.");
        if (d.employees.some((x) => x.empId.toLowerCase() === empId.toLowerCase() && x.id !== editing)) return fail(d, "This employee ID already exists.");
        const data = { ...f, empId, name: f.name.trim() };
        if (editing) return { db: { ...d, employees: upd(d.employees, editing, data) }, message: "Employee updated." };
        const emp: Employee = { id: makeId("e"), ...data, leftDate: "", clearanceNote: "", transfers: [] };
        return { db: { ...d, employees: [...d.employees, emp] }, message: "Employee added." };
      },
      { module: "Employees", action: editing ? "Update employee" : "Create employee", detail: f.empId }
    );
    if (ok) { setShow(false); setEditing(null); setF(blankEmp()); }
  }

  const list = db.employees.filter(
    (x) => (statusFilter === "All" || x.status === statusFilter) && `${x.empId} ${x.name} ${x.designation} ${deptName(db, x.departmentId)}`.toLowerCase().includes(q.toLowerCase())
  );
  const selected = db.employees.find((x) => x.id === sel);

  return (
    <div className="space-y-6">
      <Section title="Employees" subtitle="Profiles, issued items, lifetime history, transfers and clearance." action={<button className={btnPrimary} disabled={!allowed} onClick={() => { setEditing(null); setF(blankEmp()); setShow(true); }}><Plus size={16} /> Add Employee</button>} />
      {!allowed && <Notice tone="amber">Your role can view employees but cannot change them.</Notice>}

      {show && (
        <Card title={editing ? "Edit Employee" : "Add Employee"} action={<button onClick={() => setShow(false)} aria-label="Close"><X size={18} /></button>}>
          <form onSubmit={save} className="space-y-4">
            <ImageUpload label="Employee Photo" value={f.photo} onChange={(v) => setF({ ...f, photo: v })} />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Employee ID *"><input required className={inputCls} {...bind(f, setF, "empId")} /></Field>
              <Field label="Name *"><input required className={inputCls} {...bind(f, setF, "name")} /></Field>
              <Field label="Designation"><input className={inputCls} {...bind(f, setF, "designation")} /></Field>
              <Field label="Company / Office *">
                <select className={inputCls} value={f.companyId} onChange={(e) => setF({ ...f, companyId: e.target.value, departmentId: "" })}><option value="">Select</option>{db.companies.filter((c) => c.status === "Active").map((c) => <option key={c.id} value={c.id}>{c.name} ({c.officeCategory})</option>)}</select>
              </Field>
              <Field label="Department">
                <select className={inputCls} {...bind(f, setF, "departmentId")}><option value="">None</option>{db.departments.filter((d) => d.companyId === f.companyId).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
              </Field>
              <Field label="Joining Date"><input type="date" className={inputCls} {...bind(f, setF, "joiningDate")} /></Field>
              <Field label="Phone"><input className={inputCls} {...bind(f, setF, "phone")} /></Field>
              <Field label="Email"><input type="email" className={inputCls} {...bind(f, setF, "email")} /></Field>
              {editing && <Field label="Status"><select className={inputCls} {...bind(f, setF, "status")}><option>Active</option><option>Inactive</option></select></Field>}
            </div>
            <div className="flex gap-2"><button className={btnPrimary} type="submit">Save</button><button type="button" className={btnGhost} onClick={() => setShow(false)}>Cancel</button></div>
          </form>
        </Card>
      )}

      <Card
        title={`Directory (${list.length})`}
        action={
          <div className="flex gap-2">
            <select className={inputCls} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option>All</option><option>Active</option><option>Inactive</option><option>Left</option></select>
            <div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className={`${inputCls} pl-9`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." /></div>
          </div>
        }
      >
        <Table heads={["Employee", "Company / Department", "Designation", "Items held", "Status", "Actions"]} min={900} empty="No employees found.">
          {list.map((x) => (
            <tr key={x.id} className={`hover:bg-slate-50 ${sel === x.id ? "bg-blue-50/50" : ""}`}>
              <td className={td}><div className="flex items-center gap-3"><Img src={x.photo} alt={x.name} /><div><p className="font-semibold text-slate-900">{x.name}</p><p className="text-xs text-slate-500">{x.empId}</p></div></div></td>
              <td className={td}>{db.companies.find((c) => c.id === x.companyId)?.name ?? "—"}<p className="text-xs text-slate-500">{deptName(db, x.departmentId)}</p></td>
              <td className={td}>{x.designation || "—"}</td>
              <td className={td}>{employeePossession(db, x.id).filter((r) => r.product?.itemType === "Reusable Asset").length + db.assets.filter((a) => a.employeeId === x.id && a.status === "Assigned").length}</td>
              <td className={td}><Badge>{x.status}</Badge></td>
              <td className={td}>
                <div className="flex gap-2">
                  <button className={btnPrimary} onClick={() => setSel(sel === x.id ? null : x.id)}><UserRound size={14} /> {sel === x.id ? "Close" : "Open"}</button>
                  <button className={btnGhost} disabled={!allowed || x.status === "Left"} onClick={() => { setEditing(x.id); setF({ empId: x.empId, name: x.name, companyId: x.companyId, departmentId: x.departmentId, designation: x.designation, joiningDate: x.joiningDate, phone: x.phone, email: x.email, photo: x.photo, status: x.status }); setShow(true); }}>Edit</button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      {selected && <EmployeeDetail ctx={ctx} emp={selected} allowed={allowed} actor={user.name} />}
    </div>
  );
}

function EmployeeDetail({ ctx, emp, allowed, actor }: { ctx: Ctx; emp: Employee; allowed: boolean; actor: string }) {
  const { db, run, can } = ctx;
  const possession = employeePossession(db, emp.id);
  const assets = db.assets.filter((a) => a.employeeId === emp.id && a.status === "Assigned");
  const reusable = possession.filter((r) => r.product?.itemType === "Reusable Asset");
  const office = reusable.filter((r) => r.issue.usage !== "Personal");
  const personal = reusable.filter((r) => r.issue.usage === "Personal");
  const issues = db.issues.filter((i) => i.employeeId === emp.id && ["Awaiting Acknowledgement", "Completed", "Pending Approval"].includes(i.status));
  const blocking = reusable.length + assets.length;
  const [tf, setTf] = useState({ companyId: emp.companyId, departmentId: emp.departmentId, note: "" });
  const [override, setOverride] = useState("");

  const events = useMemo(() => {
    const ev: { date: string; label: string; detail: string }[] = [{ date: emp.joiningDate, label: "Joined", detail: `${emp.designation || "Employee"}` }];
    db.issues.filter((i) => i.employeeId === emp.id).forEach((i) => {
      ev.push({ date: i.date, label: `Issued ${i.no}`, detail: `${i.lines.map((l) => `${l.qty} × ${pname(db, l.productId)}`).join(", ")} · ${i.usage} · ${i.status}` });
      if (i.ackAt) ev.push({ date: i.ackAt.slice(0, 10), label: `Acknowledged ${i.no}`, detail: "Employee confirmed receipt" });
    });
    db.returns.filter((r) => r.employeeId === emp.id).forEach((r) => ev.push({ date: r.date, label: `Return ${r.no}`, detail: `${r.lines.map((l) => `${l.qty} × ${pname(db, l.productId)} [${l.condition}]`).join(", ")} · ${r.status}` }));
    db.damages.filter((x) => x.employeeId === emp.id).forEach((x) => ev.push({ date: x.date, label: `${x.kind} recorded`, detail: `${x.qty} × ${pname(db, x.productId)} (${money(x.value)})` }));
    db.assets.forEach((a) => a.history.filter((h) => h.employeeId === emp.id).forEach((h) => ev.push({ date: h.date, label: `Asset ${a.tag}: ${h.action}`, detail: `${a.name}${h.note ? ` · ${h.note}` : ""}` })));
    emp.transfers.forEach((t) => ev.push({ date: t.date, label: "Transferred", detail: `${deptName(db, t.fromDeptId)} → ${deptName(db, t.toDeptId)}${t.note ? ` · ${t.note}` : ""}` }));
    if (emp.leftDate) ev.push({ date: emp.leftDate, label: "Left the company", detail: emp.clearanceNote });
    return ev.sort((a, b) => b.date.localeCompare(a.date));
  }, [db, emp]);

  function transfer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    run(
      (d) => {
        if (!tf.companyId) return fail(d, "Select the new company / office.");
        if (tf.companyId === emp.companyId && tf.departmentId === emp.departmentId) return fail(d, "Choose a different company or department.");
        const t = { date: todayStr(), fromCompanyId: emp.companyId, fromDeptId: emp.departmentId, toCompanyId: tf.companyId, toDeptId: tf.departmentId, by: actor, note: tf.note.trim() };
        return { db: { ...d, employees: upd(d.employees, emp.id, { companyId: tf.companyId, departmentId: tf.departmentId, transfers: [...emp.transfers, t] }) }, message: "Transfer recorded." };
      },
      { module: "Employees", action: "Transfer", detail: emp.empId }
    );
  }

  function clear() {
    run(
      (d) => {
        if (blocking > 0 && !override.trim()) return fail(d, "Return all items first, or enter a reason to clear with recorded liability.");
        if (blocking > 0 && !can("approve")) return fail(d, "Only an approver can clear an employee who still holds items.");
        const note = blocking > 0 ? `Cleared with outstanding items. Reason: ${override.trim()}` : "Cleared. No outstanding items.";
        const assetsAfter = d.assets.map((a) =>
          a.employeeId === emp.id && a.status === "Assigned" ? { ...a, status: "Lost" as AssetStatus, history: [...a.history, { date: todayStr(), action: "Marked lost at clearance", by: actor, note: override.trim(), employeeId: emp.id }] } : a
        );
        return { db: { ...d, assets: assetsAfter, employees: upd(d.employees, emp.id, { status: "Left", leftDate: todayStr(), clearanceNote: note }) }, message: "Clearance completed." };
      },
      { module: "Employees", action: "Clearance", detail: emp.empId }
    );
  }

  const itemTable = (rows: typeof reusable, empty: string) => (
    <Table heads={["Item", "Reference", "Qty held", "Acknowledgement"]} min={500} empty={empty}>
      {rows.map((r) => (
        <tr key={`${r.issue.id}-${r.idx}`}><td className={td}>{r.product?.name}</td><td className={td}>{r.issue.no}</td><td className={td}>{r.open}</td><td className={td}><Badge>{r.issue.status === "Completed" ? "Acknowledged" : "Pending"}</Badge></td></tr>
      ))}
    </Table>
  );

  return (
    <div className="space-y-6">
      <Card
        title={`${emp.name} · ${emp.empId}`}
        subtitle={`${db.companies.find((c) => c.id === emp.companyId)?.name ?? ""} · ${deptName(db, emp.departmentId)}`}
        action={
          <button className={btnGhost} onClick={() => downloadCsv(`employee-${emp.empId}.csv`, [["Date", "Type", "Detail"], ...events.map((x) => [x.date, x.label, x.detail])])}><Download size={15} /> Export history</button>
        }
      >
        <div className="grid gap-6 xl:grid-cols-2">
          <div><h3 className="mb-2 text-sm font-bold text-slate-800">Office-use items in possession</h3>{itemTable(office, "No office-use assets.")}</div>
          <div><h3 className="mb-2 text-sm font-bold text-slate-800">Personal items in possession</h3>{itemTable(personal, "No personal items.")}</div>
        </div>
        <h3 className="mb-2 mt-6 text-sm font-bold text-slate-800">Tagged assets assigned</h3>
        <Table heads={["Tag", "Asset", "Serial", "Since"]} min={500} empty="No tagged assets assigned.">
          {assets.map((a) => (<tr key={a.id}><td className={td}>{a.tag}</td><td className={td}>{a.name}</td><td className={td}>{a.serial || "—"}</td><td className={td}>{a.history[a.history.length - 1]?.date}</td></tr>))}
        </Table>
        <h3 className="mb-2 mt-6 text-sm font-bold text-slate-800">Issued and consumed items</h3>
        <Table heads={["Date", "Reference", "Product", "Type", "Use", "Issued", "Returned", "Lost", "Consumed / held", "Status"]} min={1000} empty="Nothing issued to this employee yet.">
          {issues.flatMap((i) => i.lines.map((l, idx) => {
            const p = db.products.find((x) => x.id === l.productId);
            return (
              <tr key={`${i.id}-${idx}`}>
                <td className={td}>{i.date}</td><td className={td}>{i.no}</td><td className={td}>{p?.name}</td><td className={td}>{p?.itemType}</td><td className={td}>{i.usage}</td>
                <td className={td}>{l.qty}</td><td className={td}>{l.returnedQty}</td><td className={td}>{l.lostQty}</td><td className={td}>{Math.max(0, l.qty - l.returnedQty - l.lostQty)}</td><td className={td}><Badge>{i.status}</Badge></td>
              </tr>
            );
          }))}
        </Table>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Transfer (department / office)" subtitle="Items stay with the employee. Reassign tagged assets in the Asset Register if needed.">
          <fieldset disabled={!allowed || emp.status === "Left"} className="m-0 min-w-0 border-0 p-0">
            <form onSubmit={transfer} className="space-y-3">
              <Field label="New company / office"><select className={inputCls} value={tf.companyId} onChange={(e) => setTf({ ...tf, companyId: e.target.value, departmentId: "" })}>{db.companies.filter((c) => c.status === "Active").map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
              <Field label="New department"><select className={inputCls} value={tf.departmentId} onChange={(e) => setTf({ ...tf, departmentId: e.target.value })}><option value="">None</option>{db.departments.filter((d) => d.companyId === tf.companyId).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></Field>
              <Field label="Note"><input className={inputCls} value={tf.note} onChange={(e) => setTf({ ...tf, note: e.target.value })} /></Field>
              <button className={btnPrimary} type="submit">Record Transfer</button>
            </form>
          </fieldset>
        </Card>

        <Card title="Clearance (leaving the company)" subtitle="Shows what must be returned before the employee can leave.">
          {emp.status === "Left" ? (
            <Notice>Cleared on {emp.leftDate}. {emp.clearanceNote}</Notice>
          ) : (
            <div className="space-y-3">
              <div className={`rounded-xl p-3 text-sm ${blocking > 0 ? "bg-amber-50 text-amber-900" : "bg-emerald-50 text-emerald-800"}`}>
                {blocking > 0 ? `${reusable.length} reusable item line(s) and ${assets.length} tagged asset(s) are still outstanding.` : "No outstanding reusable items or assets."}
                {issues.some((i) => i.status === "Awaiting Acknowledgement") && " Some issues are still waiting for acknowledgement."}
              </div>
              {blocking > 0 && <Field label="Reason to clear with liability (approver only)"><input className={inputCls} value={override} onChange={(e) => setOverride(e.target.value)} /></Field>}
              <button className={btnDanger} disabled={!allowed} onClick={clear}>Complete Clearance</button>
            </div>
          )}
        </Card>
      </div>

      <Card title="Lifetime History" subtitle="Issues, acknowledgements, returns, damage, loss, assets and transfers.">
        <Table heads={["Date", "Event", "Detail"]} min={700} empty="No history.">
          {events.map((x, i) => (<tr key={i}><td className={td}>{x.date}</td><td className={`${td} font-medium`}>{x.label}</td><td className={td}>{x.detail}</td></tr>))}
        </Table>
      </Card>
    </div>
  );
}

/* =========================================================
   ASSET REGISTER (tagged fixed assets)
========================================================= */

const blankAsset = { name: "", category: "IT Equipment", serial: "", vendorId: "", companyId: "", purchaseDate: todayStr(), warrantyUntil: "", cost: "0", condition: "New", notes: "", image: "" };

function Assets({ ctx }: { ctx: Ctx }) {
  const { db, can, run, user } = ctx;
  const allowed = can("asset.manage");
  const [show, setShow] = useState(false);
  const [f, setF] = useState(blankAsset);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [target, setTarget] = useState<Record<string, string>>({});

  function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const ok = run(
      (d) => {
        if (!f.name.trim()) return fail(d, "Asset name is required.");
        if (f.serial.trim() && d.assets.some((a) => a.serial.toLowerCase() === f.serial.trim().toLowerCase())) return fail(d, "This serial number is already registered.");
        const { db: d1, no } = withNo(d, "AST");
        const a: Asset = {
          id: makeId("as"), tag: no, name: f.name.trim(), category: f.category, serial: f.serial.trim(), vendorId: f.vendorId, companyId: f.companyId,
          purchaseDate: f.purchaseDate, warrantyUntil: f.warrantyUntil, cost: Math.max(0, Number(f.cost) || 0), condition: f.condition, status: "In Store",
          holderType: "None", employeeId: "", departmentId: "", image: f.image, notes: f.notes.trim(),
          history: [{ date: todayStr(), action: "Registered", by: user.name, note: "", employeeId: "" }],
        };
        return { db: { ...d1, assets: [a, ...d1.assets] }, message: `${no} registered.` };
      },
      { module: "Assets", action: "Register asset", detail: f.name }
    );
    if (ok) { setF(blankAsset); setShow(false); }
  }

  function change(a: Asset, patch: Partial<Asset>, action: string, note = "", employeeId = "") {
    run(
      (d) => ({ db: { ...d, assets: upd(d.assets, a.id, { ...patch, history: [...a.history, { date: todayStr(), action, by: user.name, note, employeeId }] }) }, message: `${a.tag}: ${action}.` }),
      { module: "Assets", action, detail: a.tag }
    );
  }

  function assign(a: Asset) {
    const v = target[a.id] ?? "";
    if (!v) { ctx.notify("Select an employee or department first.", "error"); return; }
    const [kind, id] = v.split(":");
    if (kind === "e") {
      const emp = db.employees.find((x) => x.id === id);
      if (!emp || emp.status !== "Active") { ctx.notify("Select an active employee.", "error"); return; }
      change(a, { status: "Assigned", holderType: "Employee", employeeId: id, departmentId: "" }, "Assigned", emp.name, id);
    } else {
      change(a, { status: "Assigned", holderType: "Department", departmentId: id, employeeId: "" }, "Assigned", deptName(db, id));
    }
  }

  const soon = Date.now() + 30 * 86400000;
  const warnOf = (a: Asset) => {
    if (!a.warrantyUntil || a.status === "Disposed") return "";
    const t = new Date(`${a.warrantyUntil}T00:00:00`).getTime();
    return t < Date.now() ? "Expired" : t < soon ? "Expiring" : "";
  };
  const list = db.assets.filter((a) => (statusFilter === "All" || a.status === statusFilter) && `${a.tag} ${a.name} ${a.serial} ${a.category}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <Section title="Asset Register" subtitle="Tagged office assets: who uses what, warranty, repair and disposal." action={<button className={btnPrimary} disabled={!allowed} onClick={() => setShow(true)}><Plus size={16} /> Register Asset</button>} />
      {!allowed && <Notice tone="amber">Your role can view assets but cannot change them.</Notice>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat title="Total Assets" value={String(db.assets.length)} />
        <Stat title="Assigned" value={String(db.assets.filter((a) => a.status === "Assigned").length)} tone="emerald" />
        <Stat title="Warranty Alerts" value={String(db.assets.filter((a) => warnOf(a)).length)} detail="Expired or ending in 30 days" tone="amber" />
        <Stat title="Book Value (cost)" value={money(db.assets.filter((a) => a.status !== "Disposed" && a.status !== "Lost").reduce((s, a) => s + a.cost, 0))} tone="violet" />
      </div>

      {show && (
        <Card title="Register Asset" action={<button onClick={() => setShow(false)} aria-label="Close"><X size={18} /></button>}>
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Asset Name *"><input required className={inputCls} {...bind(f, setF, "name")} /></Field>
            <Field label="Category"><input className={inputCls} {...bind(f, setF, "category")} /></Field>
            <Field label="Serial Number"><input className={inputCls} {...bind(f, setF, "serial")} /></Field>
            <Field label="Vendor"><select className={inputCls} {...bind(f, setF, "vendorId")}><option value="">None</option>{db.vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</select></Field>
            <Field label="Office"><select className={inputCls} {...bind(f, setF, "companyId")}><option value="">None</option>{db.companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
            <Field label="Cost (BDT)"><input type="number" min="0" className={inputCls} {...bind(f, setF, "cost")} /></Field>
            <Field label="Purchase Date"><input type="date" className={inputCls} {...bind(f, setF, "purchaseDate")} /></Field>
            <Field label="Warranty Until"><input type="date" className={inputCls} {...bind(f, setF, "warrantyUntil")} /></Field>
            <Field label="Condition"><select className={inputCls} {...bind(f, setF, "condition")}><option>New</option><option>Good</option><option>Fair</option><option>Poor</option></select></Field>
            <Field label="Notes" className="sm:col-span-2 lg:col-span-3"><input className={inputCls} {...bind(f, setF, "notes")} /></Field>
            <div className="sm:col-span-2 lg:col-span-3"><ImageUpload label="Asset Photo" value={f.image} onChange={(v) => setF({ ...f, image: v })} /></div>
            <div className="flex gap-2 sm:col-span-2 lg:col-span-3"><button className={btnPrimary} type="submit">Register</button><button type="button" className={btnGhost} onClick={() => setShow(false)}>Cancel</button></div>
          </form>
        </Card>
      )}

      <Card
        title={`Assets (${list.length})`}
        action={
          <div className="flex gap-2">
            <select className={inputCls} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>{["All", "In Store", "Assigned", "Under Repair", "Disposed", "Lost"].map((s) => <option key={s}>{s}</option>)}</select>
            <input className={inputCls} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." />
          </div>
        }
      >
        <Table heads={["Asset", "Status", "Holder", "Warranty", "Cost", "Actions"]} min={1100} empty="No assets registered.">
          {list.map((a) => {
            const holder = a.holderType === "Employee" ? db.employees.find((e) => e.id === a.employeeId)?.name : a.holderType === "Department" ? deptName(db, a.departmentId) : "—";
            const w = warnOf(a);
            return (
              <tr key={a.id}>
                <td className={td}><div className="flex items-center gap-3"><Img src={a.image} alt={a.name} /><div><p className="font-semibold">{a.name}</p><p className="text-xs text-slate-500">{a.tag} · {a.serial || "no serial"}</p></div></div></td>
                <td className={td}><Badge>{a.status}</Badge></td>
                <td className={td}>{holder}</td>
                <td className={td}>{a.warrantyUntil || "—"} {w && <Badge>{w}</Badge>}</td>
                <td className={td}>{money(a.cost)}</td>
                <td className={td}>
                  {allowed && (a.status === "In Store" || a.status === "Assigned") && (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <select className={inputCls} value={target[a.id] ?? ""} onChange={(e) => setTarget({ ...target, [a.id]: e.target.value })}>
                          <option value="">Assign to...</option>
                          <optgroup label="Employees">{db.employees.filter((e) => e.status === "Active").map((e) => <option key={e.id} value={`e:${e.id}`}>{e.empId} — {e.name}</option>)}</optgroup>
                          <optgroup label="Departments">{db.departments.map((d) => <option key={d.id} value={`d:${d.id}`}>{deptName(db, d.id)}</option>)}</optgroup>
                        </select>
                        <button className={btnPrimary} onClick={() => assign(a)}>Assign</button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {a.status === "Assigned" && <button className={btnGhost} onClick={() => change(a, { status: "In Store", holderType: "None", employeeId: "", departmentId: "" }, "Returned to store", "", a.employeeId)}>Return to store</button>}
                        <button className={btnGhost} onClick={() => change(a, { status: "Under Repair", holderType: "None", employeeId: "", departmentId: "" }, "Sent for repair", "", a.employeeId)}>Repair</button>
                        <button className={btnDanger} onClick={() => change(a, { status: "Lost", holderType: "None" }, "Marked lost", "", a.employeeId)}>Lost</button>
                      </div>
                    </div>
                  )}
                  {allowed && a.status === "Under Repair" && (
                    <div className="flex gap-2">
                      <button className={btnGhost} onClick={() => change(a, { status: "In Store" }, "Repair completed")}>Back to store</button>
                      <button className={btnDanger} onClick={() => change(a, { status: "Disposed" }, "Disposed")}>Dispose</button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </Table>
      </Card>
    </div>
  );
}