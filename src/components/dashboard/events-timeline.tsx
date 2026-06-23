"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Application, Milestone, Project, Task } from "@/lib/types";
import { fmtDate, today } from "@/lib/utils";

type Horizon = "days" | "weeks" | "months";
type EvKind = "milestone" | "task";
type Ev = {
  id: string;
  kind: EvKind;
  date: string;
  name: string;
  proj?: Project;
  app?: Application;
  projectId: string;
};

const HZ: Record<
  Horizon,
  { days: number; tickDays: number; fmt: Intl.DateTimeFormatOptions; pxPerDay: number }
> = {
  days: { days: 21, tickDays: 1, fmt: { day: "2-digit", month: "short" }, pxPerDay: 30 },
  weeks: { days: 70, tickDays: 7, fmt: { day: "2-digit", month: "short" }, pxPerDay: 26 },
  months: { days: 180, tickDays: 30, fmt: { month: "short", year: "2-digit" }, pxPerDay: 22 },
};

export function EventsTimeline({
  apps,
  projects,
  tasks,
  milestones,
}: {
  apps: Application[];
  projects: Project[];
  tasks: Task[];
  milestones: Milestone[];
}) {
  const router = useRouter();
  const [hover, setHover] = useState<string | null>(null);
  const [appFilter, setAppFilter] = useState<string>("all");
  const [horizon, setHorizon] = useState<Horizon>("weeks");

  const t0 = today();
  const start = new Date(t0 + "T00:00:00");
  const cfg = HZ[horizon];
  const end = new Date(start);
  end.setDate(start.getDate() + cfg.days);
  const startMs = start.getTime();
  const spanMs = end.getTime() - startMs;
  const nTicks = Math.round(cfg.days / cfg.tickDays);
  const plotW = cfg.days * cfg.pxPerDay;

  const projById = (id: string) => projects.find((p) => p.id === id);
  const appOf = (pid: string) => {
    const p = projById(pid);
    return apps.find((a) => a.id === p?.appId);
  };
  const inWindow = (iso: string) => {
    const d = new Date(iso + "T00:00:00").getTime();
    return d >= startMs && d <= end.getTime();
  };
  const matchApp = (pid: string) =>
    appFilter === "all" || projById(pid)?.appId === appFilter;

  const events: Ev[] = [];
  milestones
    .filter(
      (m) => !m.done && m.date && inWindow(m.date) && matchApp(m.projectId),
    )
    .forEach((m) => {
      const app = appOf(m.projectId);
      events.push({
        id: "m" + m.id,
        kind: "milestone",
        date: m.date,
        name: m.name,
        proj: projById(m.projectId),
        app,
        projectId: m.projectId,
      });
    });
  tasks
    .filter(
      (t) =>
        t.due && t.status !== "done" && inWindow(t.due) && matchApp(t.projectId),
    )
    .forEach((t) => {
      const app = appOf(t.projectId);
      events.push({
        id: "t" + t.id,
        kind: "task",
        date: t.due,
        name: t.name,
        proj: projById(t.projectId),
        app,
        projectId: t.projectId,
      });
    });
  events.sort((a, b) => a.date.localeCompare(b.date));

  const xOf = (iso: string) =>
    ((new Date(iso + "T00:00:00").getTime() - startMs) / spanMs) * 100;

  const ticks: Date[] = [];
  for (let i = 0; i <= nTicks; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i * cfg.tickDays);
    ticks.push(d);
  }

  const appsWithEvents = apps.filter((a) =>
    events.some((e) => e.app?.id === a.id),
  );
  const laneOfApp: Record<string, number> = {};
  appsWithEvents.forEach((a, i) => {
    laneOfApp[a.id] = i;
  });
  const LANES = Math.max(appsWithEvents.length, 1);
  const MIN_GAP = (20 / plotW) * 100;
  const SUBROWS = 3;
  const byLane: Record<number, { x: number; sub: number }[]> = {};
  const placed = events.map((e) => {
    const lane = laneOfApp[e.app?.id ?? ""] ?? 0;
    const x = xOf(e.date);
    if (!byLane[lane]) byLane[lane] = [];
    let sub = 0;
    for (let s = 0; s < SUBROWS; s++) {
      const clash = byLane[lane].some(
        (p) => p.sub === s && Math.abs(p.x - x) < MIN_GAP,
      );
      if (!clash) {
        sub = s;
        break;
      }
      sub = s;
    }
    const rec = { ...e, x, lane, sub };
    byLane[lane].push({ x, sub });
    return rec;
  });

  const laneH = 40;
  const subH = 13;
  const plotH = LANES * laneH;
  const LBL = 120;

  const Marker = ({ e }: { e: (typeof placed)[number] }) => {
    const col = e.app?.color ?? "var(--color-fg-dim)";
    const glow = hover === e.id;
    if (e.kind === "milestone") {
      return (
        <span
          title="Milestone"
          className="inline-flex"
          style={{ filter: glow ? `drop-shadow(0 0 4px ${col})` : "none" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M6 21V4" stroke={col} strokeWidth="2.2" strokeLinecap="round" />
            <path
              d="M6 4.5h11.5l-2.3 3.4 2.3 3.4H6z"
              fill={col}
              stroke={col}
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      );
    }
    return (
      <span
        title="Task"
        className="inline-flex"
        style={{ filter: glow ? `drop-shadow(0 0 4px ${col})` : "none" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <rect
            x="3.5"
            y="3.5"
            width="17"
            height="17"
            rx="4"
            fill="none"
            stroke={col}
            strokeWidth="2.2"
          />
          <path
            d="M7.5 12.3l3 3 6-6.4"
            stroke={col}
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  };

  const horizonOpts: [Horizon, string][] = [
    ["days", "Days"],
    ["weeks", "Weeks"],
    ["months", "Months"],
  ];

  return (
    <div className="mb-3.5 rounded-xl border border-edge bg-panel p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setAppFilter("all")}
            className={
              "cursor-pointer rounded-full border border-edge px-3 py-1 text-[12.5px] " +
              (appFilter === "all"
                ? "border-accent bg-accent-dim font-medium text-fg"
                : "bg-panel text-fg-dim hover:text-fg")
            }
          >
            All
          </button>
          {apps.map((a) => (
            <button
              key={a.id}
              onClick={() => setAppFilter(a.id)}
              className={
                "flex cursor-pointer items-center rounded-full border px-3 py-1 text-[12.5px] " +
                (appFilter === a.id
                  ? "border-accent bg-accent-dim font-medium text-fg"
                  : "border-edge bg-panel text-fg-dim hover:text-fg")
              }
            >
              <span
                className="mr-2 inline-block h-2 w-2 rounded-full"
                style={{ background: a.color }}
              />
              {a.name}
            </button>
          ))}
        </div>
        <div className="flex gap-1 rounded-lg bg-panel2 p-[3px]">
          {horizonOpts.map(([k, lbl]) => (
            <button
              key={k}
              onClick={() => setHorizon(k)}
              className={
                "cursor-pointer rounded-md border-none px-3 py-1.5 text-[12.5px] font-medium " +
                (horizon === k
                  ? "bg-accent text-bg"
                  : "bg-transparent text-fg-dim hover:text-fg")
              }
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        {!placed.length ? (
          <div className="py-2 text-[13px] text-fg-faint">
            No deadlines in the selected horizon
            {appFilter !== "all" ? " for this application" : ""}.
          </div>
        ) : (
          <div
            className="relative"
            style={{ width: LBL + plotW, minWidth: LBL + 480 }}
          >
            <div
              className="relative mb-1.5 h-[18px]"
              style={{ marginLeft: LBL }}
            >
              {ticks.map(
                (d, i) =>
                  i % (horizon === "days" ? 2 : 1) === 0 && (
                    <div
                      key={i}
                      className="absolute whitespace-nowrap text-[10px] text-fg-dim"
                      style={{
                        left: `${(i / nTicks) * 100}%`,
                        transform: "translateX(-50%)",
                      }}
                    >
                      {d.toLocaleDateString("en-US", cfg.fmt)}
                    </div>
                  ),
              )}
            </div>
            <div className="relative">
              {appsWithEvents.map((a, i) => (
                <div
                  key={a.id}
                  className="absolute left-0 flex items-center gap-1.5 pr-2"
                  style={{
                    top: i * laneH,
                    height: laneH,
                    width: LBL - 10,
                  }}
                >
                  <span
                    className="h-2 w-2 flex-shrink-0 rounded-full"
                    style={{ background: a.color }}
                  />
                  <span
                    className="overflow-hidden text-ellipsis whitespace-nowrap text-xs font-semibold"
                    style={{ color: a.color }}
                  >
                    {a.name}
                  </span>
                </div>
              ))}
              <div
                className="relative border-l border-t border-b border-edge"
                style={{ height: plotH, marginLeft: LBL }}
              >
                {appsWithEvents.map((a, i) => (
                  <div
                    key={a.id}
                    className="absolute left-0 right-0"
                    style={{
                      top: i * laneH,
                      height: laneH,
                      background: i % 2 ? "transparent" : "rgba(33,42,59,.33)",
                      borderTop: i ? "1px solid var(--color-edge)" : "none",
                    }}
                  />
                ))}
                {ticks.map((_, i) => (
                  <div
                    key={i}
                    className="absolute top-0 bottom-0 w-px"
                    style={{
                      left: `${(i / nTicks) * 100}%`,
                      background: i === 0 ? "transparent" : "var(--color-panel2)",
                    }}
                  />
                ))}
                <div
                  className="absolute left-0 top-0 bottom-0 w-0.5 bg-danger"
                  title="Today"
                />
                {placed.map((e) => (
                  <div
                    key={e.id}
                    onMouseEnter={() => setHover(e.id)}
                    onMouseLeave={() => setHover(null)}
                    onClick={() =>
                      router.push(
                        `/board?appId=${e.app?.id ?? ""}&projectId=${e.projectId}`,
                      )
                    }
                    className="absolute cursor-pointer"
                    style={{
                      left: `${e.x}%`,
                      top: e.lane * laneH + laneH / 2 + (e.sub - 1) * subH,
                      transform: "translate(-50%,-50%)",
                      zIndex: hover === e.id ? 5 : 1,
                    }}
                  >
                    <Marker e={e} />
                    {hover === e.id && (
                      <div
                        className="absolute z-10 w-[180px] rounded-md border border-edge-hi bg-panel2 px-2.5 py-1.5 shadow-lg"
                        style={{ left: 18, top: -4 }}
                      >
                        <div className="text-[12.5px] font-medium text-fg">
                          {e.name}
                        </div>
                        <div className="mt-0.5 text-[11px] text-fg-dim">
                          {e.proj?.name}
                        </div>
                        <div
                          className="mt-0.5 text-[11px]"
                          style={{ color: e.app?.color }}
                        >
                          {e.kind === "milestone" ? "⚑ Milestone" : "☑ Task"} ·{" "}
                          {fmtDate(e.date)}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-4 text-[11px] text-fg-dim">
              <span className="inline-flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6 21V4"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M6 4.5h11.5l-2.3 3.4 2.3 3.4H6z"
                    fill="currentColor"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                  />
                </svg>
                Milestone
              </span>
              <span className="inline-flex items-center gap-1.5">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <rect
                    x="3.5"
                    y="3.5"
                    width="17"
                    height="17"
                    rx="4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                  />
                  <path
                    d="M7.5 12.3l3 3 6-6.4"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Task
              </span>
              <span className="inline-flex items-center">
                <span className="mr-1 inline-block h-2.5 w-0.5 bg-danger align-middle" />
                Today
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
