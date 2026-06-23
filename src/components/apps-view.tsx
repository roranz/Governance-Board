"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { AppState } from "@/lib/types";
import { today } from "@/lib/utils";
import { createApp, deleteApp } from "@/actions/apps";
import { addOwner, deleteOwner } from "@/actions/owners";

export function AppsView({ state }: { state: AppState }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", desc: "" });
  const [newOwner, setNewOwner] = useState("");
  const [, startTransition] = useTransition();

  const add = () => {
    if (!form.name.trim()) return;
    startTransition(async () => {
      await createApp(form.name, form.desc);
      setForm({ name: "", desc: "" });
      setAdding(false);
    });
  };

  const del = (id: string) => {
    if (!confirm("Delete the application and its projects?")) return;
    startTransition(async () => {
      await deleteApp(id);
    });
  };

  const onAddOwner = () => {
    const v = newOwner.trim();
    if (!v) return;
    startTransition(async () => {
      await addOwner(v);
      setNewOwner("");
    });
  };

  const onDelOwner = (name: string) => {
    startTransition(async () => {
      await deleteOwner(name);
    });
  };

  const t = today();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <h2 className="my-1 text-base font-semibold text-fg">Applications</h2>
        <button
          onClick={() => setAdding(!adding)}
          className="cursor-pointer rounded-lg border-none bg-accent px-3.5 py-2 text-[13px] font-medium text-bg"
        >
          + Application
        </button>
      </div>

      {adding && (
        <div className="mb-3.5 rounded-xl border border-edge bg-panel p-4">
          <input
            className="mb-2 w-full rounded-lg border border-edge bg-panel2 px-3 py-2 text-[13.5px] text-fg"
            placeholder="Name (e.g. CJ CE)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            className="mb-2 w-full rounded-lg border border-edge bg-panel2 px-3 py-2 text-[13.5px] text-fg"
            placeholder="Description"
            value={form.desc}
            onChange={(e) => setForm({ ...form, desc: e.target.value })}
          />
          <button
            onClick={add}
            className="cursor-pointer rounded-lg border-none bg-accent px-4 py-2 text-sm font-medium text-bg"
          >
            Save
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[repeat(auto-fit,minmax(250px,1fr))]">
        {state.apps.map((a) => {
          const projs = state.projects.filter((p) => p.appId === a.id);
          const appTasks = state.tasks.filter((tx) =>
            projs.some((p) => p.id === tx.projectId),
          );
          const taskN = appTasks.length;
          const nTodo = appTasks.filter((tx) => tx.status === "todo").length;
          const nDoing = appTasks.filter((tx) => tx.status === "doing").length;
          const nDone = appTasks.filter((tx) => tx.status === "done").length;
          const nOverdue = appTasks.filter(
            (tx) => tx.due && tx.due < t && tx.status !== "done",
          ).length;
          const pctDone = taskN ? Math.round((nDone / taskN) * 100) : 0;
          return (
            <div
              key={a.id}
              className="rounded-xl border border-edge bg-panel p-4"
              style={{ borderTop: `3px solid ${a.color}` }}
            >
              <div className="flex justify-between">
                <div>
                  <div className="text-base font-medium text-fg">{a.name}</div>
                  <div className="mt-0.5 text-xs text-fg-dim">{a.desc}</div>
                </div>
                <button
                  onClick={() => del(a.id)}
                  className="cursor-pointer border-none bg-transparent px-1.5 py-0.5 text-[13px] text-fg-faint hover:text-danger"
                >
                  ✕
                </button>
              </div>
              <div className="my-3 text-xs text-fg-dim">
                {projs.length} projects · {taskN} tasks
              </div>
              <div className="flex flex-wrap gap-1.5">
                {projs.map((p) => (
                  <Link
                    key={p.id}
                    href={`/board?appId=${a.id}&projectId=${p.id}`}
                    className="cursor-pointer rounded-md border border-edge bg-panel2 px-2 py-1 text-[11px] text-fg-dim hover:border-edge-hi"
                  >
                    {p.name} ↗
                  </Link>
                ))}
              </div>
              <Link
                href={`/projects?appId=${a.id}`}
                className="mt-3 block cursor-pointer border-none bg-transparent text-left text-xs text-accent"
              >
                See projects →
              </Link>

              <div className="mt-3.5 border-t border-edge pt-3">
                <div className="mb-1.5 flex justify-between text-[11px] text-fg-dim">
                  <span>Task completion</span>
                  <span className="text-fg">{pctDone}%</span>
                </div>
                <div className="h-[5px] overflow-hidden rounded bg-panel2">
                  <div
                    className="h-full rounded transition-[width] duration-300"
                    style={{ width: `${pctDone}%`, background: a.color }}
                  />
                </div>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <Pill color="var(--color-st-todo)">{nTodo} to do</Pill>
                  <Pill color="var(--color-st-doing)">{nDoing} in progress</Pill>
                  <Pill color="var(--color-st-done)">{nDone} completed</Pill>
                  {nOverdue > 0 && (
                    <span className="inline-flex items-center rounded-xl bg-[#3A1F22] px-2 py-0.5 text-[11px] font-medium text-danger">
                      ⚠ {nOverdue} overdue
                    </span>
                  )}
                </div>
              </div>

              <Link
                href={`/board?appId=${a.id}`}
                className="mt-3 block cursor-pointer text-left text-xs text-accent"
              >
                Open tasks →
              </Link>
            </div>
          );
        })}
      </div>

      <h2 className="mt-6 mb-3 text-base font-semibold text-fg">Owners</h2>
      <div className="rounded-xl border border-edge bg-panel p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {state.owners.map((o) => (
            <span
              key={o}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-edge bg-panel2 py-1 pl-2.5 pr-1.5 text-[12.5px] text-fg"
            >
              <span className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-accent-dim text-[10px] text-accent">
                {o[0]}
              </span>
              {o}
              {o !== "Team" && (
                <button
                  onClick={() => onDelOwner(o)}
                  className="ml-0.5 cursor-pointer border-none bg-transparent px-0.5 text-xs text-fg-faint hover:text-danger"
                >
                  ✕
                </button>
              )}
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-lg border border-edge bg-panel2 px-3 py-2 text-[13.5px] text-fg"
            placeholder="Add owner…"
            value={newOwner}
            onChange={(e) => setNewOwner(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onAddOwner()}
          />
          <button
            onClick={onAddOwner}
            className="cursor-pointer rounded-lg border-none bg-accent px-4 py-2 text-sm font-medium text-bg"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

function Pill({
  children,
  color,
}: {
  children: React.ReactNode;
  color: string;
}) {
  return (
    <span
      className="inline-flex items-center rounded-xl bg-panel2 px-2 py-0.5 text-[11px] font-medium"
      style={{ color }}
    >
      <span
        className="mr-1.5 inline-block h-2 w-2 rounded-full"
        style={{ background: color }}
      />
      {children}
    </span>
  );
}
