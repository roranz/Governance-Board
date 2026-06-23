"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { AppState } from "@/lib/types";
import { fmtDate, today } from "@/lib/utils";
import {
  createMilestone,
  deleteMilestone,
  toggleMilestone,
} from "@/actions/milestones";

export function MilestonesPanel({ state }: { state: AppState }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [msApp, setMsApp] = useState<string>("all");
  const [form, setForm] = useState({
    projectId: state.projects[0]?.id ?? "",
    name: "",
    date: "",
  });
  const [, startTransition] = useTransition();

  const add = () => {
    if (!form.name.trim() || !form.projectId) return;
    startTransition(async () => {
      await createMilestone(form.projectId, form.name, form.date);
      setForm({
        projectId: state.projects[0]?.id ?? "",
        name: "",
        date: "",
      });
      setAdding(false);
    });
  };
  const toggle = (id: string) => startTransition(() => toggleMilestone(id));
  const del = (id: string) => startTransition(() => deleteMilestone(id));

  const visible = state.milestones.filter(
    (m) =>
      msApp === "all" ||
      state.projects.find((p) => p.id === m.projectId)?.appId === msApp,
  );
  const sorted = [...visible].sort((a, b) => a.date.localeCompare(b.date));
  const t0 = today();

  return (
    <div>
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setMsApp("all")}
            className={
              "cursor-pointer rounded-full border border-edge px-3 py-1 text-[12.5px] " +
              (msApp === "all"
                ? "border-accent bg-accent-dim font-medium text-fg"
                : "bg-panel text-fg-dim hover:text-fg")
            }
          >
            All
          </button>
          {state.apps.map((a) => (
            <button
              key={a.id}
              onClick={() => setMsApp(a.id)}
              className={
                "flex cursor-pointer items-center rounded-full border px-3 py-1 text-[12.5px] " +
                (msApp === a.id
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
        <button
          onClick={() => setAdding(!adding)}
          className="cursor-pointer rounded-lg border-none bg-accent px-3.5 py-2 text-[13px] font-medium text-bg"
        >
          + Milestone
        </button>
      </div>

      {adding && (
        <div className="mb-3.5 rounded-xl border border-edge bg-panel p-4">
          <select
            className="mb-2 w-full rounded-lg border border-edge bg-panel2 px-3 py-2 text-[13.5px] text-fg"
            value={form.projectId}
            onChange={(e) => setForm({ ...form, projectId: e.target.value })}
          >
            {state.projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <input
            className="mb-2 w-full rounded-lg border border-edge bg-panel2 px-3 py-2 text-[13.5px] text-fg"
            placeholder="Milestone name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            type="date"
            className="mb-2 w-full rounded-lg border border-edge bg-panel2 px-3 py-2 text-[13.5px] text-fg"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
          <button
            onClick={add}
            className="cursor-pointer rounded-lg border-none bg-accent px-4 py-2 text-sm font-medium text-bg"
          >
            Save
          </button>
        </div>
      )}

      <div className="rounded-xl border border-edge bg-panel p-4">
        <div className="relative pl-6">
          <div className="absolute top-2 bottom-2 left-1.5 w-0.5 bg-edge" />
          {sorted.map((m) => {
            const proj = state.projects.find((p) => p.id === m.projectId);
            const app = state.apps.find((a) => a.id === proj?.appId);
            const od = !m.done && m.date < t0;
            return (
              <div
                key={m.id}
                className="relative mb-4 flex items-center gap-2.5"
              >
                <div
                  className="absolute h-3 w-3 rounded-full border-2 border-panel"
                  style={{
                    left: -19,
                    background: m.done
                      ? "var(--color-st-done)"
                      : app?.color ?? "var(--color-st-plan)",
                  }}
                />
                <input
                  type="checkbox"
                  checked={m.done}
                  onChange={() => toggle(m.id)}
                  className="h-4 w-4 accent-st-done"
                />
                <div
                  className="min-w-0 flex-1 cursor-pointer"
                  onClick={() =>
                    router.push(
                      `/board?appId=${proj?.appId ?? ""}&projectId=${m.projectId}`,
                    )
                  }
                >
                  <div
                    className="text-sm"
                    style={{
                      color: m.done ? "var(--color-fg-faint)" : "var(--color-fg)",
                      textDecoration: m.done ? "line-through" : "none",
                    }}
                  >
                    {m.name}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium"
                      style={{
                        color: app?.color,
                        background: (app?.color ?? "#888") + "1F",
                        borderColor: (app?.color ?? "#888") + "44",
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: app?.color }}
                      />
                      {app?.name}
                    </span>
                    <span className="text-xs text-fg-dim">{proj?.name}</span>
                  </div>
                </div>
                <span
                  className="flex-shrink-0 text-[13px]"
                  style={{
                    color: od ? "var(--color-danger)" : "var(--color-fg-dim)",
                  }}
                >
                  {fmtDate(m.date)}
                  {od ? " ⚠" : ""}
                </span>
                <button
                  onClick={() => del(m.id)}
                  className="cursor-pointer border-none bg-transparent px-1.5 py-0.5 text-[13px] text-fg-faint hover:text-danger"
                >
                  ✕
                </button>
              </div>
            );
          })}
          {!sorted.length && (
            <div className="py-2 text-[13px] text-fg-faint">No milestones.</div>
          )}
        </div>
      </div>
    </div>
  );
}
