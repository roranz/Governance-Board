"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { AppState } from "@/lib/types";
import { fmtDate, today, workingDays } from "@/lib/utils";
import { updateProjectHours } from "@/actions/projects";

const DAILY = 7.5;

export function CapacityView({
  state,
  appId,
}: {
  state: AppState;
  appId: string | null;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [draft, setDraft] = useState<Record<string, { budgetH?: string; spentH?: string }>>({});

  const t0 = today();
  const projects = state.projects.filter(
    (p) => (!appId || p.appId === appId) && p.status !== "Completato",
  );
  const allForApp = state.projects.filter((p) => !appId || p.appId === appId);

  const commit = (
    pid: string,
    field: "budgetH" | "spentH",
    raw: string,
  ) => {
    const v = Math.max(0, Math.floor(Number(raw) || 0));
    startTransition(async () => {
      await updateProjectHours(pid, field, v);
      setDraft((d) => {
        const n = { ...d };
        delete n[pid]?.[field];
        return n;
      });
    });
  };

  const draftOf = (pid: string, field: "budgetH" | "spentH", fallback: number) =>
    draft[pid]?.[field] ?? String(fallback);

  const rows = projects.map((p) => {
    const app = state.apps.find((a) => a.id === p.appId);
    const budget = p.budgetH || 0;
    const spent = p.spentH || 0;
    const remaining = Math.max(budget - spent, 0);
    const over = spent > budget;
    const wd = p.end >= t0 ? workingDays(t0, p.end) : 0;
    const hPerDay = wd > 0 ? remaining / wd : null;
    return { p, app, budget, spent, remaining, over, wd, hPerDay };
  });

  const totalPerDay = rows.reduce((a, r) => a + (r.hPerDay || 0), 0);
  const overloaded = totalPerDay > DAILY;

  const fmtH = (n: number | null) =>
    n == null
      ? "—"
      : (Math.round(n * 10) / 10).toLocaleString("en-US") + "h";

  return (
    <div>
      <div className="mb-3 text-xs text-fg-faint">
        Budget and actuals in hours. Days counted as working days only (Mon-Fri),
        from today to project end date. Reference day: {DAILY.toLocaleString("en-US")}h.
      </div>

      <div
        className="mb-3.5 rounded-xl border border-edge bg-panel p-4"
        style={{
          borderLeft: `3px solid ${overloaded ? "var(--color-danger)" : "var(--color-st-done)"}`,
        }}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <div className="text-[13px] text-fg-dim">
              Total daily workload{" "}
              {appId ? "(filtered application)" : "(all active projects)"}
            </div>
            <div
              className="mt-0.5 text-[26px] font-bold"
              style={{
                color: overloaded ? "var(--color-danger)" : "var(--color-fg)",
              }}
            >
              {fmtH(totalPerDay)}
              <span className="text-sm font-normal text-fg-dim">
                {" "}
                / {DAILY.toLocaleString("en-US")}h per day
              </span>
            </div>
          </div>
          <div className="text-right">
            <div
              className="text-xs font-semibold"
              style={{
                color: overloaded ? "var(--color-danger)" : "var(--color-st-done)",
              }}
            >
              {overloaded ? "⚠ Overload" : "✓ Sustainable"}
            </div>
            <div className="mt-0.5 text-[11px] text-fg-dim">
              {overloaded
                ? `Excess ${fmtH(totalPerDay - DAILY)}/day`
                : `Margin ${fmtH(DAILY - totalPerDay)}/day`}
            </div>
          </div>
        </div>
        <div className="relative mt-3 flex h-4 overflow-hidden rounded-md bg-panel2">
          {rows.map((r) => {
            const w = DAILY > 0 ? Math.min(((r.hPerDay || 0) / DAILY) * 100, 100) : 0;
            if (!w) return null;
            return (
              <div
                key={r.p.id}
                title={`${r.p.name}: ${fmtH(r.hPerDay)}/g`}
                style={{
                  width: `${w}%`,
                  background: r.app?.color,
                  opacity: 0.85,
                  borderRight: "1px solid var(--color-bg)",
                }}
              />
            );
          })}
          <div className="absolute left-full top-0 bottom-0 w-0.5 -translate-x-px bg-fg" />
        </div>
        <div className="mt-1 text-[10.5px] text-fg-faint">
          The bar sums the theoretical hours/day of each project to meet deadlines.
          If it exceeds 100% of the day, you are overloaded in the current period.
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-edge bg-panel p-4">
        <table className="w-full min-w-[640px] border-collapse text-[13px]">
          <thead>
            <tr>
              {[
                "Project",
                "Budget (h)",
                "Actual (h)",
                "Remaining (h)",
                "Work days left",
                "Hours/day",
                "Due",
              ].map((h, i) => (
                <th
                  key={h}
                  className="border-b border-edge px-2 py-1.5 text-[11.5px] font-medium text-fg-dim"
                  style={{ textAlign: i === 0 ? "left" : "center" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const heavy = r.hPerDay != null && r.hPerDay > DAILY;
              return (
                <tr key={r.p.id}>
                  <td className="border-b border-edge p-2">
                    <span
                      className="mr-2 inline-block h-2 w-2 rounded-full"
                      style={{ background: r.app?.color }}
                    />
                    <button
                      onClick={() =>
                        router.push(
                          `/board?appId=${r.p.appId}&projectId=${r.p.id}`,
                        )
                      }
                      className="cursor-pointer border-none bg-transparent p-0 text-[13px] text-fg hover:underline"
                    >
                      {r.p.name}
                    </button>
                    <div className="ml-4 text-[11px] text-fg-dim">
                      {r.app?.name}
                    </div>
                  </td>
                  <td className="border-b border-edge text-center">
                    <input
                      type="number"
                      min="0"
                      value={draftOf(r.p.id, "budgetH", r.budget)}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          [r.p.id]: { ...d[r.p.id], budgetH: e.target.value },
                        }))
                      }
                      onBlur={(e) => commit(r.p.id, "budgetH", e.target.value)}
                      className="w-16 rounded-md border border-edge bg-panel2 px-1.5 py-1 text-center text-[13px] text-fg"
                    />
                  </td>
                  <td className="border-b border-edge text-center">
                    <input
                      type="number"
                      min="0"
                      value={draftOf(r.p.id, "spentH", r.spent)}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          [r.p.id]: { ...d[r.p.id], spentH: e.target.value },
                        }))
                      }
                      onBlur={(e) => commit(r.p.id, "spentH", e.target.value)}
                      className="w-16 rounded-md border border-edge bg-panel2 px-1.5 py-1 text-center text-[13px]"
                      style={{
                        color: r.over ? "var(--color-danger)" : "var(--color-fg)",
                      }}
                    />
                  </td>
                  <td
                    className="border-b border-edge text-center font-semibold"
                    style={{
                      color: r.over ? "var(--color-danger)" : "var(--color-fg)",
                    }}
                  >
                    {r.over ? "0 ⚠" : r.remaining.toLocaleString("en-US")}
                  </td>
                  <td
                    className="border-b border-edge text-center"
                    style={{
                      color:
                        r.wd === 0 ? "var(--color-danger)" : "var(--color-fg-dim)",
                    }}
                  >
                    {r.wd === 0 ? "overdue" : r.wd}
                  </td>
                  <td
                    className="border-b border-edge text-center font-semibold"
                    style={{
                      color: heavy
                        ? "var(--color-danger)"
                        : r.hPerDay == null
                          ? "var(--color-fg-faint)"
                          : "var(--color-st-done)",
                    }}
                  >
                    {fmtH(r.hPerDay)}
                    {heavy ? " ⚠" : ""}
                  </td>
                  <td
                    className="border-b border-edge text-center text-xs"
                    style={{
                      color:
                        r.p.end < t0 ? "var(--color-danger)" : "var(--color-fg-dim)",
                    }}
                  >
                    {fmtDate(r.p.end)}
                  </td>
                </tr>
              );
            })}
            {!rows.length && (
              <tr>
                <td
                  colSpan={7}
                  className="p-4 text-center text-fg-faint"
                >
                  No active projects.
                  {allForApp.length ? " (All completed)" : ""}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="mt-2.5 text-[11px] text-fg-faint">
          <strong className="text-fg-dim">Hours/day</strong> = remaining hours ÷
          working days left to the deadline. Red if alone they exceed the{" "}
          {DAILY.toLocaleString("en-US")}h day or if the project is overdue.
          Budget and Actual fields are editable here.
        </div>
      </div>
    </div>
  );
}
