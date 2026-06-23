import Link from "next/link";
import type { AppState } from "@/lib/types";
import { fmtDate, today } from "@/lib/utils";

export function GanttView({
  state,
  appId,
}: {
  state: AppState;
  appId: string | null;
}) {
  const projects = state.projects.filter((p) => !appId || p.appId === appId);
  const ds = projects.flatMap((p) => [new Date(p.start), new Date(p.end)]);
  const msd = state.milestones
    .filter((m) => projects.some((p) => p.id === m.projectId))
    .map((m) => new Date(m.date));
  const all = [...ds, ...msd].filter((d) => !isNaN(d.getTime()));

  let minD: Date;
  let maxD: Date;
  if (!all.length) {
    minD = new Date();
    maxD = new Date(minD.getTime() + 90 * 864e5);
  } else {
    let mn = new Date(Math.min(...all.map((d) => d.getTime())));
    let mx = new Date(Math.max(...all.map((d) => d.getTime())));
    minD = new Date(mn.getFullYear(), mn.getMonth(), 1);
    maxD = new Date(mx.getFullYear(), mx.getMonth() + 1, 0);
  }
  const months: Date[] = [];
  const c = new Date(minD);
  while (c <= maxD) {
    months.push(new Date(c));
    c.setMonth(c.getMonth() + 1);
  }
  const span = maxD.getTime() - minD.getTime() || 1;
  const pct = (d: string | Date) =>
    ((new Date(d).getTime() - minD.getTime()) / span) * 100;
  const t0 = today();
  const tp = pct(t0);

  return (
    <div className="overflow-x-auto rounded-xl border border-edge bg-panel p-4">
      <div
        className="relative mb-2.5 flex min-w-[460px] border-b border-edge pb-1.5"
        style={{ marginLeft: 150 }}
      >
        {months.map((m, i) => (
          <div
            key={i}
            className="flex-1 text-center text-[11px] text-fg-dim"
            style={{
              borderLeft: i ? "1px solid var(--color-edge)" : "none",
            }}
          >
            {m.toLocaleDateString("en-US", { month: "short", year: "2-digit" })}
          </div>
        ))}
        {tp >= 0 && tp <= 100 && (
          <div
            className="absolute z-[4] rounded-md bg-danger px-2 py-px text-[10px] font-bold text-bg"
            style={{
              left: `${tp}%`,
              top: -2,
              transform: "translateX(-50%)",
              whiteSpace: "nowrap",
            }}
          >
            Today · {fmtDate(t0)}
          </div>
        )}
      </div>
      <div className="relative min-w-[610px]">
        {tp >= 0 && tp <= 100 && (
          <>
            <div
              className="absolute top-0 bottom-0 z-[2] w-0 border-l-2 border-dashed border-danger"
              style={{ left: `calc(150px + (100% - 150px) * ${tp} / 100)` }}
            />
            <div
              className="absolute z-[3] h-2 w-2 rounded-full bg-danger"
              style={{
                left: `calc(150px + (100% - 150px) * ${tp} / 100)`,
                top: -3,
                transform: "translateX(-50%)",
              }}
            />
          </>
        )}
        {projects.map((p) => {
          const app = state.apps.find((a) => a.id === p.appId);
          const l = pct(p.start);
          const w = pct(p.end) - l;
          const ms = state.milestones.filter((m) => m.projectId === p.id);
          return (
            <div key={p.id} className="mb-3 flex items-center">
              <Link
                href={`/board?appId=${p.appId}&projectId=${p.id}`}
                className="flex-shrink-0 cursor-pointer p-0 text-xs text-fg"
                style={{ width: 150 }}
              >
                <span
                  className="mr-2 inline-block h-2 w-2 rounded-full"
                  style={{ background: app?.color }}
                />
                {p.name}
              </Link>
              <div className="relative h-6 flex-1">
                <div
                  className="absolute left-0 right-0 top-2.5 h-1 rounded bg-panel2"
                />
                <div
                  className="absolute h-5 rounded"
                  style={{
                    left: `${l}%`,
                    width: `${Math.max(w, 1)}%`,
                    top: 2,
                    background: (app?.color ?? "#888") + "33",
                  }}
                />
                <div
                  className="absolute flex h-5 items-center justify-center rounded"
                  style={{
                    left: `${l}%`,
                    width: `${Math.max((w * p.progress) / 100, 0.5)}%`,
                    top: 2,
                    background: app?.color,
                  }}
                >
                  <span className="text-[10px] font-semibold text-bg">
                    {p.progress > 10 ? p.progress + "%" : ""}
                  </span>
                </div>
                {ms.map((m) => (
                  <div
                    key={m.id}
                    title={`${m.name} · ${fmtDate(m.date)}`}
                    className="absolute z-[3] text-[13px]"
                    style={{
                      left: `${pct(m.date)}%`,
                      top: 1,
                      transform: "translateX(-50%)",
                      color: m.done
                        ? "var(--color-st-done)"
                        : "var(--color-st-plan)",
                    }}
                  >
                    ◆
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {!projects.length && (
          <div className="py-2 text-[13px] text-fg-faint">No projects.</div>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-fg-dim">
        <span>
          <span className="mr-1 inline-block h-2 w-3 rounded-sm bg-accent" />
          Progress
        </span>
        <span className="text-st-plan">◆ Milestone</span>
        <span className="inline-flex items-center">
          <span className="mr-1 inline-block h-2.5 w-0 border-l-2 border-dashed border-danger" />
          Today (position on the timeline)
        </span>
      </div>
    </div>
  );
}
