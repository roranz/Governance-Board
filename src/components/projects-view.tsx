"use client";

import Link from "next/link";
import { Suspense, useState, useTransition } from "react";
import type { AppState } from "@/lib/types";
import { fmtDate } from "@/lib/utils";
import { PROJ_COLS } from "@/lib/theme";
import { createProject, deleteProject, moveProject } from "@/actions/projects";
import { AppFilter } from "@/components/app-filter";

export function ProjectsView({
  state,
  appId,
}: {
  state: AppState;
  appId: string | null;
}) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    appId: appId || state.apps[0]?.id || "",
    name: "",
    start: "",
    end: "",
    budgetH: "",
  });
  const [drag, setDrag] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const visible = state.projects.filter((p) => !appId || p.appId === appId);

  const add = () => {
    if (!form.name.trim() || !form.appId) return;
    startTransition(async () => {
      await createProject({
        appId: form.appId,
        name: form.name,
        start: form.start,
        end: form.end,
        budgetH: Number(form.budgetH) || 0,
      });
      setForm({
        appId: appId || state.apps[0]?.id || "",
        name: "",
        start: "",
        end: "",
        budgetH: "",
      });
      setAdding(false);
    });
  };

  const del = (id: string) => {
    if (!confirm("Delete the project?")) return;
    startTransition(async () => {
      await deleteProject(id);
    });
  };

  const move = (id: string, status: string) => {
    startTransition(async () => {
      await moveProject(id, status);
    });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <h2 className="my-1 text-base font-semibold text-fg">
          Projects
          {appId && (
            <span className="ml-1 text-sm font-normal text-fg-dim">
              · {state.apps.find((a) => a.id === appId)?.name}
            </span>
          )}
        </h2>
        <button
          onClick={() => setAdding(!adding)}
          className="cursor-pointer rounded-lg border-none bg-accent px-3.5 py-2 text-[13px] font-medium text-bg"
        >
          + Project
        </button>
      </div>

      <Suspense fallback={null}>
        <AppFilter apps={state.apps} />
      </Suspense>

      {adding && (
        <div className="mb-3.5 rounded-xl border border-edge bg-panel p-4">
          <select
            className="mb-2 w-full rounded-lg border border-edge bg-panel2 px-3 py-2 text-[13.5px] text-fg"
            value={form.appId}
            onChange={(e) => setForm({ ...form, appId: e.target.value })}
          >
            {state.apps.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <input
            className="mb-2 w-full rounded-lg border border-edge bg-panel2 px-3 py-2 text-[13.5px] text-fg"
            placeholder="Project name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <div className="mb-2 flex gap-2">
            <input
              type="date"
              className="w-full rounded-lg border border-edge bg-panel2 px-3 py-2 text-[13.5px] text-fg"
              value={form.start}
              onChange={(e) => setForm({ ...form, start: e.target.value })}
            />
            <input
              type="date"
              className="w-full rounded-lg border border-edge bg-panel2 px-3 py-2 text-[13.5px] text-fg"
              value={form.end}
              onChange={(e) => setForm({ ...form, end: e.target.value })}
            />
          </div>
          <input
            type="number"
            min="0"
            className="mb-2 w-full rounded-lg border border-edge bg-panel2 px-3 py-2 text-[13.5px] text-fg"
            placeholder="Budget hours (e.g. 150)"
            value={form.budgetH}
            onChange={(e) => setForm({ ...form, budgetH: e.target.value })}
          />
          <button
            onClick={add}
            className="cursor-pointer rounded-lg border-none bg-accent px-4 py-2 text-sm font-medium text-bg"
          >
            Save
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-3">
        {PROJ_COLS.map((col) => {
          const items = visible.filter((p) => p.status === col.id);
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
              {items.map((p) => {
                const app = state.apps.find((a) => a.id === p.appId);
                const tn = state.tasks.filter((t) => t.projectId === p.id);
                const doneN = tn.filter((t) => t.status === "done").length;
                return (
                  <div
                    key={p.id}
                    draggable
                    onDragStart={() => setDrag(p.id)}
                    onDragEnd={() => setDrag(null)}
                    className="kcard"
                  >
                    <div className="flex items-start justify-between">
                      <span
                        className="text-[11px] font-medium"
                        style={{ color: app?.color }}
                      >
                        {app?.name}
                      </span>
                      <button
                        onClick={() => del(p.id)}
                        className="cursor-pointer border-none bg-transparent px-1 text-xs text-fg-faint hover:text-danger"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="my-1 text-sm font-medium text-fg">
                      {p.name}
                    </div>
                    <div className="h-[5px] overflow-hidden rounded bg-panel2">
                      <div
                        className="h-full rounded transition-[width] duration-300"
                        style={{
                          width: `${p.progress}%`,
                          background: col.color,
                        }}
                      />
                    </div>
                    <div className="mt-2 flex justify-between text-[11px] text-fg-dim">
                      <span>
                        {fmtDate(p.start)}→{fmtDate(p.end)}
                      </span>
                      <span>
                        {doneN}/{tn.length} att.
                      </span>
                    </div>
                    {p.ownerName && (
                      <div className="mt-1.5 text-[11px] text-fg-dim">
                        <span className="mr-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-accent-dim align-middle text-[9px] text-accent">
                          {p.ownerName[0]}
                        </span>
                        {p.ownerName}
                      </div>
                    )}
                    <Link
                      href={`/board?appId=${p.appId}&projectId=${p.id}`}
                      className="mt-2 block cursor-pointer text-left text-xs text-accent"
                    >
                      Open tasks →
                    </Link>
                  </div>
                );
              })}
              {!items.length && (
                <div className="py-4 text-center text-xs text-fg-faint">—</div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-3 text-xs text-fg-faint">
        Drag cards between columns to change status.
      </div>
    </div>
  );
}
