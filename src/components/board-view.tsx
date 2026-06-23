"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { AppState } from "@/lib/types";
import { fmtDate, today } from "@/lib/utils";
import { KCOLS } from "@/lib/theme";
import {
  createTask,
  deleteTask,
  moveTask,
  setTaskOwner,
} from "@/actions/tasks";

export function BoardView({
  state,
  appId,
  projectId,
}: {
  state: AppState;
  appId: string | null;
  projectId: string | null;
}) {
  const router = useRouter();
  const [drag, setDrag] = useState<string | null>(null);
  const [addCol, setAddCol] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [, startTransition] = useTransition();

  const scopeProjects = state.projects.filter((p) =>
    projectId ? p.id === projectId : appId ? p.appId === appId : true,
  );
  const scopeIds = scopeProjects.map((p) => p.id);
  const tasks = state.tasks.filter(
    (t) =>
      scopeIds.includes(t.projectId) &&
      (ownerFilter === "all" || (t.ownerName || "Team") === ownerFilter),
  );

  const setQuery = (params: Record<string, string | null>) => {
    const sp = new URLSearchParams();
    if (params.appId) sp.set("appId", params.appId);
    if (params.projectId) sp.set("projectId", params.projectId);
    const qs = sp.toString();
    router.push("/board" + (qs ? "?" + qs : ""));
  };

  const move = (id: string, status: string) =>
    startTransition(() => moveTask(id, status));
  const del = (id: string) => startTransition(() => deleteTask(id));
  const setOwner = (id: string, owner: string) =>
    startTransition(() => setTaskOwner(id, owner));
  const add = (col: string) => {
    if (!text.trim()) return;
    const pid = projectId || scopeIds[0];
    const def = ownerFilter !== "all" ? ownerFilter : "Team";
    if (!pid) return;
    startTransition(async () => {
      await createTask(pid, text, col, def);
      setText("");
      setAddCol(null);
    });
  };

  const t0 = today();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <h2 className="my-1 text-base font-semibold text-fg">Tasks</h2>
        <div className="flex flex-wrap gap-2">
          <select
            className="rounded-lg border border-edge bg-panel2 px-3 py-2 text-[13.5px] text-fg"
            value={appId ?? "all"}
            onChange={(e) =>
              setQuery({
                appId: e.target.value === "all" ? null : e.target.value,
                projectId: null,
              })
            }
          >
            <option value="all">All applications</option>
            {state.apps.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border border-edge bg-panel2 px-3 py-2 text-[13.5px] text-fg"
            value={projectId ?? "all"}
            onChange={(e) =>
              setQuery({
                appId: appId,
                projectId: e.target.value === "all" ? null : e.target.value,
              })
            }
          >
            <option value="all">All projects</option>
            {scopeProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border border-edge bg-panel2 px-3 py-2 text-[13.5px] text-fg"
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
          >
            <option value="all">All owners</option>
            {state.owners.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!scopeIds.length && (
        <div className="py-2 text-[13px] text-fg-faint">
          No projects in this scope.
        </div>
      )}

      <div className="mt-2 grid grid-cols-1 items-start gap-3 md:grid-cols-3">
        {KCOLS.map((col) => {
          const items = tasks.filter((t) => t.status === col.id);
          return (
            <div
              key={col.id}
              className="min-h-[120px] rounded-xl border border-edge bg-panel p-2.5"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (drag) {
                  move(drag, col.id);
                  setDrag(null);
                }
              }}
            >
              <div className="flex items-center justify-between px-1 pb-2.5 pt-0.5 text-[13px] font-medium text-fg">
                <span>
                  <span
                    className="mr-2 inline-block h-2 w-2 rounded-full"
                    style={{ background: col.color }}
                  />
                  {col.label}
                </span>
                <span className="rounded-xl bg-panel2 px-2 py-0.5 text-[11px] text-fg-dim">
                  {items.length}
                </span>
              </div>
              {items.map((t) => {
                const proj = state.projects.find((p) => p.id === t.projectId);
                const app = state.apps.find((a) => a.id === proj?.appId);
                const od =
                  t.due && t.due < t0 && t.status !== "done" ? true : false;
                return (
                  <div
                    key={t.id}
                    draggable
                    onDragStart={() => setDrag(t.id)}
                    onDragEnd={() => setDrag(null)}
                    className="kcard"
                  >
                    <div className="flex items-start justify-between">
                      <button
                        onClick={() =>
                          setQuery({
                            appId: proj?.appId ?? null,
                            projectId: proj?.id ?? null,
                          })
                        }
                        className="cursor-pointer rounded-md border bg-transparent px-2 py-0.5 text-[10.5px] font-medium"
                        style={{
                          color: app?.color,
                          borderColor: (app?.color ?? "#444") + "55",
                        }}
                      >
                        {proj?.name}
                      </button>
                      <button
                        onClick={() => del(t.id)}
                        className="cursor-pointer border-none bg-transparent px-1 text-xs text-fg-faint hover:text-danger"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="my-1.5 text-sm text-fg">{t.name}</div>
                    <div className="mt-1.5 flex items-center justify-between">
                      {t.due ? (
                        <span
                          className="text-[11px]"
                          style={{
                            color: od ? "var(--color-danger)" : "var(--color-fg-dim)",
                          }}
                        >
                          ⏱ {fmtDate(t.due)}
                          {od ? " · overdue" : ""}
                        </span>
                      ) : (
                        <span />
                      )}
                      <select
                        value={t.ownerName || "Team"}
                        onChange={(e) => setOwner(t.id, e.target.value)}
                        title="Owner"
                        className="cursor-pointer rounded-md border border-edge bg-panel px-1.5 py-0.5 text-[10.5px] text-fg-dim"
                      >
                        {state.owners.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
              {addCol === col.id ? (
                <div className="mt-1.5">
                  <input
                    autoFocus
                    className="mb-1.5 w-full rounded-lg border border-edge bg-panel2 px-3 py-2 text-[13.5px] text-fg"
                    placeholder="Task title…"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && add(col.id)}
                  />
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => add(col.id)}
                      disabled={!scopeIds.length}
                      className="cursor-pointer rounded-md border-none bg-accent px-3 py-1.5 text-[12.5px] font-medium text-bg disabled:opacity-50"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setAddCol(null);
                        setText("");
                      }}
                      className="cursor-pointer rounded-md border border-edge bg-transparent px-3 py-1.5 text-[12.5px] text-fg-dim"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setAddCol(col.id);
                    setText("");
                  }}
                  disabled={!scopeIds.length}
                  className="mt-0.5 w-full cursor-pointer rounded-lg border border-dashed border-edge bg-transparent px-2 py-2 text-[12.5px] text-fg-dim disabled:opacity-50"
                >
                  + Add
                </button>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-3 text-xs text-fg-faint">
        Drag tasks between columns. Project progress updates automatically.
      </div>
    </div>
  );
}
