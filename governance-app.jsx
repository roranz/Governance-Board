import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";

// ============ Storage ============
const SK = "gov_app_v3";
async function loadState() {
  try { const r = await window.storage.get(SK); return r ? JSON.parse(r.value) : null; }
  catch { return null; }
}
async function saveState(s) {
  try { await window.storage.set(SK, JSON.stringify(s)); } catch (e) { console.error(e); }
}

// ============ Seed ============
const seed = {
  apps: [
    { id: "cjce", name: "CJ CE", desc: "Customer Journey · Cliente Esistente", color: "#5B8DEF" },
    { id: "reev0", name: "REEV0", desc: "Reportistica Evolutiva", color: "#34D399" },
    { id: "wmcr0", name: "WMCR0", desc: "Wealth Mgmt Change Request", color: "#F0A04B" },
  ],
  projects: [
    { id: "cjonb", appId: "cjce", name: "CJ ONBOARDING", status: "In corso", start: "2026-05-01", end: "2026-07-31", progress: 45, owner: "Paolo", budgetH: 320, spentH: 150 },
    { id: "cjrec", appId: "cjce", name: "CJ RECESSO", status: "In corso", start: "2026-06-01", end: "2026-09-15", progress: 20, owner: "Paolo", budgetH: 240, spentH: 48 },
    { id: "reevrpt", appId: "reev0", name: "Analisi Patrimonio · Disclaimer", status: "Pianificato", start: "2026-06-15", end: "2026-08-01", progress: 10, owner: "Team", budgetH: 120, spentH: 12 },
    { id: "wmcrq3", appId: "wmcr0", name: "WMCR Q3 Change Set", status: "In corso", start: "2026-04-15", end: "2026-07-10", progress: 65, owner: "Team", budgetH: 180, spentH: 117 },
  ],
  tasks: [
    { id: "t1", projectId: "cjonb", name: "Analisi requisiti onboarding", status: "done", owner: "Team", due: "2026-05-20" },
    { id: "t2", projectId: "cjonb", name: "Sviluppo flusso KYC", status: "doing", owner: "Team", due: "2026-06-30" },
    { id: "t3", projectId: "cjonb", name: "Integrazione anagrafica", status: "todo", owner: "Team", due: "2026-07-15" },
    { id: "t4", projectId: "cjrec", name: "Mappatura processo recesso", status: "doing", owner: "Team", due: "2026-07-01" },
    { id: "t5", projectId: "cjrec", name: "Definizione regole legali", status: "todo", owner: "Team", due: "2026-07-20" },
    { id: "t6", projectId: "reevrpt", name: "Adattamento footer/layout", status: "todo", owner: "Team", due: "2026-07-05" },
    { id: "t7", projectId: "reevrpt", name: "Test disclaimer multi-scenario", status: "todo", owner: "Team", due: "2026-07-18" },
    { id: "t8", projectId: "wmcrq3", name: "Test multi-scenario", status: "doing", owner: "Team", due: "2026-06-25" },
    { id: "t9", projectId: "wmcrq3", name: "Coordinamento release", status: "todo", owner: "Team", due: "2026-07-08" },
  ],
  milestones: [
    { id: "m1", projectId: "cjonb", name: "Go-live onboarding", date: "2026-07-31", done: false },
    { id: "m2", projectId: "cjrec", name: "UAT recesso", date: "2026-08-20", done: false },
    { id: "m3", projectId: "wmcrq3", name: "Release Q3", date: "2026-07-10", done: false },
    { id: "m4", projectId: "reevrpt", name: "Approvazione disclaimer", date: "2026-07-01", done: false },
  ],
  todos: [
    { id: "td1", text: "Preparare doc giustificazione change request", status: "todo", priority: "Alta", due: "2026-06-16", projectId: "reevrpt", createdAt: "2026-06-10", completedAt: "" },
    { id: "td2", text: "Coordinare release con il team", status: "todo", priority: "Media", due: "2026-07-08", projectId: "wmcrq3", createdAt: "2026-06-12", completedAt: "" },
    { id: "td3", text: "Verbalizzare riunione settimanale", status: "done", priority: "Bassa", due: "", projectId: "", createdAt: "2026-06-05", completedAt: "2026-06-09" },
    { id: "td4", text: "Sollecitare feedback su CJ RECESSO", status: "todo", priority: "Media", due: "", projectId: "cjrec", createdAt: "2026-06-13", completedAt: "" },
  ],
  owners: ["Team", "Paolo"],
};
function ensureOwners(s) {
  if (!s.owners) s.owners = ["Team", "Paolo"];
  s.tasks.forEach((t) => { if (!t.owner) t.owner = "Team"; });
  s.projects.forEach((p) => { if (!p.owner) p.owner = "Team"; if (p.budgetH === undefined) p.budgetH = 0; if (p.spentH === undefined) p.spentH = 0; if (p.disabled === undefined) p.disabled = false; });
  // backfill personal todos to new schema (status/due/projectId)
  (s.todos || []).forEach((t) => {
    if (!t.status) t.status = t.done ? "done" : "todo";
    if (t.due === undefined) t.due = "";
    if (t.projectId === undefined) t.projectId = "";
    if (t.createdAt === undefined) t.createdAt = "";
    if (t.completedAt === undefined) t.completedAt = t.status === "done" ? "" : "";
    delete t.done;
  });
  return s;
}

// ============ Theme (dark) ============
const C = {
  bg: "#0F1420", panel: "#1A2130", panel2: "#212A3B", border: "#2C3548", borderHi: "#3A465C",
  text: "#E6EAF2", textDim: "#94A0B5", textFaint: "#5E6B82",
  accent: "#5B8DEF", accentDim: "#2A3B5E",
  todo: "#5E6B82", doing: "#5B8DEF", done: "#34D399", plan: "#F0A04B",
  danger: "#F87171", warn: "#FBBF24",
};
const KCOLS = [
  { id: "todo", label: "To do", color: C.todo },
  { id: "doing", label: "In progress", color: C.doing },
  { id: "done", label: "Completed", color: C.done },
];
const PROJ_COLS = [
  { id: "Pianificato", label: "Planned", color: C.plan },
  { id: "In corso", label: "In progress", color: C.doing },
  { id: "Completato", label: "Completed", color: C.done },
];
const PRIO = { Alta: C.danger, Media: C.warn, Bassa: C.textDim };
const uid = () => Math.random().toString(36).slice(2, 9);
const fmtDate = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("en-US", { day: "2-digit", month: "short" }) : "";
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
// numero di giorni lavorativi (lun-ven) tra due date ISO, estremo finale incluso; da..a
function workingDays(fromIso, toIso) {
  if (!fromIso || !toIso) return 0;
  const a = new Date(fromIso + "T00:00:00"), b = new Date(toIso + "T00:00:00");
  if (b < a) return 0;
  let n = 0; const c = new Date(a);
  while (c <= b) { const wd = c.getDay(); if (wd !== 0 && wd !== 6) n++; c.setDate(c.getDate() + 1); }
  return n;
}

// ============ App ============
export default function App() {
  const [state, setState] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [nav, setNav] = useState({ tab: "dashboard", appId: null, projectId: null });

  useEffect(() => { loadState().then((s) => { setState(ensureOwners(s || seed)); setLoaded(true); }); }, []);
  useEffect(() => { if (loaded && state) saveState(state); }, [state, loaded]);
  const update = useCallback((fn) => setState((p) => fn(structuredClone(p))), []);

  const go = useCallback((patch) => setNav((n) => ({ ...n, ...patch })), []);
  const fileInputRef = useRef(null);

  const doSave = useCallback(() => {
    try {
      downloadFile(`Governance Board_${today()}.json`, JSON.stringify(state, null, 2), "application/json");
    } catch (e) { alert("Errore nel salvataggio: " + e.message); }
  }, [state]);

  const doLoadFile = useCallback(async (file) => {
    if (!file) return;
    try {
      const txt = await readFileText(file);
      const data = JSON.parse(txt);
      if (!data || !data.projects || !data.apps) throw new Error("file non valido: mancano apps/projects.");
      setState(ensureOwners(data));
      setNav({ tab: "dashboard", appId: null, projectId: null });
    } catch (e) { alert("Caricamento fallito: " + e.message); }
  }, []);

  const doExport = useCallback(() => {
    try {
      const html = buildReportHTML(state);
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `governance-report-${today()}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e) {
      alert("Errore durante l'export: " + e.message);
    }
  }, [state]);

  if (!state) return <div style={{ background: C.bg, color: C.textDim, padding: 40, fontFamily: "system-ui" }}>Loading…</div>;

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: "◫" },
    { id: "apps", label: "Applications", icon: "▦" },
    { id: "projects", label: "Projects", icon: "▤" },
    { id: "board", label: "Tasks", icon: "▥" },
    { id: "gantt", label: "Gantt", icon: "▰" },
    { id: "capacity", label: "Capacity", icon: "◷" },
    { id: "todos", label: "My tasks", icon: "✓" },
  ];

  return (
    <div style={st.root}>
      <style>{globalCss}</style>
      <div style={st.inner}>
      <header style={st.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={st.logo}>GB</div>
          <div>
            <div style={st.h1}>Governance Board</div>
            <div style={st.sub}>Tasks · Projects · Applications</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <input ref={fileInputRef} type="file" accept=".json,application/json" style={{ display: "none" }}
            onChange={(e) => { doLoadFile(e.target.files[0]); e.target.value = ""; }} />
          <button style={st.saveBtn} onClick={doSave} title="Save data to a .json file">💾 Save</button>
          <button style={st.loadBtn} onClick={() => fileInputRef.current && fileInputRef.current.click()} title="Load a saved .json file">📂 Load</button>
          <button style={st.exportBtn} onClick={doExport} title="Generate an HTML report with all sections (print to PDF from there)">↧ Print report</button>
          <div style={st.todayBox}>
            <div style={st.todayLabel}>Today</div>
            <div style={st.todayDate}>{new Date().toLocaleDateString("en-US", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</div>
          </div>
        </div>
      </header>

      <nav style={st.nav}>
        {tabs.map((t) => (
          <button key={t.id} className="navbtn" onClick={() => go({ tab: t.id })}
            style={{ ...st.navBtn, ...(nav.tab === t.id ? st.navBtnActive : {}) }}>
            <span style={{ marginRight: 7, opacity: .8 }}>{t.icon}</span>{t.label}
          </button>
        ))}
      </nav>

      {/* breadcrumb for interdependent navigation */}
      <Breadcrumb state={state} nav={nav} go={go} />

      <main style={st.main}>
        {nav.tab === "dashboard" && <Dashboard state={state} go={go} />}
        {nav.tab === "apps" && <AppsView state={state} update={update} go={go} nav={nav} />}
        {nav.tab === "projects" && <ProjectsView state={state} update={update} go={go} nav={nav} />}
        {nav.tab === "board" && <BoardView state={state} update={update} go={go} nav={nav} />}
        {nav.tab === "gantt" && <GanttView state={state} update={update} go={go} nav={nav} />}
        {nav.tab === "capacity" && <CapacityView state={state} update={update} go={go} nav={nav} />}
        {nav.tab === "todos" && <TodosView state={state} update={update} />}
      </main>
      <footer style={st.footer}>Created by Paolo Mazio & Michele Bettin</footer>
      </div>
    </div>
  );
}

// ============ Report HTML builder (standalone, scaricabile) ============
function buildReportHTML(state) {
  const t = today();
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const statusLabel = { todo: "To do", doing: "In progress", done: "Completed" };
  const projById = (id) => state.projects.find((p) => p.id === id);
  const appById = (id) => state.apps.find((a) => a.id === id);
  const badge = (s) => {
    const map = { "In corso": ["#DCE9FB", "#14467C"], "Completato": ["#D6F3E6", "#0B6A4E"], "Pianificato": ["#FCEBD3", "#8A5A0B"], "Da fare": ["#EEECE6", "#555"] };
    const [bg, fg] = map[s] || map["Da fare"];
    return `<span style="background:${bg};color:${fg};font-size:11px;padding:2px 7px;border-radius:4px;font-weight:600">${esc(s)}</span>`;
  };
  const overdueTasks = state.tasks.filter((x) => x.due && x.due < t && x.status !== "done").length;
  const overdueMs = state.milestones.filter((m) => !m.done && m.date < t).length;
  const avg = state.projects.length ? Math.round(state.projects.reduce((a, p) => a + p.progress, 0) / state.projects.length) : 0;
  const dateLong = new Date().toLocaleDateString("en-US", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

  // Applicativi rows
  const appRows = state.apps.map((a) => {
    const projs = state.projects.filter((p) => p.appId === a.id);
    const tn = state.tasks.filter((x) => projs.some((p) => p.id === x.projectId)).length;
    return `<tr><td>${esc(a.name)}</td><td style="color:#555">${esc(a.desc)}</td><td>${projs.length}</td><td>${tn}</td></tr>`;
  }).join("");

  // Progetti rows
  const projRows = state.projects.map((p) => {
    const app = appById(p.appId);
    return `<tr><td style="color:${app?.color||"#333"}">${esc(app?.name)}</td><td>${esc(p.name)}</td><td>${badge(p.status)}</td><td>${fmtDate(p.start)}</td><td>${fmtDate(p.end)}</td><td>${p.progress}%</td><td style="color:#555">${esc(p.owner||"Team")}</td></tr>`;
  }).join("");

  // Attivita rows
  const taskRows = [...state.tasks].sort((a, b) => {
    const pa = projById(a.projectId), pb = projById(b.projectId);
    return (appById(pa?.appId)?.name||"").localeCompare(appById(pb?.appId)?.name||"") || (pa?.name||"").localeCompare(pb?.name||"") || (a.due||"9999").localeCompare(b.due||"9999");
  }).map((x) => {
    const p = projById(x.projectId), app = appById(p?.appId);
    const od = x.due && x.due < t && x.status !== "done";
    return `<tr><td style="color:${app?.color||"#333"}">${esc(app?.name)}</td><td style="color:#555">${esc(p?.name)}</td><td>${esc(x.name)}</td><td>${badge(statusLabel[x.status])}</td><td style="color:#555">${esc(x.owner||"Team")}</td><td style="color:${od?"#C0392B":"#555"};font-weight:${od?600:400}">${x.due?fmtDate(x.due)+(od?" ⚠":""):"—"}</td></tr>`;
  }).join("");

  // Milestone rows
  const msRows = [...state.milestones].sort((a, b) => a.date.localeCompare(b.date)).map((m) => {
    const p = projById(m.projectId), app = appById(p?.appId);
    const od = !m.done && m.date < t;
    const stt = m.done ? "Completed" : od ? "Overdue" : "Scheduled";
    const col = m.done ? "#0B6A4E" : od ? "#C0392B" : "#8A5A0B";
    return `<tr><td style="color:${app?.color||"#333"}">${esc(app?.name)}</td><td style="color:#555">${esc(p?.name)}</td><td>${esc(m.name)}</td><td style="color:${od?"#C0392B":"#1A2130"}">${fmtDate(m.date)}</td><td style="color:${col};font-weight:600">${stt}</td></tr>`;
  }).join("");

  // Gantt (inline svg-like via divs)
  const ds = state.projects.flatMap((p) => [new Date(p.start), new Date(p.end)]).filter((d) => !isNaN(d));
  let ganttHTML = '<div style="color:#888;font-size:12px">No data.</div>';
  if (ds.length) {
    let mn = new Date(Math.min(...ds)), mx = new Date(Math.max(...ds));
    mn = new Date(mn.getFullYear(), mn.getMonth(), 1); mx = new Date(mx.getFullYear(), mx.getMonth() + 1, 0);
    const months = []; const c = new Date(mn); while (c <= mx) { months.push(new Date(c)); c.setMonth(c.getMonth() + 1); }
    const span = mx - mn || 1;
    const pct = (d) => ((new Date(d) - mn) / span) * 100;
    const tp = pct(t);
    const head = months.map((m, i) => `<div style="flex:1;font-size:9px;color:#666;text-align:center;border-left:${i?"1px solid #eee":"none"}">${m.toLocaleDateString("en-US",{month:"short",year:"2-digit"})}</div>`).join("");
    const bars = state.projects.map((p) => {
      const app = appById(p.appId);
      const l = pct(p.start), w = pct(p.end) - l;
      const ms = state.milestones.filter((m) => m.projectId === p.id);
      const msDots = ms.map((m) => `<div style="position:absolute;left:${pct(m.date)}%;top:0;transform:translateX(-50%);color:#E08A1E;font-size:11px">◆</div>`).join("");
      return `<div style="display:flex;align-items:center;margin-bottom:7px">
        <div style="width:140px;font-size:10px;color:#1A2130;flex-shrink:0;padding-right:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.name)}</div>
        <div style="flex:1;position:relative;height:16px">
          <div style="position:absolute;left:0;right:0;top:7px;height:2px;background:#eee"></div>
          <div style="position:absolute;left:${l}%;width:${Math.max(w,1)}%;height:13px;top:1px;background:${(app?.color||"#888")}44;border-radius:3px"></div>
          <div style="position:absolute;left:${l}%;width:${Math.max(w*p.progress/100,.5)}%;height:13px;top:1px;background:${app?.color||"#888"};border-radius:3px;display:flex;align-items:center;justify-content:center"><span style="font-size:8px;color:#fff;font-weight:700">${p.progress>12?p.progress+"%":""}</span></div>
          ${msDots}
        </div></div>`;
    }).join("");
    const todayLine = (tp >= 0 && tp <= 100) ? `<div style="position:absolute;left:calc(140px + (100% - 140px) * ${tp} / 100);top:0;bottom:0;border-left:1.5px dashed #C0392B;z-index:2"></div>` : "";
    ganttHTML = `<div style="position:relative">
      <div style="display:flex;margin-left:140px;border-bottom:1px solid #ccc;padding-bottom:3px;margin-bottom:6px">${head}</div>
      <div style="position:relative">${todayLine}${bars}</div>
      <div style="font-size:9px;color:#888;margin-top:6px">◆ Milestone · dashed line = today (${fmtDate(t)})</div>
    </div>`;
  }

  const kpi = (v, l, danger) => `<div style="flex:1;border:1px solid #ddd;border-radius:6px;padding:8px 10px;text-align:center"><div style="font-size:20px;font-weight:700;color:${danger?"#C0392B":"#1A2130"}">${v}</div><div style="font-size:10px;color:#777;margin-top:2px">${l}</div></div>`;
  const sec = (n, title, body) => `<section style="margin-bottom:20px;page-break-inside:avoid"><h2 style="font-size:14px;font-weight:700;color:#1A2130;border-left:3px solid #5B8DEF;padding-left:8px;margin:0 0 8px">${n} · ${title}</h2>${body}</section>`;
  const tbl = (head, rows) => `<table style="width:100%;border-collapse:collapse;font-size:11px"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>`;
  const th = (h, w) => `<th style="text-align:left;background:#1A2130;color:#fff;font-weight:600;padding:6px 8px;border:1px solid #1A2130;font-size:10.5px${w?";width:"+w:""}">${h}</th>`;

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Governance Report ${t}</title>
<style>
  body{font-family:Arial,Helvetica,sans-serif;color:#1A2130;background:#fff;margin:0;padding:28px 32px;max-width:1000px;margin:0 auto}
  td{padding:5px 8px;border:1px solid #e2e2e2;vertical-align:top}
  .toolbar{position:sticky;top:0;background:#fff;padding:10px 0 14px;border-bottom:1px solid #eee;margin-bottom:18px;display:flex;gap:10px;align-items:center}
  .btn{background:#5B8DEF;color:#fff;border:none;border-radius:6px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer}
  .hint{font-size:12px;color:#888}
  @media print{.toolbar{display:none}@page{size:A4 portrait;margin:14mm 12mm}section{page-break-inside:avoid}tr{page-break-inside:avoid}thead{display:table-header-group}}
</style></head>
<body>
  <div class="toolbar"><button class="btn" onclick="window.print()">↧ Print / Save as PDF</button><span class="hint">Tip: in the print dialog enable "Background graphics" for colors.</span></div>
  <div style="border-bottom:2px solid #1A2130;padding-bottom:14px;margin-bottom:18px">
    <div style="font-size:22px;font-weight:700">Governance Board — Status report</div>
    <div style="font-size:13px;color:#555;margin-top:4px">Applications tracked: ${esc(state.apps.map((a)=>a.name).join(" · "))}</div>
    <div style="font-size:12px;color:#888;margin-top:2px;text-transform:capitalize">Updated on ${dateLong}</div>
    <div style="display:flex;gap:10px;margin-top:16px">
      ${kpi(state.apps.length,"Applications")}${kpi(state.projects.length,"Projects")}${kpi(avg+"%","Avg. progress")}${kpi(overdueTasks,"Overdue tasks",overdueTasks>0)}${kpi(overdueMs,"Overdue milestones",overdueMs>0)}
    </div>
  </div>
  ${sec("1","Applications", tbl(th("Application","18%")+th("Description")+th("Projects","14%")+th("Tasks","14%"), appRows))}
  ${sec("2","Projects", tbl(th("Applic.","11%")+th("Project")+th("Status","12%")+th("Start","11%")+th("End","11%")+th("Progr.","10%")+th("Owner","12%"), projRows))}
  ${sec("3","Gantt", ganttHTML)}
  ${sec("4","Tasks", tbl(th("Applic.","11%")+th("Project","22%")+th("Task")+th("Status","12%")+th("Owner","12%")+th("Due","12%"), taskRows))}
  ${sec("5","Milestone", tbl(th("Applic.","13%")+th("Project")+th("Milestone")+th("Date","14%")+th("Status","12%"), msRows))}
  <div style="font-size:9px;color:#aaa;border-top:1px solid #ddd;padding-top:8px;margin-top:10px">Governance Board · generated on ${new Date().toLocaleDateString("en-US")}</div>
</body></html>`;
}


// ============ Breadcrumb (cross-page links) ============
function Breadcrumb({ state, nav, go }) {
  const crumbs = [];
  if (nav.appId) {
    const a = state.apps.find((x) => x.id === nav.appId);
    if (a) crumbs.push({ label: a.name, onClick: () => go({ tab: "projects", projectId: null }) });
  }
  if (nav.projectId) {
    const p = state.projects.find((x) => x.id === nav.projectId);
    if (p) crumbs.push({ label: p.name, onClick: null });
  }
  if (!crumbs.length) return null;
  return (
    <div style={st.crumbBar}>
      <span style={{ color: C.textFaint, cursor: "pointer" }} onClick={() => go({ appId: null, projectId: null })}>All</span>
      {crumbs.map((c, i) => (
        <span key={i}>
          <span style={{ color: C.textFaint, margin: "0 8px" }}>›</span>
          <span style={{ color: c.onClick ? C.accent : C.text, cursor: c.onClick ? "pointer" : "default" }} onClick={c.onClick || undefined}>{c.label}</span>
        </span>
      ))}
      {(nav.appId || nav.projectId) && (
        <button style={st.clearFilter} onClick={() => go({ appId: null, projectId: null })}>✕ azzera filtro</button>
      )}
    </div>
  );
}

// ============ Events timeline (scadenze su asse temporale) ============
function EventsTimeline({ state, go }) {
  const [hover, setHover] = useState(null);
  const [appFilter, setAppFilter] = useState("all");
  const [horizon, setHorizon] = useState("weeks"); // days | weeks | months
  const t0 = today();
  const start = new Date(t0 + "T00:00:00");

  // horizon config: total span + tick step + tick label format + larghezza per giorno (px)
  const HZ = {
    days: { days: 21, tickDays: 1, fmt: { day: "2-digit", month: "short" }, pxPerDay: 30 },
    weeks: { days: 70, tickDays: 7, fmt: { day: "2-digit", month: "short" }, pxPerDay: 26 },
    months: { days: 180, tickDays: 30, fmt: { month: "short", year: "2-digit" }, pxPerDay: 22 },
  }[horizon];
  const end = new Date(start); end.setDate(start.getDate() + HZ.days);
  const startMs = start.getTime(), spanMs = end.getTime() - startMs;
  const nTicks = Math.round(HZ.days / HZ.tickDays);
  const plotW = HZ.days * HZ.pxPerDay; // larghezza area grafico in px

  const projById = (id) => state.projects.find((p) => p.id === id);
  const appOf = (pid) => { const p = projById(pid); return state.apps.find((a) => a.id === p?.appId); };
  const inWindow = (iso) => { const d = new Date(iso + "T00:00:00").getTime(); return d >= startMs && d <= end.getTime(); };
  const matchApp = (pid) => appFilter === "all" || projById(pid)?.appId === appFilter;

  const events = [];
  state.milestones.filter((m) => !m.done && m.date && inWindow(m.date) && matchApp(m.projectId)).forEach((m) => {
    const app = appOf(m.projectId);
    events.push({ id: "m" + m.id, kind: "milestone", date: m.date, name: m.name, proj: projById(m.projectId), app, projectId: m.projectId });
  });
  state.tasks.filter((t) => t.due && t.status !== "done" && inWindow(t.due) && matchApp(t.projectId)).forEach((t) => {
    const app = appOf(t.projectId);
    events.push({ id: "t" + t.id, kind: "task", date: t.due, name: t.name, proj: projById(t.projectId), app, projectId: t.projectId });
  });
  events.sort((a, b) => a.date.localeCompare(b.date));

  const xOf = (iso) => ((new Date(iso + "T00:00:00").getTime() - startMs) / spanMs) * 100;

  const ticks = [];
  for (let i = 0; i <= nTicks; i++) { const d = new Date(start); d.setDate(start.getDate() + i * HZ.tickDays); ticks.push(d); }

  // one fixed lane per applicativo (rispetta l'ordine di state.apps); only apps with events
  const appsWithEvents = state.apps.filter((a) => events.some((e) => e.app?.id === a.id));
  const laneOfApp = {};
  appsWithEvents.forEach((a, i) => { laneOfApp[a.id] = i; });
  const LANES = Math.max(appsWithEvents.length, 1);
  // within each lane, offset events that are horizontally too close so they don't overlap
  const MIN_GAP = (20 / plotW) * 100; // ~20px icon width as % of plot, so only true overlaps stack
  const SUBROWS = 3; // max vertical sub-positions within a lane
  const byLane = {};
  const placed = events.map((e) => {
    const lane = laneOfApp[e.app?.id] ?? 0;
    const x = xOf(e.date);
    if (!byLane[lane]) byLane[lane] = [];
    // find a sub-row where no existing event is within MIN_GAP
    let sub = 0;
    for (let s = 0; s < SUBROWS; s++) {
      const clash = byLane[lane].some((p) => p.sub === s && Math.abs(p.x - x) < MIN_GAP);
      if (!clash) { sub = s; break; }
      sub = s;
    }
    const rec = { ...e, x, lane, sub };
    byLane[lane].push(rec);
    return rec;
  });
  const laneH = 40;
  const subH = 13; // vertical spacing between sub-rows
  const plotH = LANES * laneH;
  const LBL = 120; // larghezza colonna etichette applicativi a sinistra

  // distinct intuitive icons: milestone = bandierina (traguardo), attività = casella check (task)
  const Marker = ({ e }) => {
    const col = e.app?.color || C.textDim;
    const glow = hover === e.id;
    if (e.kind === "milestone") {
      return (
        <span title="Milestone" style={{ display: "inline-flex", filter: glow ? `drop-shadow(0 0 4px ${col})` : "none" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M6 21V4" stroke={col} strokeWidth="2.2" strokeLinecap="round" />
            <path d="M6 4.5h11.5l-2.3 3.4 2.3 3.4H6z" fill={col} stroke={col} strokeWidth="1.2" strokeLinejoin="round" />
          </svg>
        </span>
      );
    }
    return (
      <span title="Task" style={{ display: "inline-flex", filter: glow ? `drop-shadow(0 0 4px ${col})` : "none" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <rect x="3.5" y="3.5" width="17" height="17" rx="4" fill="none" stroke={col} strokeWidth="2.2" />
          <path d="M7.5 12.3l3 3 6-6.4" stroke={col} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  };

  const horizonOpts = [["days", "Days"], ["weeks", "Weeks"], ["months", "Months"]];

  return (
    <div style={{ ...st.panel }}>
      {/* controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button style={{ ...st.filterChip, ...(appFilter === "all" ? st.filterActive : {}) }} onClick={() => setAppFilter("all")}>All</button>
          {state.apps.map((a) => (
            <button key={a.id} style={{ ...st.filterChip, ...(appFilter === a.id ? st.filterActive : {}) }} onClick={() => setAppFilter(a.id)}>
              <span style={{ ...st.dot, background: a.color }} />{a.name}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 4, background: C.panel2, borderRadius: 8, padding: 3 }}>
          {horizonOpts.map(([k, lbl]) => (
            <button key={k} onClick={() => setHorizon(k)}
              style={{ background: horizon === k ? C.accent : "transparent", color: horizon === k ? "#0F1420" : C.textDim, border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12.5, fontWeight: 500, cursor: "pointer" }}>{lbl}</button>
          ))}
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
      {!placed.length ? (
        <div style={st.empty}>No deadlines in the selected horizon{appFilter !== "all" ? " for this application" : ""}.</div>
      ) : (
        <div style={{ width: LBL + plotW, minWidth: LBL + 480, position: "relative" }}>
          {/* time axis (shifted right to leave room for labels) */}
          <div style={{ position: "relative", height: 18, marginBottom: 6, marginLeft: LBL }}>
            {ticks.map((d, i) => (i % (horizon === "days" ? 2 : 1) === 0) && (
              <div key={i} style={{ position: "absolute", left: (i / nTicks) * 100 + "%", transform: "translateX(-50%)", fontSize: 10, color: C.textDim, whiteSpace: "nowrap" }}>
                {d.toLocaleDateString("en-US", HZ.fmt)}
              </div>
            ))}
          </div>
          {/* row container: left label gutter + plot */}
          <div style={{ position: "relative" }}>
            {/* left labels gutter */}
            {appsWithEvents.map((a, i) => (
              <div key={a.id} style={{ position: "absolute", left: 0, top: i * laneH, height: laneH, width: LBL - 10, display: "flex", alignItems: "center", gap: 6, paddingRight: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: a.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: a.color, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.name}</span>
              </div>
            ))}
            {/* plot area */}
            <div style={{ position: "relative", height: plotH, marginLeft: LBL, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, borderLeft: `1px solid ${C.border}` }}>
              {/* lane stripes per applicativo */}
              {appsWithEvents.map((a, i) => (
                <div key={a.id} style={{ position: "absolute", left: 0, right: 0, top: i * laneH, height: laneH, background: i % 2 ? "transparent" : C.panel2 + "55", borderTop: i ? `1px solid ${C.border}` : "none" }} />
              ))}
              {ticks.map((d, i) => (
                <div key={i} style={{ position: "absolute", left: (i / nTicks) * 100 + "%", top: 0, bottom: 0, width: 1, background: i === 0 ? "transparent" : C.panel2 }} />
              ))}
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 2, background: C.danger }} title="Today" />
              {placed.map((e) => (
                <div key={e.id}
                  onMouseEnter={() => setHover(e.id)} onMouseLeave={() => setHover(null)}
                  onClick={() => go({ tab: "board", appId: e.app?.id, projectId: e.projectId })}
                  style={{ position: "absolute", left: e.x + "%", top: e.lane * laneH + laneH / 2 + (e.sub - 1) * subH, transform: "translate(-50%,-50%)", cursor: "pointer", zIndex: hover === e.id ? 5 : 1 }}>
                  <Marker e={e} />
                  {hover === e.id && (
                    <div style={{ position: "absolute", left: 18, top: -4, background: C.panel2, border: `1px solid ${C.borderHi}`, borderRadius: 7, padding: "6px 9px", width: 180, boxShadow: "0 4px 14px rgba(0,0,0,.4)", zIndex: 10 }}>
                      <div style={{ fontSize: 12.5, color: C.text, fontWeight: 500 }}>{e.name}</div>
                      <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>{e.proj?.name}</div>
                      <div style={{ fontSize: 11, color: e.app?.color, marginTop: 2 }}>{e.kind === "milestone" ? "⚑ Milestone" : "☑ Task"} · {fmtDate(e.date)}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          {/* legend */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 10, fontSize: 11, color: C.textDim, alignItems: "center" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 21V4" stroke={C.textDim} strokeWidth="2.2" strokeLinecap="round" /><path d="M6 4.5h11.5l-2.3 3.4 2.3 3.4H6z" fill={C.textDim} stroke={C.textDim} strokeWidth="1.2" strokeLinejoin="round" /></svg>
              Milestone
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="3.5" y="3.5" width="17" height="17" rx="4" fill="none" stroke={C.textDim} strokeWidth="2.2" /><path d="M7.5 12.3l3 3 6-6.4" stroke={C.textDim} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Task
            </span>
            <span><span style={{ display: "inline-block", width: 2, height: 10, background: C.danger, marginRight: 4, verticalAlign: "middle" }} />Today</span>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

// ============ Dashboard ============
function Dashboard({ state, go }) {
  const total = state.projects.length;
  const inProg = state.projects.filter((p) => p.status === "In corso").length;
  const openTasks = state.tasks.filter((t) => t.status !== "done").length;
  const openMs = state.milestones.filter((m) => !m.done).length;

  const metrics = [
    { label: "Applications", value: state.apps.length, to: { tab: "apps" } },
    { label: "Projects", value: total, to: { tab: "projects" } },
    { label: "In progress", value: inProg, to: { tab: "projects" } },
    { label: "Open tasks", value: openTasks, to: { tab: "board" } },
    { label: "Open milestones", value: openMs, to: { tab: "gantt" } },
  ];
  // task counts by kanban col
  const colCounts = KCOLS.map((k) => ({ ...k, n: state.tasks.filter((t) => t.status === k.id).length }));

  return (
    <div>
      <div style={st.metricGrid}>
        {metrics.map((m) => (
          <div key={m.label} className="card-hover" style={st.metric} onClick={() => go(m.to)}>
            <div style={st.metricLabel}>{m.label}</div>
            <div style={st.metricVal}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={st.h2}>Deadlines timeline</div>
      <EventsTimeline state={state} go={go} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 14 }}>
        <div>
          <div style={st.h2}>Task distribution</div>
          <div style={st.panel}>
            {colCounts.map((c) => {
              const tot = state.tasks.length || 1;
              return (
                <div key={c.id} className="card-hover" style={{ marginBottom: 12, cursor: "pointer" }} onClick={() => go({ tab: "board" })}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: C.textDim }}><span style={{ ...st.dot, background: c.color }} />{c.label}</span>
                    <span style={{ fontSize: 13, color: C.text }}>{c.n}</span>
                  </div>
                  <div style={st.track}><div style={{ ...st.fill, width: (c.n / tot * 100) + "%", background: c.color }} /></div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div style={st.h2}>Project progress</div>
          <div style={st.panel}>
            {state.projects.map((p) => {
              const app = state.apps.find((a) => a.id === p.appId);
              return (
                <div key={p.id} className="card-hover" style={{ marginBottom: 12, cursor: "pointer" }}
                  onClick={() => go({ tab: "board", appId: p.appId, projectId: p.id })}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: C.text }}><span style={{ ...st.dot, background: app?.color }} />{p.name}</span>
                    <span style={{ fontSize: 12, color: C.textDim }}>{p.progress}%</span>
                  </div>
                  <div style={st.track}><div style={{ ...st.fill, width: p.progress + "%", background: app?.color }} /></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={st.h2}>Upcoming milestones</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14 }}>
        {state.apps.map((app) => {
          const projIds = state.projects.filter((p) => p.appId === app.id).map((p) => p.id);
          const list = [...state.milestones].filter((m) => !m.done && projIds.includes(m.projectId)).sort((a, b) => a.date.localeCompare(b.date));
          if (!list.length) return null;
          return (
            <div key={app.id} style={{ ...st.panel, borderTop: `3px solid ${app.color}`, marginBottom: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: app.color, marginBottom: 8 }}>{app.name}</div>
              {list.map((m) => {
                const proj = state.projects.find((p) => p.id === m.projectId);
                const od = m.date < today();
                return (
                  <div key={m.id} className="card-hover" style={{ ...st.msRow, cursor: "pointer" }}
                    onClick={() => go({ tab: "board", appId: app.id, projectId: m.projectId })}>
                    <span style={{ color: od ? C.danger : C.plan, fontSize: 13 }}>◆</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, color: C.text }}>{m.name}</div>
                      <div style={{ fontSize: 12, color: C.textDim }}>{proj?.name}</div>
                    </div>
                    <span style={{ fontSize: 13, color: od ? C.danger : C.textDim }}>{fmtDate(m.date)}</span>
                  </div>
                );
              })}
            </div>
          );
        })}
        {!state.milestones.some((m) => !m.done) && <div style={st.panel}><div style={st.empty}>No milestones.</div></div>}
      </div>

      <div style={st.h2}>Upcoming task deadlines</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14 }}>
        {state.apps.map((app) => {
          const projIds = state.projects.filter((p) => p.appId === app.id).map((p) => p.id);
          const list = state.tasks.filter((t) => t.due && t.status !== "done" && projIds.includes(t.projectId)).sort((a, b) => a.due.localeCompare(b.due));
          if (!list.length) return null;
          return (
            <div key={app.id} style={{ ...st.panel, borderTop: `3px solid ${app.color}`, marginBottom: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: app.color, marginBottom: 8 }}>{app.name}</div>
              {list.map((t) => {
                const proj = state.projects.find((p) => p.id === t.projectId);
                const od = t.due < today();
                const statusLabel = { todo: "To do", doing: "In progress" }[t.status] || t.status;
                return (
                  <div key={t.id} className="card-hover" style={{ ...st.msRow, cursor: "pointer" }}
                    onClick={() => go({ tab: "board", appId: app.id, projectId: t.projectId })}>
                    <span style={{ ...st.dot, background: app.color, marginRight: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, color: C.text }}>{t.name}</div>
                      <div style={{ fontSize: 12, color: C.textDim }}>{proj?.name} · {statusLabel}</div>
                    </div>
                    <span style={{ fontSize: 13, color: od ? C.danger : C.textDim }}>{fmtDate(t.due)}{od ? " ⚠" : ""}</span>
                  </div>
                );
              })}
            </div>
          );
        })}
        {!state.tasks.some((t) => t.due && t.status !== "done") && <div style={st.panel}><div style={st.empty}>No tasks with a due date.</div></div>}
      </div>
    </div>
  );
}

// ============ Applicativi ============
function AppsView({ state, update, go }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", desc: "" });
  const pal = ["#5B8DEF", "#34D399", "#F0A04B", "#A78BFA", "#F472B6", "#22D3EE"];
  const add = () => {
    if (!form.name.trim()) return;
    update((s) => { s.apps.push({ id: uid(), name: form.name.trim(), desc: form.desc.trim(), color: pal[s.apps.length % pal.length] }); return s; });
    setForm({ name: "", desc: "" }); setAdding(false);
  };
  const del = (id) => {
    if (!confirm("Delete the application and its projects?")) return;
    update((s) => {
      const pi = s.projects.filter((p) => p.appId === id).map((p) => p.id);
      s.projects = s.projects.filter((p) => p.appId !== id);
      s.tasks = s.tasks.filter((t) => !pi.includes(t.projectId));
      s.milestones = s.milestones.filter((m) => !pi.includes(m.projectId));
      s.apps = s.apps.filter((a) => a.id !== id); return s;
    });
  };
  const [newOwner, setNewOwner] = useState("");
  const addOwner = () => { const v = newOwner.trim(); if (!v) return; update((s) => { ensureOwners(s); if (!s.owners.includes(v)) s.owners.push(v); return s; }); setNewOwner(""); };
  const delOwner = (o) => { if (o === "Team") return; update((s) => { s.owners = s.owners.filter((x) => x !== o); s.tasks.forEach((t) => { if (t.owner === o) t.owner = "Team"; }); s.projects.forEach((p) => { if (p.owner === o) p.owner = "Team"; }); return s; }); };
  return (
    <div>
      <div style={st.head}><div style={st.h2}>Applications</div><button style={st.addBtn} onClick={() => setAdding(!adding)}>+ Application</button></div>
      {adding && (
        <div style={st.panel}>
          <input style={st.input} placeholder="Name (e.g. CJ CE)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input style={st.input} placeholder="Description" value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} />
          <button style={st.primaryBtn} onClick={add}>Save</button>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 12 }}>
        {state.apps.map((a) => {
          const projs = state.projects.filter((p) => p.appId === a.id);
          const appTasks = state.tasks.filter((t) => projs.some((p) => p.id === t.projectId));
          const taskN = appTasks.length;
          const nTodo = appTasks.filter((t) => t.status === "todo").length;
          const nDoing = appTasks.filter((t) => t.status === "doing").length;
          const nDone = appTasks.filter((t) => t.status === "done").length;
          const nOverdue = appTasks.filter((t) => t.due && t.due < today() && t.status !== "done").length;
          const pctDone = taskN ? Math.round((nDone / taskN) * 100) : 0;
          return (
            <div key={a.id} style={{ ...st.panel, borderTop: `3px solid ${a.color}`, marginBottom: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div><div style={{ fontSize: 16, fontWeight: 500, color: C.text }}>{a.name}</div>
                  <div style={{ fontSize: 12, color: C.textDim, marginTop: 2 }}>{a.desc}</div></div>
                <button style={st.iconBtn} onClick={() => del(a.id)}>✕</button>
              </div>
              <div style={{ fontSize: 12, color: C.textDim, margin: "12px 0 8px" }}>{projs.length} projects · {taskN} tasks</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {projs.map((p) => (
                  <button key={p.id} className="chipbtn" style={st.chip}
                    onClick={() => go({ tab: "board", appId: a.id, projectId: p.id })}>{p.name} ↗</button>
                ))}
              </div>
              <button style={{ ...st.linkBtn, marginTop: 12 }} onClick={() => go({ tab: "projects", appId: a.id })}>See projects →</button>

              {/* resoconto sintetico attività */}
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.textDim, marginBottom: 6 }}>
                  <span>Task completion</span><span style={{ color: C.text }}>{pctDone}%</span>
                </div>
                <div style={st.trackSm}><div style={{ ...st.fill, width: pctDone + "%", background: a.color }} /></div>
                <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                  <span style={{ ...st.statPill, background: C.panel2, color: C.todo }}><span style={{ ...st.dot, background: C.todo, marginRight: 5 }} />{nTodo} to do</span>
                  <span style={{ ...st.statPill, background: C.panel2, color: C.doing }}><span style={{ ...st.dot, background: C.doing, marginRight: 5 }} />{nDoing} in progress</span>
                  <span style={{ ...st.statPill, background: C.panel2, color: C.done }}><span style={{ ...st.dot, background: C.done, marginRight: 5 }} />{nDone} completed</span>
                  {nOverdue > 0 && <span style={{ ...st.statPill, background: "#3A1F22", color: C.danger }}>⚠ {nOverdue} overdue</span>}
                </div>
              </div>

              <button style={{ ...st.linkBtn, marginTop: 12 }} onClick={() => go({ tab: "board", appId: a.id })}>Open tasks →</button>
            </div>
          );
        })}
      </div>

      <div style={{ ...st.h2, marginTop: 22 }}>Owners</div>
      <div style={st.panel}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {state.owners.map((o) => (
            <span key={o} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 16, padding: "4px 6px 4px 10px", fontSize: 12.5, color: C.text }}>
              <span style={{ width: 18, height: 18, borderRadius: "50%", background: C.accentDim, color: C.accent, fontSize: 10, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{o[0]}</span>
              {o}
              {o !== "Team" && <button style={{ ...st.iconBtnSm, marginLeft: 2 }} onClick={() => delOwner(o)}>✕</button>}
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input style={{ ...st.input, marginBottom: 0, flex: 1 }} placeholder="Add owner…" value={newOwner}
            onChange={(e) => setNewOwner(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addOwner()} />
          <button style={st.primaryBtn} onClick={addOwner}>+</button>
        </div>
      </div>
    </div>
  );
}

// ============ Progetti (kanban per stato progetto) ============
function ProjectsView({ state, update, go, nav }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ appId: nav.appId || state.apps[0]?.id || "", name: "", start: "", end: "", budgetH: "" });
  const [drag, setDrag] = useState(null);

  const visible = state.projects.filter((p) => !nav.appId || p.appId === nav.appId);

  const add = () => {
    if (!form.name.trim()) return;
    update((s) => { s.projects.push({ id: uid(), appId: form.appId, name: form.name.trim(), status: "Pianificato", start: form.start || today(), end: form.end || today(), progress: 0, owner: "Team", budgetH: Number(form.budgetH) || 0, spentH: 0 }); return s; });
    setForm({ appId: nav.appId || state.apps[0]?.id || "", name: "", start: "", end: "", budgetH: "" }); setAdding(false);
  };
  const del = (id) => { if (!confirm("Delete the project?")) return; update((s) => { s.projects = s.projects.filter((p) => p.id !== id); s.tasks = s.tasks.filter((t) => t.projectId !== id); s.milestones = s.milestones.filter((m) => m.projectId !== id); return s; }); };
  const moveTo = (pid, status) => update((s) => { const p = s.projects.find((x) => x.id === pid); if (p) { p.status = status; if (status === "Completato") p.progress = 100; } return s; });

  return (
    <div>
      <div style={st.head}>
        <div style={st.h2}>Progetti {nav.appId && <span style={{ color: C.textDim, fontWeight: 400, fontSize: 14 }}>· {state.apps.find((a) => a.id === nav.appId)?.name}</span>}</div>
        <button style={st.addBtn} onClick={() => setAdding(!adding)}>+ Project</button>
      </div>

      <AppFilter state={state} nav={nav} go={go} />

      {adding && (
        <div style={st.panel}>
          <select style={st.input} value={form.appId} onChange={(e) => setForm({ ...form, appId: e.target.value })}>
            {state.apps.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <input style={st.input} placeholder="Project name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div style={{ display: "flex", gap: 8 }}>
            <input style={st.input} type="date" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
            <input style={st.input} type="date" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} />
          </div>
          <input style={st.input} type="number" min="0" placeholder="Budget hours (e.g. 150)" value={form.budgetH} onChange={(e) => setForm({ ...form, budgetH: e.target.value })} />
          <button style={st.primaryBtn} onClick={add}>Save</button>
        </div>
      )}

      <div style={st.kanban}>
        {PROJ_COLS.map((col) => {
          const items = visible.filter((p) => p.status === col.id);
          return (
            <div key={col.id} style={st.kcol}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (drag) { moveTo(drag, col.id); setDrag(null); } }}>
              <div style={st.kcolHead}>
                <span><span style={{ ...st.dot, background: col.color }} />{col.label}</span>
                <span style={st.kcount}>{items.length}</span>
              </div>
              {items.map((p) => {
                const app = state.apps.find((a) => a.id === p.appId);
                const tn = state.tasks.filter((t) => t.projectId === p.id);
                const doneN = tn.filter((t) => t.status === "done").length;
                return (
                  <div key={p.id} draggable className="kcard"
                    onDragStart={() => setDrag(p.id)} onDragEnd={() => setDrag(null)}
                    style={st.kcard}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                      <span style={{ fontSize: 11, color: app?.color, fontWeight: 500 }}>{app?.name}</span>
                      <button style={st.iconBtnSm} onClick={() => del(p.id)}>✕</button>
                    </div>
                    <div style={{ fontSize: 14, color: C.text, margin: "4px 0 8px", fontWeight: 500 }}>{p.name}</div>
                    <div style={st.trackSm}><div style={{ ...st.fill, width: p.progress + "%", background: col.color }} /></div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: C.textDim }}>
                      <span>{fmtDate(p.start)}→{fmtDate(p.end)}</span>
                      <span>{doneN}/{tn.length} att.</span>
                    </div>
                    {p.owner && <div style={{ marginTop: 6, fontSize: 11, color: C.textDim }}><span style={{ display: "inline-flex", width: 16, height: 16, borderRadius: "50%", background: C.accentDim, color: C.accent, fontSize: 9, alignItems: "center", justifyContent: "center", marginRight: 5, verticalAlign: "middle" }}>{p.owner[0]}</span>{p.owner}</div>}
                    <button style={{ ...st.linkBtn, marginTop: 8 }} onClick={() => go({ tab: "board", appId: p.appId, projectId: p.id })}>Open tasks →</button>
                  </div>
                );
              })}
              {!items.length && <div style={st.kempty}>—</div>}
            </div>
          );
        })}
      </div>
      <div style={st.hint}>Drag cards between columns to change status.</div>
    </div>
  );
}

// ============ Board (Kanban attività) ============
function BoardView({ state, update, go, nav }) {
  const [drag, setDrag] = useState(null);
  const [addCol, setAddCol] = useState(null);
  const [text, setText] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("all");

  // scope: if projectId set -> that project; elif appId -> all its projects; else all
  const scopeProjects = state.projects.filter((p) =>
    nav.projectId ? p.id === nav.projectId : nav.appId ? p.appId === nav.appId : true);
  const scopeIds = scopeProjects.map((p) => p.id);
  const tasks = state.tasks.filter((t) => scopeIds.includes(t.projectId) && (ownerFilter === "all" || (t.owner || "Team") === ownerFilter));

  const move = (tid, status) => update((s) => { const t = s.tasks.find((x) => x.id === tid); if (t) t.status = status; recalc(s, t?.projectId); return s; });
  const del = (tid) => update((s) => { const t = s.tasks.find((x) => x.id === tid); const pid = t?.projectId; s.tasks = s.tasks.filter((x) => x.id !== tid); recalc(s, pid); return s; });
  const setOwner = (tid, owner) => update((s) => { const t = s.tasks.find((x) => x.id === tid); if (t) t.owner = owner; return s; });
  const add = (col) => {
    if (!text.trim()) return;
    const pid = nav.projectId || scopeIds[0];
    const def = ownerFilter !== "all" ? ownerFilter : "Team";
    update((s) => { s.tasks.push({ id: uid(), projectId: pid, name: text.trim(), status: col, owner: def, due: "" }); recalc(s, pid); return s; });
    setText(""); setAddCol(null);
  };
  function recalc(s, pid) {
    if (!pid) return;
    const ts = s.tasks.filter((t) => t.projectId === pid);
    const p = s.projects.find((x) => x.id === pid);
    if (p && ts.length) { p.progress = Math.round(ts.filter((t) => t.status === "done").length / ts.length * 100); if (p.progress === 100) p.status = "Completato"; else if (p.progress > 0 && p.status === "Pianificato") p.status = "In corso"; }
  }

  return (
    <div>
      <div style={st.head}>
        <div style={st.h2}>Tasks</div>
        <div style={{ display: "flex", gap: 8 }}>
          <select style={{ ...st.input, marginBottom: 0, width: "auto" }} value={nav.appId || "all"}
            onChange={(e) => go({ appId: e.target.value === "all" ? null : e.target.value, projectId: null })}>
            <option value="all">All applications</option>
            {state.apps.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <select style={{ ...st.input, marginBottom: 0, width: "auto" }} value={nav.projectId || "all"}
            onChange={(e) => go({ projectId: e.target.value === "all" ? null : e.target.value })}>
            <option value="all">All projects</option>
            {scopeProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select style={{ ...st.input, marginBottom: 0, width: "auto" }} value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}>
            <option value="all">All owners</option>
            {state.owners.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>

      {!scopeIds.length && <div style={st.empty}>No projects in this scope.</div>}

      <div style={st.kanban}>
        {KCOLS.map((col) => {
          const items = tasks.filter((t) => t.status === col.id);
          return (
            <div key={col.id} style={st.kcol}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (drag) { move(drag, col.id); setDrag(null); } }}>
              <div style={st.kcolHead}>
                <span><span style={{ ...st.dot, background: col.color }} />{col.label}</span>
                <span style={st.kcount}>{items.length}</span>
              </div>
              {items.map((t) => {
                const proj = state.projects.find((p) => p.id === t.projectId);
                const app = state.apps.find((a) => a.id === proj?.appId);
                const od = t.due && t.due < today() && t.status !== "done";
                return (
                  <div key={t.id} draggable className="kcard"
                    onDragStart={() => setDrag(t.id)} onDragEnd={() => setDrag(null)} style={st.kcard}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                      <button className="chipbtn" style={{ ...st.miniChip, color: app?.color, borderColor: (app?.color || "#444") + "55" }}
                        onClick={() => go({ appId: proj?.appId, projectId: proj?.id })}>{proj?.name}</button>
                      <button style={st.iconBtnSm} onClick={() => del(t.id)}>✕</button>
                    </div>
                    <div style={{ fontSize: 14, color: C.text, margin: "6px 0" }}>{t.name}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                      {t.due ? <span style={{ fontSize: 11, color: od ? C.danger : C.textDim }}>⏱ {fmtDate(t.due)}{od ? " · overdue" : ""}</span> : <span />}
                      <select value={t.owner || "Team"} onChange={(e) => setOwner(t.id, e.target.value)} title="Owner"
                        style={{ background: C.panel, color: C.textDim, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 10.5, padding: "2px 5px", cursor: "pointer" }}>
                        {state.owners.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                );
              })}
              {addCol === col.id ? (
                <div style={{ marginTop: 6 }}>
                  <input autoFocus style={{ ...st.input, marginBottom: 6 }} placeholder="Task title…" value={text}
                    onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add(col.id)} />
                  <div style={{ display: "flex", gap: 6 }}>
                    <button style={st.primaryBtnSm} onClick={() => add(col.id)} disabled={!scopeIds.length}>Add</button>
                    <button style={st.ghostBtn} onClick={() => { setAddCol(null); setText(""); }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button style={st.addCard} onClick={() => { setAddCol(col.id); setText(""); }} disabled={!scopeIds.length}>+ Add</button>
              )}
            </div>
          );
        })}
      </div>
      <div style={st.hint}>Drag tasks between columns. Project progress updates automatically.</div>
    </div>
  );
}

// ============ Gantt ============
function GanttView({ state, update, go, nav }) {
  const projects = state.projects.filter((p) => !nav.appId || p.appId === nav.appId);
  const { minD, maxD, months } = useMemo(() => {
    const ds = projects.flatMap((p) => [new Date(p.start), new Date(p.end)]);
    const msd = state.milestones.filter((m) => projects.some((p) => p.id === m.projectId)).map((m) => new Date(m.date));
    const all = [...ds, ...msd].filter((d) => !isNaN(d));
    if (!all.length) { const n = new Date(); return { minD: n, maxD: new Date(n.getTime() + 90 * 864e5), months: [] }; }
    let mn = new Date(Math.min(...all)), mx = new Date(Math.max(...all));
    mn = new Date(mn.getFullYear(), mn.getMonth(), 1); mx = new Date(mx.getFullYear(), mx.getMonth() + 1, 0);
    const mo = []; const c = new Date(mn); while (c <= mx) { mo.push(new Date(c)); c.setMonth(c.getMonth() + 1); }
    return { minD: mn, maxD: mx, months: mo };
  }, [projects, state.milestones]);
  const span = maxD - minD || 1;
  const pct = (d) => ((new Date(d) - minD) / span) * 100;
  const tp = pct(today());

  return (
    <div>
      <div style={st.head}><div style={st.h2}>Gantt</div></div>
      <AppFilter state={state} nav={nav} go={go} />
      <div style={{ ...st.panel, overflowX: "auto" }}>
        <div style={{ display: "flex", marginLeft: 150, borderBottom: `1px solid ${C.border}`, paddingBottom: 6, marginBottom: 10, minWidth: 460, position: "relative" }}>
          {months.map((m, i) => (
            <div key={i} style={{ flex: 1, fontSize: 11, color: C.textDim, textAlign: "center", borderLeft: i ? `1px solid ${C.border}` : "none" }}>
              {m.toLocaleDateString("en-US", { month: "short", year: "2-digit" })}
            </div>
          ))}
          {tp >= 0 && tp <= 100 && (
            <div style={{ position: "absolute", left: tp + "%", top: -2, transform: "translateX(-50%)", background: C.danger, color: "#0F1420", fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 5, whiteSpace: "nowrap", zIndex: 4 }}>
              Oggi · {fmtDate(today())}
            </div>
          )}
        </div>
        <div style={{ position: "relative", minWidth: 610 }}>
          {tp >= 0 && tp <= 100 && (
            <>
              <div style={{ position: "absolute", left: `calc(150px + (100% - 150px) * ${tp} / 100)`, top: 0, bottom: 0, width: 0, borderLeft: `2px dashed ${C.danger}`, zIndex: 2 }} />
              <div style={{ position: "absolute", left: `calc(150px + (100% - 150px) * ${tp} / 100)`, top: -3, transform: "translateX(-50%)", width: 8, height: 8, borderRadius: "50%", background: C.danger, zIndex: 3 }} />
            </>
          )}
          {projects.map((p) => {
            const app = state.apps.find((a) => a.id === p.appId);
            const l = pct(p.start), w = pct(p.end) - l;
            const ms = state.milestones.filter((m) => m.projectId === p.id);
            return (
              <div key={p.id} style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
                <button style={{ width: 150, fontSize: 12, color: C.text, textAlign: "left", background: "none", border: "none", cursor: "pointer", flexShrink: 0, padding: 0 }}
                  onClick={() => go({ tab: "board", appId: p.appId, projectId: p.id })}>
                  <span style={{ ...st.dot, background: app?.color }} />{p.name}
                </button>
                <div style={{ flex: 1, position: "relative", height: 24 }}>
                  <div style={{ position: "absolute", left: 0, right: 0, top: 10, height: 4, background: C.panel2, borderRadius: 2 }} />
                  <div style={{ position: "absolute", left: l + "%", width: Math.max(w, 1) + "%", height: 20, top: 2, background: (app?.color || "#888") + "33", borderRadius: 5 }} />
                  <div style={{ position: "absolute", left: l + "%", width: Math.max(w * p.progress / 100, .5) + "%", height: 20, top: 2, background: app?.color, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 10, color: "#0F1420", fontWeight: 600 }}>{p.progress > 10 ? p.progress + "%" : ""}</span>
                  </div>
                  {ms.map((m) => (
                    <div key={m.id} title={m.name + " · " + fmtDate(m.date)} style={{ position: "absolute", left: pct(m.date) + "%", top: 1, transform: "translateX(-50%)", color: m.done ? C.done : C.plan, fontSize: 13, zIndex: 3 }}>◆</div>
                  ))}
                </div>
              </div>
            );
          })}
          {!projects.length && <div style={st.empty}>No projects.</div>}
        </div>
        <div style={{ marginTop: 12, display: "flex", gap: 16, fontSize: 11, color: C.textDim, flexWrap: "wrap" }}>
          <span><span style={{ display: "inline-block", width: 12, height: 8, background: C.accent, borderRadius: 2, marginRight: 4 }} />Progress</span>
          <span style={{ color: C.plan }}>◆ Milestone</span>
          <span><span style={{ display: "inline-block", width: 2, height: 10, borderLeft: `2px dashed ${C.danger}`, marginRight: 4, verticalAlign: "middle" }} />Today (position on the timeline)</span>
        </div>
      </div>

      <div style={{ ...st.h2, marginTop: 22 }}>Milestones</div>
      <MilestonesPanel state={state} update={update} go={go} />
    </div>
  );
}

// ============ Milestone panel (usato dentro la pagina Gantt) ============
function MilestonesPanel({ state, update, go }) {
  const [adding, setAdding] = useState(false);
  const [msApp, setMsApp] = useState("all");
  const [form, setForm] = useState({ projectId: state.projects[0]?.id || "", name: "", date: "" });
  const add = () => { if (!form.name.trim() || !form.projectId) return; update((s) => { s.milestones.push({ id: uid(), projectId: form.projectId, name: form.name.trim(), date: form.date || today(), done: false }); return s; }); setForm({ projectId: state.projects[0]?.id || "", name: "", date: "" }); setAdding(false); };
  const toggle = (id) => update((s) => { const m = s.milestones.find((x) => x.id === id); if (m) m.done = !m.done; return s; });
  const del = (id) => update((s) => { s.milestones = s.milestones.filter((m) => m.id !== id); return s; });
  const visible = state.milestones.filter((m) => msApp === "all" || state.projects.find((p) => p.id === m.projectId)?.appId === msApp);
  const sorted = [...visible].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button style={{ ...st.filterChip, ...(msApp === "all" ? st.filterActive : {}) }} onClick={() => setMsApp("all")}>All</button>
          {state.apps.map((a) => (
            <button key={a.id} style={{ ...st.filterChip, ...(msApp === a.id ? st.filterActive : {}) }} onClick={() => setMsApp(a.id)}>
              <span style={{ ...st.dot, background: a.color }} />{a.name}
            </button>
          ))}
        </div>
        <button style={st.addBtn} onClick={() => setAdding(!adding)}>+ Milestone</button>
      </div>
      {adding && (
        <div style={st.panel}>
          <select style={st.input} value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
            {state.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input style={st.input} placeholder="Milestone name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input style={st.input} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <button style={st.primaryBtn} onClick={add}>Save</button>
        </div>
      )}
      <div style={st.panel}>
        <div style={{ position: "relative", paddingLeft: 22 }}>
          <div style={{ position: "absolute", left: 6, top: 8, bottom: 8, width: 2, background: C.border }} />
          {sorted.map((m) => {
            const proj = state.projects.find((p) => p.id === m.projectId);
            const app = state.apps.find((a) => a.id === proj?.appId);
            const od = !m.done && m.date < today();
            return (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, position: "relative" }}>
                <div style={{ position: "absolute", left: -19, width: 12, height: 12, borderRadius: "50%", background: m.done ? C.done : (app?.color || C.plan), border: `2px solid ${C.panel}` }} />
                <input type="checkbox" checked={m.done} onChange={() => toggle(m.id)} style={{ width: 16, height: 16, accentColor: C.done }} />
                <div style={{ flex: 1, cursor: "pointer", minWidth: 0 }} onClick={() => go({ tab: "board", appId: proj?.appId, projectId: m.projectId })}>
                  <div style={{ fontSize: 14, color: m.done ? C.textFaint : C.text, textDecoration: m.done ? "line-through" : "none" }}>{m.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 500, color: app?.color, background: (app?.color || "#888") + "1F", border: `1px solid ${(app?.color || "#888")}44`, borderRadius: 6, padding: "2px 8px" }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: app?.color }} />{app?.name}
                    </span>
                    <span style={{ fontSize: 12, color: C.textDim }}>{proj?.name}</span>
                  </div>
                </div>
                <span style={{ fontSize: 13, color: od ? C.danger : C.textDim, flexShrink: 0 }}>{fmtDate(m.date)}{od ? " ⚠" : ""}</span>
                <button style={st.iconBtn} onClick={() => del(m.id)}>✕</button>
              </div>
            );
          })}
          {!sorted.length && <div style={st.empty}>No milestones.</div>}
        </div>
      </div>
    </div>
  );
}

// ============ Todo (kanban personale) ============
function TodosView({ state, update }) {
  const [text, setText] = useState("");
  const [drag, setDrag] = useState(null);
  const [over, setOver] = useState(null);

  const add = () => {
    if (!text.trim()) return;
    update((s) => { s.todos.push({ id: uid(), text: text.trim(), status: "todo", priority: "Media", due: "", projectId: "", createdAt: today(), completedAt: "" }); return s; });
    setText("");
  };
  const setDone = (id, done) => update((s) => { const t = s.todos.find((x) => x.id === id); if (t) { t.status = done ? "done" : "todo"; t.completedAt = done ? today() : ""; } return s; });
  const del = (id) => update((s) => { s.todos = s.todos.filter((t) => t.id !== id); return s; });
  const clearDone = () => update((s) => { s.todos = s.todos.filter((t) => t.status !== "done"); return s; });

  const todo = state.todos.filter((t) => t.status !== "done");
  const done = state.todos.filter((t) => t.status === "done");

  const Item = ({ t, isDone }) => (
    <li draggable
      onDragStart={() => setDrag(t.id)}
      onDragEnd={() => { setDrag(null); setOver(null); }}
      className="todo-li"
      style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 6px", borderBottom: `1px solid ${C.border}`, cursor: "grab", opacity: drag === t.id ? 0.4 : 1 }}>
      <span style={{ color: C.textFaint, fontSize: 13, cursor: "grab", flexShrink: 0 }} title="Drag">⠿</span>
      <span style={{ flex: 1, minWidth: 0, fontSize: 14, color: isDone ? C.textFaint : C.text, textDecoration: isDone ? "line-through" : "none" }}>{t.text}</span>
      <span style={{ fontSize: 11.5, color: C.textDim, width: 88, textAlign: "right", flexShrink: 0 }} title="Data inserimento">{t.createdAt ? fmtDate(t.createdAt) : "—"}</span>
      <span style={{ fontSize: 11.5, color: isDone ? C.done : C.textFaint, width: 88, textAlign: "right", flexShrink: 0 }} title="Data completamento">{t.completedAt ? fmtDate(t.completedAt) : "—"}</span>
      <button style={st.iconBtn} onClick={() => del(t.id)}>✕</button>
    </li>
  );

  const ColHead = () => (
    <li style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 6px 6px", borderBottom: `1px solid ${C.border}`, listStyle: "none" }}>
      <span style={{ width: 13, flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: 10.5, color: C.textFaint, textTransform: "uppercase", letterSpacing: 0.5 }}>Tasks</span>
      <span style={{ width: 88, textAlign: "right", fontSize: 10.5, color: C.textFaint, textTransform: "uppercase", letterSpacing: 0.5, flexShrink: 0 }}>Created</span>
      <span style={{ width: 88, textAlign: "right", fontSize: 10.5, color: C.textFaint, textTransform: "uppercase", letterSpacing: 0.5, flexShrink: 0 }}>Completed</span>
      <span style={{ width: 22, flexShrink: 0 }} />
    </li>
  );

  const dropProps = (target) => ({
    onDragOver: (e) => { e.preventDefault(); setOver(target); },
    onDragLeave: () => setOver((o) => (o === target ? null : o)),
    onDrop: () => { if (drag) setDone(drag, target === "done"); setDrag(null); setOver(null); },
  });

  return (
    <div>
      <div style={st.head}>
        <div style={st.h2}>My tasks</div>
        <span style={{ fontSize: 13, color: C.textDim }}>{todo.length} to do</span>
      </div>
      <div style={st.hint}>Quick notes not yet linked to a project. Move an item by dragging it between “To do” and “Completed tasks”.</div>

      {/* input */}
      <div style={{ ...st.panel, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input style={{ ...st.input, marginBottom: 0, flex: 1 }} placeholder="Add a task…" value={text}
            onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
          <button style={st.primaryBtn} onClick={add}>Add</button>
        </div>
      </div>

      {/* Da fare */}
      <div style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: "0 2px 8px" }}>To do <span style={st.kcount}>{todo.length}</span></div>
      <div {...dropProps("todo")} style={{ ...st.panel, outline: over === "todo" ? `2px dashed ${C.accent}` : "none", minHeight: 56 }}>
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {todo.length > 0 && <ColHead />}
          {todo.map((t) => <Item key={t.id} t={t} isDone={false} />)}
        </ul>
        {!todo.length && <div style={st.empty}>Niente to do. Scrivi qui sopra per aggiungere.</div>}
      </div>

      {/* Completate */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "18px 2px 8px" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.done }}>Completed tasks <span style={st.kcount}>{done.length}</span></span>
        {done.length > 0 && <button style={{ ...st.linkBtn, color: C.textDim }} onClick={clearDone}>Clear</button>}
      </div>
      <div {...dropProps("done")} style={{ ...st.panel, outline: over === "done" ? `2px dashed ${C.done}` : "none", minHeight: 56 }}>
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {done.length > 0 && <ColHead />}
          {done.map((t) => <Item key={t.id} t={t} isDone={true} />)}
        </ul>
        {!done.length && <div style={st.empty}>Drag completed tasks here.</div>}
      </div>
    </div>
  );
}

// ============ Import (popola Gantt da tabella incollata) ============
// ============ Import / Export / Delta helpers (module level) ============
const IMPORT_PALETTE = ["#5B8DEF", "#34D399", "#F0A04B", "#A78BFA", "#F472B6", "#22D3EE"];
function normDateStr(s) {
  s = (s || "").trim();
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (m) { let [, d, mo, y] = m; if (y.length === 2) y = "20" + y; return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`; }
  return s;
}
function parseProjectRows(raw) {
  const lines = raw.trim().split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return [];
  const splitRow = (l) => l.includes("\t") ? l.split("\t") : l.split(/ *; *| *, *(?=\S)/);
  let start = 0;
  const first = splitRow(lines[0]).map((c) => c.toLowerCase());
  if (first.some((c) => c.includes("applicativo") || c.includes("progetto"))) start = 1;
  const rows = [];
  for (let i = start; i < lines.length; i++) {
    const c = splitRow(lines[i]).map((x) => x.trim());
    if (c.length < 2 || !c[0] || !c[1]) continue;
    rows.push({
      app: c[0], project: c[1], start: normDateStr(c[2]), end: normDateStr(c[3]),
      progress: Math.max(0, Math.min(100, parseInt(c[4]) || 0)),
      owner: c[5] || "Team", ms: c[6] || "", msDate: normDateStr(c[7]),
    });
  }
  return rows;
}
// upsert rows into state mutable (s). Returns count.
function upsertRows(s, rows) {
  ensureOwners(s);
  rows.forEach((r) => {
    let app = s.apps.find((a) => a.name.toLowerCase() === r.app.toLowerCase());
    if (!app) { app = { id: uid(), name: r.app, desc: "", color: IMPORT_PALETTE[s.apps.length % IMPORT_PALETTE.length] }; s.apps.push(app); }
    let proj = s.projects.find((p) => p.appId === app.id && p.name.toLowerCase() === r.project.toLowerCase());
    if (proj) { proj.start = r.start || proj.start; proj.end = r.end || proj.end; proj.progress = r.progress; proj.owner = r.owner; proj.disabled = false; }
    else {
      proj = { id: uid(), appId: app.id, name: r.project, status: r.progress >= 100 ? "Completato" : r.progress > 0 ? "In corso" : "Pianificato", start: r.start || today(), end: r.end || today(), progress: r.progress, owner: r.owner, budgetH: 0, spentH: 0, disabled: false };
      s.projects.push(proj);
    }
    if (r.owner && !s.owners.includes(r.owner)) s.owners.push(r.owner);
    if (r.ms) {
      const exists = s.milestones.find((m) => m.projectId === proj.id && m.name.toLowerCase() === r.ms.toLowerCase());
      if (exists) exists.date = r.msDate || exists.date;
      else s.milestones.push({ id: uid(), projectId: proj.id, name: r.ms, date: r.msDate || r.end || today(), done: false });
    }
  });
  return rows.length;
}
// parse "abilitati" list: one name per line (applicativo or progetto), comma/semicolon ok
function parseEnabledList(raw) {
  return raw.trim().split(/\r?\n|;|,/).map((x) => x.trim().toLowerCase()).filter(Boolean);
}
// apply enabled list: projects whose name or app-name not in list -> disabled=true
function applyEnabled(s, names) {
  if (!names.length) return;
  const set = new Set(names);
  s.projects.forEach((p) => {
    const app = s.apps.find((a) => a.id === p.appId);
    const on = set.has(p.name.toLowerCase()) || (app && set.has(app.name.toLowerCase()));
    p.disabled = !on;
  });
}
function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
function readFileText(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = () => rej(new Error("Lettura fallita"));
    r.readAsText(file);
  });
}
// build a standalone HTML that embeds the data + a loader note
function buildStandaloneHTML(state) {
  const json = JSON.stringify(state);
  const reportInner = buildReportHTML(state)
    .replace(/^[\s\S]*?<body>/, "").replace(/<\/body>[\s\S]*$/, "");
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Governance Board · dati incorporati</title>
<style>body{font-family:Arial,Helvetica,sans-serif;color:#1A2130;background:#fff;margin:0 auto;max-width:1000px;padding:24px 28px}.bar{background:#EEF2FB;border:1px solid #d6e0f5;border-radius:8px;padding:12px 14px;margin-bottom:18px;font-size:13px;color:#33415c}.bar b{color:#1A2130}.btn{background:#5B8DEF;color:#fff;border:none;border-radius:6px;padding:7px 13px;font-size:12.5px;font-weight:600;cursor:pointer;margin-right:8px}td{padding:5px 8px;border:1px solid #e2e2e2}@media print{.bar{display:none}}</style></head>
<body>
<div class="bar">Questo file contiene i dati della Governance Board incorporati (snapshot del ${new Date().toLocaleDateString("en-US")}). <b>Si apre e funziona senza caricare nulla.</b>
<div style="margin-top:8px"><button class="btn" onclick="dl()">\u2193 Scarica JSON dati</button><button class="btn" onclick="window.print()">\u21a7 Stampa / PDF</button></div></div>
${reportInner}
<script type="application/json" id="gov-data">${json.replace(/</g, "\\u003c")}</script>
<script>function dl(){var d=document.getElementById('gov-data').textContent;var b=new Blob([d],{type:'application/json'});var u=URL.createObjectURL(b);var a=document.createElement('a');a.href=u;a.download='governance-data.json';a.click();setTimeout(function(){URL.revokeObjectURL(u)},2000);}</script>
</body></html>`;
}

function ImportView({ state, update, go }) {
  const [jsonName, setJsonName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  // delta state
  const [dBaseName, setDBaseName] = useState("");
  const [dBase, setDBase] = useState(null);
  const [dCsvName, setDCsvName] = useState("");
  const [dCsv, setDCsv] = useState("");
  const [dEnName, setDEnName] = useState("");
  const [dEn, setDEn] = useState("");
  const [deltaMsg, setDeltaMsg] = useState("");

  // ---- JSON import ----
  const loadJsonFile = async (file) => {
    try {
      const txt = await readFileText(file);
      const data = JSON.parse(txt);
      if (!data.projects || !data.apps) throw new Error("JSON non valido: mancano apps/projects.");
      update(() => ensureOwners(data));
      setJsonName(file.name);
      go({ tab: "dashboard" });
    } catch (e) { alert("Import JSON fallito: " + e.message); }
  };

  // ---- Export ----
  const exportJSON = () => downloadFile(`governance-data-${today()}.json`, JSON.stringify(state, null, 2), "application/json");
  const exportStandalone = () => downloadFile(`governance-standalone-${today()}.html`, buildStandaloneHTML(state), "text/html;charset=utf-8");

  // ---- Delta ----
  const loadDeltaBase = async (file) => {
    try { const d = JSON.parse(await readFileText(file)); if (!d.projects) throw new Error("manca projects"); setDBase(d); setDBaseName(file.name); }
    catch (e) { alert("JSON base non valido: " + e.message); }
  };
  const applyDelta = () => {
    if (!dBase || !dCsv.trim()) return;
    const rows = parseProjectRows(dCsv);
    if (!rows.length) { setDeltaMsg("Il CSV nuova settimana non contiene righe valide."); return; }
    const merged = structuredClone(dBase);
    ensureOwners(merged);
    const n = upsertRows(merged, rows);
    let enInfo = "";
    if (dEn.trim()) { const names = parseEnabledList(dEn); applyEnabled(merged, names); enInfo = `, ${merged.projects.filter((p) => p.disabled).length} disabilitati`; }
    update(() => merged);
    setDeltaMsg(`Delta applicato: ${n} righe upsert${enInfo}. Ricordati di esportare il nuovo JSON.`);
    go({ tab: "gantt" });
  };

  const dropZone = (label, sub, onFile, fname, accept) => (
    <label style={{ ...st.dropZone, ...(dragOver === label ? st.dropOver : {}) }}
      onDragOver={(e) => { e.preventDefault(); setDragOver(label); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}>
      <input type="file" accept={accept} style={{ display: "none" }} onChange={(e) => { const f = e.target.files[0]; if (f) onFile(f); }} />
      <div style={{ fontSize: 20, color: C.textDim }}>↥</div>
      <div style={{ fontSize: 13, color: C.text, fontWeight: 500, marginTop: 6, textAlign: "center" }}>{label}</div>
      <div style={{ fontSize: 11.5, color: C.textDim, marginTop: 2, textAlign: "center" }}>{fname || sub}</div>
    </label>
  );

  return (
    <div>
      <div style={st.head}><div style={st.h2}>Import delta</div></div>

      {/* ===== Esporta & condividi ===== */}
      <div style={{ marginTop: 8 }}>
        <div style={st.h3}>Esporta & condividi</div>
        <div style={st.hint}>Salva i dati elaborati per condividerli con i colleghi.</div>
        <div style={st.panel}>
          <button style={{ ...st.wideBtn, marginBottom: 8 }} onClick={exportJSON}>↓ Esporta dati come JSON <span style={{ color: C.textDim, fontWeight: 400 }}>piccolo · condivisibile</span></button>
          <button style={st.wideBtn} onClick={exportStandalone}>▤ Salva HTML standalone <span style={{ color: C.textDim, fontWeight: 400 }}>un file · apri e vai</span></button>
          <div style={{ fontSize: 12, color: C.textDim, marginTop: 12, lineHeight: 1.6 }}>
            <div><b style={{ color: C.text }}>JSON</b>: passa il file ai colleghi, lo ricaricano col pulsante Carica.</div>
            <div><b style={{ color: C.text }}>HTML standalone</b>: un singolo file con i dati incorporati, si apre e funziona senza caricare nulla.</div>
          </div>
        </div>
      </div>

      {/* ===== Delta ===== */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={st.h3}>Aggiornamento incrementale (delta)</div>
        <span style={st.adminBadge}>ADMIN</span>
      </div>
      <div style={st.hint}>Ogni settimana: carica il JSON dell'ultima versione + il CSV della nuova settimana soltanto — senza reincollare tutta la storia.</div>
      <div style={st.panel}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          <div>
            <div style={st.deltaLabel}>① JSON settimana precedente</div>
            {dropZone("JSON esportato dalla dashboard", "trascina o clicca", loadDeltaBase, dBaseName, ".json,application/json")}
          </div>
          <div>
            <div style={st.deltaLabel}>② CSV nuova settimana (solo delta)</div>
            <label style={st.dropZone}>
              <input type="file" accept=".csv,.tsv,.txt,text/plain" style={{ display: "none" }} onChange={async (e) => { const f = e.target.files[0]; if (f) { setDCsv(await readFileText(f)); setDCsvName(f.name); } }} />
              <div style={{ fontSize: 20, color: C.textDim }}>↥</div>
              <div style={{ fontSize: 12.5, color: C.text, marginTop: 6, textAlign: "center" }}>CSV attività · solo la settimana nuova</div>
              <div style={{ fontSize: 11.5, color: C.textDim, marginTop: 2 }}>{dCsvName || "trascina o clicca"}</div>
            </label>
            <div style={{ marginTop: 6 }}>
              <textarea value={dCsv} onChange={(e) => setDCsv(e.target.value)} placeholder="…oppure incolla qui il CSV/tabella"
                style={{ width: "100%", minHeight: 56, background: C.panel2, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, padding: 8, fontSize: 12, fontFamily: "ui-monospace, monospace", resize: "vertical" }} />
            </div>
          </div>
          <div>
            <div style={st.deltaLabel}>③ CSV abilitati <span style={{ color: C.textFaint }}>(opzionale)</span></div>
            <label style={st.dropZone}>
              <input type="file" accept=".csv,.txt,text/plain" style={{ display: "none" }} onChange={async (e) => { const f = e.target.files[0]; if (f) { setDEn(await readFileText(f)); setDEnName(f.name); } }} />
              <div style={{ fontSize: 20, color: C.textDim }}>↥</div>
              <div style={{ fontSize: 12.5, color: C.text, marginTop: 6, textAlign: "center" }}>Solo se la lista abilitati è cambiata</div>
              <div style={{ fontSize: 11.5, color: C.textDim, marginTop: 2 }}>{dEnName || "un nome per riga"}</div>
            </label>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, flexWrap: "wrap", gap: 10, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
          <div style={{ fontSize: 12, color: deltaMsg ? C.done : C.textFaint, fontFamily: deltaMsg ? "inherit" : "ui-monospace, monospace" }}>{deltaMsg || "Carica ① e ② per applicare il delta"}</div>
          <button style={{ ...st.primaryBtn, opacity: dBase && dCsv.trim() ? 1 : .5, cursor: dBase && dCsv.trim() ? "pointer" : "not-allowed" }} disabled={!dBase || !dCsv.trim()} onClick={applyDelta}>⚡ Applica delta</button>
        </div>
        <div style={st.hint}>Regola di merge: il JSON ① è la base; il CSV ② fa upsert (aggiorna i progetti con stesso nome, aggiunge i nuovi); ③ marca come disabilitato ciò che non è in lista. Esporta poi il nuovo JSON per la settimana successiva.</div>
      </div>
    </div>
  );
}
const tdS = { padding: "6px 8px", borderBottom: "1px solid #2C3548", color: "#E6EAF2" };

// ============ Shared app filter ============
function CapacityView({ state, update, go, nav }) {
  const DAILY = 7.5;
  const t0 = today();
  const projects = state.projects.filter((p) => (!nav.appId || p.appId === nav.appId) && p.status !== "Completato");
  const allForApp = state.projects.filter((p) => !nav.appId || p.appId === nav.appId);

  // edit budget/spent inline
  const setH = (pid, key, val) => update((s) => { const p = s.projects.find((x) => x.id === pid); if (p) p[key] = Math.max(0, Number(val) || 0); return s; });

  // per-project computation
  const rows = projects.map((p) => {
    const app = state.apps.find((a) => a.id === p.appId);
    const budget = p.budgetH || 0;
    const spent = p.spentH || 0;
    const remaining = Math.max(budget - spent, 0);
    const over = spent > budget;
    // working days from today (inclusive) to end date
    const startRef = p.end >= t0 ? t0 : p.end; // if past end, 0
    const wd = p.end >= t0 ? workingDays(t0, p.end) : 0;
    const hPerDay = wd > 0 ? remaining / wd : null; // null = overdue o nessun giorno
    return { p, app, budget, spent, remaining, over, wd, hPerDay };
  });

  // aggregate: total remaining hours/day needed across active projects
  const totalPerDay = rows.reduce((a, r) => a + (r.hPerDay || 0), 0);
  const overloaded = totalPerDay > DAILY;
  const loadPct = Math.min((totalPerDay / DAILY) * 100, 100);

  const fmtH = (n) => n == null ? "—" : (Math.round(n * 10) / 10).toLocaleString("en-US") + "h";

  return (
    <div>
      <div style={st.head}><div style={st.h2}>Capacity planning</div></div>
      <AppFilter state={state} nav={nav} go={go} />
      <div style={st.hint}>Budget and actuals in hours. Days counted as working days only (Mon-Fri), from today to project end date. Reference day: {DAILY.toLocaleString("en-US")}h.</div>

      {/* aggregate card */}
      <div style={{ ...st.panel, borderLeft: `3px solid ${overloaded ? C.danger : C.done}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ fontSize: 13, color: C.textDim }}>Total daily workload {nav.appId ? "(filtered application)" : "(all active projects)"}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: overloaded ? C.danger : C.text, marginTop: 2 }}>{fmtH(totalPerDay)}<span style={{ fontSize: 14, color: C.textDim, fontWeight: 400 }}> / {DAILY.toLocaleString("en-US")}h per day</span></div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, color: overloaded ? C.danger : C.done, fontWeight: 600 }}>{overloaded ? "⚠ Overload" : "✓ Sustainable"}</div>
            <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>{overloaded ? `Excess ${fmtH(totalPerDay - DAILY)}/day` : `Margin ${fmtH(DAILY - totalPerDay)}/day`}</div>
          </div>
        </div>
        {/* stacked load bar */}
        <div style={{ marginTop: 12, height: 16, background: C.panel2, borderRadius: 8, overflow: "hidden", display: "flex", position: "relative" }}>
          {rows.map((r) => {
            const w = DAILY > 0 ? Math.min((r.hPerDay || 0) / DAILY * 100, 100) : 0;
            if (!w) return null;
            return <div key={r.p.id} title={`${r.p.name}: ${fmtH(r.hPerDay)}/g`} style={{ width: w + "%", background: r.app?.color, opacity: .85, borderRight: "1px solid " + C.bg }} />;
          })}
          {/* 100% marker */}
          <div style={{ position: "absolute", left: "100%", top: 0, bottom: 0, width: 2, background: C.text, transform: "translateX(-1px)" }} />
        </div>
        <div style={{ fontSize: 10.5, color: C.textFaint, marginTop: 5 }}>The bar sums the theoretical hours/day of each project to meet deadlines. If it exceeds 100% of the day, you are overloaded in the current period.</div>
      </div>

      {/* per-project table */}
      <div style={st.panel}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 640 }}>
            <thead>
              <tr>
                {["Project", "Budget (h)", "Actual (h)", "Remaining (h)", "Work days left", "Hours/day", "Due"].map((h, i) => (
                  <th key={h} style={{ textAlign: i === 0 ? "left" : "center", color: C.textDim, fontWeight: 500, fontSize: 11.5, padding: "6px 8px", borderBottom: `1px solid ${C.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const heavy = r.hPerDay != null && r.hPerDay > DAILY;
                return (
                  <tr key={r.p.id}>
                    <td style={{ padding: "8px", borderBottom: `1px solid ${C.border}` }}>
                      <span style={{ ...st.dot, background: r.app?.color }} />
                      <button style={{ ...st.linkBtn, fontSize: 13, color: C.text }} onClick={() => go({ tab: "board", appId: r.p.appId, projectId: r.p.id })}>{r.p.name}</button>
                      <div style={{ fontSize: 11, color: C.textDim, marginLeft: 15 }}>{r.app?.name}</div>
                    </td>
                    <td style={{ textAlign: "center", borderBottom: `1px solid ${C.border}` }}>
                      <input type="number" min="0" value={r.budget} onChange={(e) => setH(r.p.id, "budgetH", e.target.value)} style={st.hInput} />
                    </td>
                    <td style={{ textAlign: "center", borderBottom: `1px solid ${C.border}` }}>
                      <input type="number" min="0" value={r.spent} onChange={(e) => setH(r.p.id, "spentH", e.target.value)} style={{ ...st.hInput, color: r.over ? C.danger : C.text }} />
                    </td>
                    <td style={{ textAlign: "center", borderBottom: `1px solid ${C.border}`, color: r.over ? C.danger : C.text, fontWeight: 600 }}>
                      {r.over ? "0 ⚠" : r.remaining.toLocaleString("en-US")}
                    </td>
                    <td style={{ textAlign: "center", borderBottom: `1px solid ${C.border}`, color: r.wd === 0 ? C.danger : C.textDim }}>
                      {r.wd === 0 ? "overdue" : r.wd}
                    </td>
                    <td style={{ textAlign: "center", borderBottom: `1px solid ${C.border}`, color: heavy ? C.danger : r.hPerDay == null ? C.textFaint : C.done, fontWeight: 600 }}>
                      {fmtH(r.hPerDay)}{heavy ? " ⚠" : ""}
                    </td>
                    <td style={{ textAlign: "center", borderBottom: `1px solid ${C.border}`, color: r.p.end < t0 ? C.danger : C.textDim, fontSize: 12 }}>{fmtDate(r.p.end)}</td>
                  </tr>
                );
              })}
              {!rows.length && <tr><td colSpan={7} style={{ padding: 16, textAlign: "center", color: C.textFaint }}>No active projects.{allForApp.length ? " (All completed)" : ""}</td></tr>}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 11, color: C.textFaint, marginTop: 10 }}>
          <strong style={{ color: C.textDim }}>Hours/day</strong> = remaining hours ÷ working days left to the deadline. Red if alone they exceed the {DAILY.toLocaleString("en-US")}h day or if the project is overdue. Budget and Actual fields are editable here.
        </div>
      </div>
    </div>
  );
}

// ============ Shared app filter ============
function AppFilter({ state, nav, go }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
      <button style={{ ...st.filterChip, ...(!nav.appId ? st.filterActive : {}) }} onClick={() => go({ appId: null, projectId: null })}>All</button>
      {state.apps.map((a) => (
        <button key={a.id} style={{ ...st.filterChip, ...(nav.appId === a.id ? st.filterActive : {}) }} onClick={() => go({ appId: a.id, projectId: null })}>
          <span style={{ ...st.dot, background: a.color }} />{a.name}
        </button>
      ))}
    </div>
  );
}

// ============ CSS ============
const globalCss = `
  * { box-sizing: border-box; }
  html, body { background: ${C.bg}; margin: 0; }
  ::-webkit-scrollbar { height: 9px; width: 9px; }
  ::-webkit-scrollbar-track { background: ${C.bg}; }
  ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 5px; }
  .navbtn:hover { color: ${C.text} !important; }
  .card-hover:hover { opacity: .85; }
  .kcard { transition: transform .12s, box-shadow .12s; }
  .kcard:hover { border-color: ${C.borderHi} !important; }
  .kcard:active { cursor: grabbing; }
  .todo-li:hover { background: ${C.panel2}55; border-radius: 6px; }
  .chipbtn:hover { border-color: ${C.borderHi} !important; }
  input, select, button { font-family: inherit; outline: none; }
  input::placeholder { color: ${C.textFaint}; }
  select option { background: ${C.panel}; color: ${C.text}; }
`;

const st = {
  root: { background: C.bg, color: C.text, fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif", minHeight: "100vh", width: "100%", padding: "0 14px 40px", boxSizing: "border-box" },
  inner: { maxWidth: 960, margin: "0 auto", width: "100%" },
  header: { padding: "20px 4px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" },
  todayBox: { textAlign: "right", background: C.panel, border: `1px solid ${C.border}`, borderRadius: 9, padding: "8px 14px" },
  todayLabel: { fontSize: 10, color: C.accent, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600 },
  todayDate: { fontSize: 13, color: C.text, marginTop: 2, textTransform: "capitalize" },
  logo: { width: 38, height: 38, borderRadius: 9, background: C.accent, color: "#0F1420", fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" },
  h1: { fontSize: 19, fontWeight: 600, color: C.text },
  sub: { fontSize: 12, color: C.textDim, marginTop: 1 },
  nav: { display: "flex", gap: 2, flexWrap: "wrap", borderBottom: `1px solid ${C.border}`, marginBottom: 14 },
  navBtn: { background: "none", border: "none", padding: "9px 13px", fontSize: 13.5, color: C.textDim, cursor: "pointer", borderBottom: "2px solid transparent" },
  navBtnActive: { color: C.accent, borderBottom: `2px solid ${C.accent}`, fontWeight: 500 },
  crumbBar: { display: "flex", alignItems: "center", flexWrap: "wrap", fontSize: 13, marginBottom: 14, padding: "8px 12px", background: C.panel, borderRadius: 9, border: `1px solid ${C.border}` },
  clearFilter: { marginLeft: "auto", background: "none", border: `1px solid ${C.border}`, color: C.textDim, fontSize: 11, padding: "3px 9px", borderRadius: 7, cursor: "pointer" },
  main: { paddingBottom: 20 },
  h2: { fontSize: 16, fontWeight: 600, color: C.text, margin: "4px 0 12px" },
  h3: { fontSize: 14, fontWeight: 600, color: C.text, margin: "10px 0 4px" },
  dropZone: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: `1.5px dashed ${C.borderHi}`, borderRadius: 10, padding: "22px 14px", cursor: "pointer", background: C.panel2, minHeight: 110 },
  dropOver: { borderColor: C.accent, background: C.accentDim },
  wideBtn: { width: "100%", textAlign: "left", background: C.panel2, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, padding: "11px 14px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" },
  adminBadge: { fontSize: 10, fontWeight: 700, color: C.accent, background: C.accentDim, border: `1px solid ${C.accent}55`, borderRadius: 5, padding: "2px 7px", letterSpacing: 0.5 },
  deltaLabel: { fontSize: 12.5, color: C.textDim, fontWeight: 500, marginBottom: 6 },
  footer: { textAlign: "center", fontSize: 15, fontWeight: 500, color: C.textDim, padding: "24px 0 28px", marginTop: 8, borderTop: `1px solid ${C.border}` },
  head: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" },
  panel: { background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 18px", marginBottom: 14 },
  metricGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 10, marginBottom: 16 },
  metric: { background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: "13px 15px", cursor: "pointer" },
  metricLabel: { fontSize: 12, color: C.textDim },
  metricVal: { fontSize: 23, fontWeight: 600, color: C.text, marginTop: 4 },
  dot: { display: "inline-block", width: 8, height: 8, borderRadius: "50%", marginRight: 7, verticalAlign: "middle" },
  track: { height: 7, background: C.panel2, borderRadius: 4, overflow: "hidden" },
  trackSm: { height: 5, background: C.panel2, borderRadius: 3, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 4, transition: "width .3s" },
  msRow: { display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: `1px solid ${C.border}` },
  empty: { fontSize: 13, color: C.textFaint, padding: "8px 0" },
  hint: { fontSize: 12, color: C.textFaint, margin: "6px 2px 14px" },
  // kanban
  kanban: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, alignItems: "start" },
  kcol: { background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 10, minHeight: 120 },
  kcolHead: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, color: C.text, fontWeight: 500, padding: "2px 4px 10px" },
  kcount: { fontSize: 11, color: C.textDim, background: C.panel2, borderRadius: 10, padding: "1px 8px" },
  kcard: { background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 9, padding: "10px 11px", marginBottom: 8, cursor: "grab" },
  kempty: { fontSize: 12, color: C.textFaint, textAlign: "center", padding: "16px 0" },
  addCard: { width: "100%", background: "none", border: `1px dashed ${C.border}`, color: C.textDim, fontSize: 12.5, padding: "8px", borderRadius: 8, cursor: "pointer", marginTop: 2 },
  miniChip: { fontSize: 10.5, fontWeight: 500, background: "none", border: "1px solid", borderRadius: 6, padding: "2px 7px", cursor: "pointer" },
  // controls
  addBtn: { background: C.accent, color: "#0F1420", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 500, cursor: "pointer" },
  exportBtn: { background: "none", color: C.accent, border: `1px solid ${C.accent}`, borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 500, cursor: "pointer" },
  saveBtn: { background: C.accent, color: "#0F1420", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  loadBtn: { background: "none", color: C.text, border: `1px solid ${C.borderHi}`, borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 500, cursor: "pointer" },
  primaryBtn: { background: C.accent, color: "#0F1420", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 14, fontWeight: 500, cursor: "pointer" },
  primaryBtnSm: { background: C.accent, color: "#0F1420", border: "none", borderRadius: 7, padding: "6px 12px", fontSize: 12.5, fontWeight: 500, cursor: "pointer" },
  ghostBtn: { background: "none", color: C.textDim, border: `1px solid ${C.border}`, borderRadius: 7, padding: "6px 12px", fontSize: 12.5, cursor: "pointer" },
  linkBtn: { background: "none", border: "none", color: C.accent, fontSize: 12, cursor: "pointer", padding: 0, textAlign: "left" },
  iconBtn: { background: "none", border: "none", color: C.textFaint, cursor: "pointer", fontSize: 13, padding: "2px 5px" },
  iconBtnSm: { background: "none", border: "none", color: C.textFaint, cursor: "pointer", fontSize: 12, padding: "0 3px" },
  input: { width: "100%", padding: "9px 12px", fontSize: 13.5, border: `1px solid ${C.border}`, borderRadius: 8, marginBottom: 8, background: C.panel2, color: C.text },
  chip: { background: C.panel2, border: `1px solid ${C.border}`, color: C.textDim, fontSize: 11, padding: "4px 9px", borderRadius: 7, cursor: "pointer" },
  statPill: { display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 500, padding: "3px 9px", borderRadius: 12 },
  agendaRow: { display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${C.border}` },
  agendaStatus: { fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 12, border: "1px solid", cursor: "pointer", minWidth: 90, flexShrink: 0 },
  hInput: { width: 64, padding: "5px 6px", fontSize: 13, border: `1px solid ${C.border}`, borderRadius: 6, background: C.panel2, color: C.text, textAlign: "center" },
  filterChip: { background: C.panel, border: `1px solid ${C.border}`, borderRadius: 16, padding: "5px 13px", fontSize: 12.5, cursor: "pointer", color: C.textDim },
  filterActive: { background: C.accentDim, border: `1px solid ${C.accent}`, color: C.text, fontWeight: 500 },
};

