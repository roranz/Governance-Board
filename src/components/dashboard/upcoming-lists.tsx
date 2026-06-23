import Link from "next/link";
import type { AppState } from "@/lib/types";
import { fmtDate, today } from "@/lib/utils";

export function UpcomingLists({ state }: { state: AppState }) {
  const t = today();
  const hasMs = state.milestones.some((m) => !m.done);
  const hasTasks = state.tasks.some((x) => x.due && x.status !== "done");
  const statusLabel: Record<string, string> = { todo: "To do", doing: "In progress" };

  return (
    <>
      <h2 className="mx-0 mb-3 mt-1 text-base font-semibold text-fg">
        Upcoming milestones
      </h2>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-[repeat(auto-fit,minmax(260px,1fr))]">
        {state.apps.map((app) => {
          const projIds = state.projects
            .filter((p) => p.appId === app.id)
            .map((p) => p.id);
          const list = [...state.milestones]
            .filter((m) => !m.done && projIds.includes(m.projectId))
            .sort((a, b) => a.date.localeCompare(b.date));
          if (!list.length) return null;
          return (
            <div
              key={app.id}
              className="rounded-xl border border-edge bg-panel p-4"
              style={{ borderTop: `3px solid ${app.color}` }}
            >
              <div
                className="mb-2 text-[13px] font-semibold"
                style={{ color: app.color }}
              >
                {app.name}
              </div>
              {list.map((m) => {
                const proj = state.projects.find((p) => p.id === m.projectId);
                const od = m.date < t;
                return (
                  <Link
                    key={m.id}
                    href={`/board?appId=${app.id}&projectId=${m.projectId}`}
                    className="flex cursor-pointer items-center gap-2.5 border-b border-edge py-2 transition-opacity hover:opacity-85"
                  >
                    <span
                      className="text-[13px]"
                      style={{ color: od ? "var(--color-danger)" : "var(--color-st-plan)" }}
                    >
                      ◆
                    </span>
                    <div className="flex-1">
                      <div className="text-sm text-fg">{m.name}</div>
                      <div className="text-xs text-fg-dim">{proj?.name}</div>
                    </div>
                    <span
                      className="text-[13px]"
                      style={{ color: od ? "var(--color-danger)" : undefined }}
                    >
                      {fmtDate(m.date)}
                    </span>
                  </Link>
                );
              })}
            </div>
          );
        })}
        {!hasMs && (
          <div className="rounded-xl border border-edge bg-panel p-4">
            <div className="py-2 text-[13px] text-fg-faint">No milestones.</div>
          </div>
        )}
      </div>

      <h2 className="mx-0 mb-3 mt-4 text-base font-semibold text-fg">
        Upcoming task deadlines
      </h2>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-[repeat(auto-fit,minmax(260px,1fr))]">
        {state.apps.map((app) => {
          const projIds = state.projects
            .filter((p) => p.appId === app.id)
            .map((p) => p.id);
          const list = state.tasks
            .filter(
              (x) => x.due && x.status !== "done" && projIds.includes(x.projectId),
            )
            .sort((a, b) => a.due.localeCompare(b.due));
          if (!list.length) return null;
          return (
            <div
              key={app.id}
              className="rounded-xl border border-edge bg-panel p-4"
              style={{ borderTop: `3px solid ${app.color}` }}
            >
              <div
                className="mb-2 text-[13px] font-semibold"
                style={{ color: app.color }}
              >
                {app.name}
              </div>
              {list.map((x) => {
                const proj = state.projects.find((p) => p.id === x.projectId);
                const od = x.due < t;
                return (
                  <Link
                    key={x.id}
                    href={`/board?appId=${app.id}&projectId=${x.projectId}`}
                    className="flex cursor-pointer items-center gap-2.5 border-b border-edge py-2 transition-opacity hover:opacity-85"
                  >
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ background: app.color }}
                    />
                    <div className="flex-1">
                      <div className="text-sm text-fg">{x.name}</div>
                      <div className="text-xs text-fg-dim">
                        {proj?.name} · {statusLabel[x.status] ?? x.status}
                      </div>
                    </div>
                    <span
                      className="text-[13px]"
                      style={{ color: od ? "var(--color-danger)" : undefined }}
                    >
                      {fmtDate(x.due)}
                      {od ? " ⚠" : ""}
                    </span>
                  </Link>
                );
              })}
            </div>
          );
        })}
        {!hasTasks && (
          <div className="rounded-xl border border-edge bg-panel p-4">
            <div className="py-2 text-[13px] text-fg-faint">
              No tasks with a due date.
            </div>
          </div>
        )}
      </div>
    </>
  );
}
