import type { AppState } from "./types";
import { fmtDate, today } from "./utils";

export function buildReportHTML(state: AppState): string {
  const t = today();
  const esc = (s: unknown) =>
    String(s == null ? "" : s).replace(/[&<>"]/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] ?? c),
    );
  const statusLabel: Record<string, string> = {
    todo: "To do",
    doing: "In progress",
    done: "Completed",
  };
  const projById = (id: string) => state.projects.find((p) => p.id === id);
  const appById = (id: string) => state.apps.find((a) => a.id === id);
  const badge = (s: string) => {
    const map: Record<string, [string, string]> = {
      "In corso": ["#DCE9FB", "#14467C"],
      Completato: ["#D6F3E6", "#0B6A4E"],
      Pianificato: ["#FCEBD3", "#8A5A0B"],
      "Da fare": ["#EEECE6", "#555"],
    };
    const [bg, fg] = map[s] ?? map["Da fare"];
    return `<span style="background:${bg};color:${fg};font-size:11px;padding:2px 7px;border-radius:4px;font-weight:600">${esc(s)}</span>`;
  };
  const overdueTasks = state.tasks.filter(
    (x) => x.due && x.due < t && x.status !== "done",
  ).length;
  const overdueMs = state.milestones.filter((m) => !m.done && m.date < t).length;
  const avg = state.projects.length
    ? Math.round(
        state.projects.reduce((a, p) => a + p.progress, 0) / state.projects.length,
      )
    : 0;
  const dateLong = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const appRows = state.apps
    .map((a) => {
      const projs = state.projects.filter((p) => p.appId === a.id);
      const tn = state.tasks.filter((x) =>
        projs.some((p) => p.id === x.projectId),
      ).length;
      return `<tr><td>${esc(a.name)}</td><td style="color:#555">${esc(a.desc)}</td><td>${projs.length}</td><td>${tn}</td></tr>`;
    })
    .join("");

  const projRows = state.projects
    .map((p) => {
      const app = appById(p.appId);
      return `<tr><td style="color:${app?.color ?? "#333"}">${esc(app?.name)}</td><td>${esc(p.name)}</td><td>${badge(p.status)}</td><td>${fmtDate(p.start)}</td><td>${fmtDate(p.end)}</td><td>${p.progress}%</td><td style="color:#555">${esc(p.ownerName || "Team")}</td></tr>`;
    })
    .join("");

  const taskRows = [...state.tasks]
    .sort((a, b) => {
      const pa = projById(a.projectId);
      const pb = projById(b.projectId);
      return (
        (appById(pa?.appId ?? "")?.name || "").localeCompare(
          appById(pb?.appId ?? "")?.name || "",
        ) ||
        (pa?.name || "").localeCompare(pb?.name || "") ||
        (a.due || "9999").localeCompare(b.due || "9999")
      );
    })
    .map((x) => {
      const p = projById(x.projectId);
      const app = appById(p?.appId ?? "");
      const od = x.due && x.due < t && x.status !== "done";
      return `<tr><td style="color:${app?.color ?? "#333"}">${esc(app?.name)}</td><td style="color:#555">${esc(p?.name)}</td><td>${esc(x.name)}</td><td>${badge(statusLabel[x.status] ?? x.status)}</td><td style="color:#555">${esc(x.ownerName || "Team")}</td><td style="color:${od ? "#C0392B" : "#555"};font-weight:${od ? 600 : 400}">${x.due ? fmtDate(x.due) + (od ? " ⚠" : "") : "—"}</td></tr>`;
    })
    .join("");

  const msRows = [...state.milestones]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((m) => {
      const p = projById(m.projectId);
      const app = appById(p?.appId ?? "");
      const od = !m.done && m.date < t;
      const stt = m.done ? "Completed" : od ? "Overdue" : "Scheduled";
      const col = m.done ? "#0B6A4E" : od ? "#C0392B" : "#8A5A0B";
      return `<tr><td style="color:${app?.color ?? "#333"}">${esc(app?.name)}</td><td style="color:#555">${esc(p?.name)}</td><td>${esc(m.name)}</td><td style="color:${od ? "#C0392B" : "#1A2130"}">${fmtDate(m.date)}</td><td style="color:${col};font-weight:600">${stt}</td></tr>`;
    })
    .join("");

  const ds = state.projects
    .flatMap((p) => [new Date(p.start), new Date(p.end)])
    .filter((d) => !isNaN(d.getTime()));
  let ganttHTML = '<div style="color:#888;font-size:12px">No data.</div>';
  if (ds.length) {
    let mn = new Date(Math.min(...ds.map((d) => d.getTime())));
    let mx = new Date(Math.max(...ds.map((d) => d.getTime())));
    mn = new Date(mn.getFullYear(), mn.getMonth(), 1);
    mx = new Date(mx.getFullYear(), mx.getMonth() + 1, 0);
    const months: Date[] = [];
    const c = new Date(mn);
    while (c <= mx) {
      months.push(new Date(c));
      c.setMonth(c.getMonth() + 1);
    }
    const span = mx.getTime() - mn.getTime() || 1;
    const pct = (d: string | Date) =>
      ((new Date(d).getTime() - mn.getTime()) / span) * 100;
    const tp = pct(t);
    const head = months
      .map(
        (m, i) =>
          `<div style="flex:1;font-size:9px;color:#666;text-align:center;border-left:${i ? "1px solid #eee" : "none"}">${m.toLocaleDateString("en-US", { month: "short", year: "2-digit" })}</div>`,
      )
      .join("");
    const bars = state.projects
      .map((p) => {
        const app = appById(p.appId);
        const l = pct(p.start);
        const w = pct(p.end) - l;
        const ms = state.milestones.filter((m) => m.projectId === p.id);
        const msDots = ms
          .map(
            (m) =>
              `<div style="position:absolute;left:${pct(m.date)}%;top:0;transform:translateX(-50%);color:#E08A1E;font-size:11px">◆</div>`,
          )
          .join("");
        return `<div style="display:flex;align-items:center;margin-bottom:7px">
        <div style="width:140px;font-size:10px;color:#1A2130;flex-shrink:0;padding-right:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.name)}</div>
        <div style="flex:1;position:relative;height:16px">
          <div style="position:absolute;left:0;right:0;top:7px;height:2px;background:#eee"></div>
          <div style="position:absolute;left:${l}%;width:${Math.max(w, 1)}%;height:13px;top:1px;background:${(app?.color ?? "#888") + "44"};border-radius:3px"></div>
          <div style="position:absolute;left:${l}%;width:${Math.max((w * p.progress) / 100, 0.5)}%;height:13px;top:1px;background:${app?.color ?? "#888"};border-radius:3px;display:flex;align-items:center;justify-content:center"><span style="font-size:8px;color:#fff;font-weight:700">${p.progress > 12 ? p.progress + "%" : ""}</span></div>
          ${msDots}
        </div></div>`;
      })
      .join("");
    const todayLine =
      tp >= 0 && tp <= 100
        ? `<div style="position:absolute;left:calc(140px + (100% - 140px) * ${tp} / 100);top:0;bottom:0;border-left:1.5px dashed #C0392B;z-index:2"></div>`
        : "";
    ganttHTML = `<div style="position:relative">
      <div style="display:flex;margin-left:140px;border-bottom:1px solid #ccc;padding-bottom:3px;margin-bottom:6px">${head}</div>
      <div style="position:relative">${todayLine}${bars}</div>
      <div style="font-size:9px;color:#888;margin-top:6px">◆ Milestone · dashed line = today (${fmtDate(t)})</div>
    </div>`;
  }

  const kpi = (v: string | number, l: string, danger?: boolean) =>
    `<div style="flex:1;border:1px solid #ddd;border-radius:6px;padding:8px 10px;text-align:center"><div style="font-size:20px;font-weight:700;color:${danger ? "#C0392B" : "#1A2130"}">${v}</div><div style="font-size:10px;color:#777;margin-top:2px">${l}</div></div>`;
  const sec = (n: string, title: string, body: string) =>
    `<section style="margin-bottom:20px;page-break-inside:avoid"><h2 style="font-size:14px;font-weight:700;color:#1A2130;border-left:3px solid #5B8DEF;padding-left:8px;margin:0 0 8px">${n} · ${title}</h2>${body}</section>`;
  const tbl = (head: string, rows: string) =>
    `<table style="width:100%;border-collapse:collapse;font-size:11px"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>`;
  const th = (h: string, w?: string) =>
    `<th style="text-align:left;background:#1A2130;color:#fff;font-weight:600;padding:6px 8px;border:1px solid #1A2130;font-size:10.5px${w ? ";width:" + w : ""}">${h}</th>`;

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
    <div style="font-size:13px;color:#555;margin-top:4px">Applications tracked: ${esc(state.apps.map((a) => a.name).join(" · "))}</div>
    <div style="font-size:12px;color:#888;margin-top:2px;text-transform:capitalize">Updated on ${dateLong}</div>
    <div style="display:flex;gap:10px;margin-top:16px">
      ${kpi(state.apps.length, "Applications")}${kpi(state.projects.length, "Projects")}${kpi(avg + "%", "Avg. progress")}${kpi(overdueTasks, "Overdue tasks", overdueTasks > 0)}${kpi(overdueMs, "Overdue milestones", overdueMs > 0)}
    </div>
  </div>
  ${sec("1", "Applications", tbl(th("Application", "18%") + th("Description") + th("Projects", "14%") + th("Tasks", "14%"), appRows))}
  ${sec("2", "Projects", tbl(th("Applic.", "11%") + th("Project") + th("Status", "12%") + th("Start", "11%") + th("End", "11%") + th("Progr.", "10%") + th("Owner", "12%"), projRows))}
  ${sec("3", "Gantt", ganttHTML)}
  ${sec("4", "Tasks", tbl(th("Applic.", "11%") + th("Project", "22%") + th("Task") + th("Status", "12%") + th("Owner", "12%") + th("Due", "12%"), taskRows))}
  ${sec("5", "Milestone", tbl(th("Applic.", "13%") + th("Project") + th("Milestone") + th("Date", "14%") + th("Status", "12%"), msRows))}
  <div style="font-size:9px;color:#aaa;border-top:1px solid #ddd;padding-top:8px;margin-top:10px">Governance Board · generated on ${new Date().toLocaleDateString("en-US")}</div>
</body></html>`;
}
