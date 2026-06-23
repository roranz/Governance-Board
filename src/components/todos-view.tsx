"use client";

import { useState, useTransition } from "react";
import type { Todo } from "@/lib/types";
import { fmtDate } from "@/lib/utils";
import {
  clearDoneTodos,
  createTodo,
  deleteTodo,
  setTodoDone,
} from "@/actions/todos";

export function TodosView({ todos }: { todos: Todo[] }) {
  const [text, setText] = useState("");
  const [drag, setDrag] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const add = () => {
    if (!text.trim()) return;
    startTransition(async () => {
      await createTodo(text);
      setText("");
    });
  };
  const setDone = (id: string, done: boolean) =>
    startTransition(() => setTodoDone(id, done));
  const del = (id: string) => startTransition(() => deleteTodo(id));
  const clearDone = () => startTransition(() => clearDoneTodos());

  const todo = todos.filter((t) => t.status !== "done");
  const done = todos.filter((t) => t.status === "done");

  const Item = ({ t, isDone }: { t: Todo; isDone: boolean }) => (
    <li
      draggable
      onDragStart={() => setDrag(t.id)}
      onDragEnd={() => {
        setDrag(null);
        setOver(null);
      }}
      className="flex cursor-grab items-center gap-2.5 border-b border-edge px-1.5 py-2"
      style={{ opacity: drag === t.id ? 0.4 : 1 }}
    >
      <span
        title="Drag"
        className="flex-shrink-0 cursor-grab text-[13px] text-fg-faint"
      >
        ⠿
      </span>
      <span
        className="min-w-0 flex-1 text-sm"
        style={{
          color: isDone ? "var(--color-fg-faint)" : "var(--color-fg)",
          textDecoration: isDone ? "line-through" : "none",
        }}
      >
        {t.text}
      </span>
      <span
        title="Data inserimento"
        className="w-[88px] flex-shrink-0 text-right text-[11.5px] text-fg-dim"
      >
        {t.createdAt ? fmtDate(t.createdAt) : "—"}
      </span>
      <span
        title="Data completamento"
        className="w-[88px] flex-shrink-0 text-right text-[11.5px]"
        style={{
          color: isDone ? "var(--color-st-done)" : "var(--color-fg-faint)",
        }}
      >
        {t.completedAt ? fmtDate(t.completedAt) : "—"}
      </span>
      <button
        onClick={() => del(t.id)}
        className="cursor-pointer border-none bg-transparent px-1.5 py-0.5 text-[13px] text-fg-faint hover:text-danger"
      >
        ✕
      </button>
    </li>
  );

  const ColHead = () => (
    <li className="flex list-none items-center gap-2.5 border-b border-edge px-1.5 pb-1.5">
      <span className="w-[13px] flex-shrink-0" />
      <span className="flex-1 text-[10.5px] uppercase tracking-wide text-fg-faint">
        Tasks
      </span>
      <span className="w-[88px] flex-shrink-0 text-right text-[10.5px] uppercase tracking-wide text-fg-faint">
        Created
      </span>
      <span className="w-[88px] flex-shrink-0 text-right text-[10.5px] uppercase tracking-wide text-fg-faint">
        Completed
      </span>
      <span className="w-[22px] flex-shrink-0" />
    </li>
  );

  const dropProps = (target: "todo" | "done") => ({
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      setOver(target);
    },
    onDragLeave: () => setOver((o) => (o === target ? null : o)),
    onDrop: () => {
      if (drag) setDone(drag, target === "done");
      setDrag(null);
      setOver(null);
    },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <h2 className="my-1 text-base font-semibold text-fg">My tasks</h2>
        <span className="text-[13px] text-fg-dim">{todo.length} to do</span>
      </div>
      <div className="mb-3 text-xs text-fg-faint">
        Quick notes not yet linked to a project. Move an item by dragging it
        between "To do" and "Completed tasks".
      </div>

      <div className="mb-4 rounded-xl border border-edge bg-panel p-4">
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-lg border border-edge bg-panel2 px-3 py-2 text-[13.5px] text-fg"
            placeholder="Add a task…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
          <button
            onClick={add}
            className="cursor-pointer rounded-lg border-none bg-accent px-4 py-2 text-sm font-medium text-bg"
          >
            Add
          </button>
        </div>
      </div>

      <div className="mb-2 mx-0.5 text-[13px] font-semibold text-fg">
        To do{" "}
        <span className="rounded-xl bg-panel2 px-2 py-0.5 text-[11px] text-fg-dim">
          {todo.length}
        </span>
      </div>
      <div
        {...dropProps("todo")}
        className="min-h-[56px] rounded-xl border border-edge bg-panel p-4"
        style={{
          outline: over === "todo" ? "2px dashed var(--color-accent)" : "none",
        }}
      >
        <ul className="m-0 list-none p-0">
          {todo.length > 0 && <ColHead />}
          {todo.map((t) => (
            <Item key={t.id} t={t} isDone={false} />
          ))}
        </ul>
        {!todo.length && (
          <div className="py-2 text-[13px] text-fg-faint">
            Niente to do. Scrivi qui sopra per aggiungere.
          </div>
        )}
      </div>

      <div className="mx-0.5 my-4 flex items-center justify-between">
        <span className="text-[13px] font-semibold text-st-done">
          Completed tasks{" "}
          <span className="rounded-xl bg-panel2 px-2 py-0.5 text-[11px] text-fg-dim">
            {done.length}
          </span>
        </span>
        {done.length > 0 && (
          <button
            onClick={clearDone}
            className="cursor-pointer border-none bg-transparent text-xs text-fg-dim hover:text-danger"
          >
            Clear
          </button>
        )}
      </div>
      <div
        {...dropProps("done")}
        className="min-h-[56px] rounded-xl border border-edge bg-panel p-4"
        style={{
          outline: over === "done" ? "2px dashed var(--color-st-done)" : "none",
        }}
      >
        <ul className="m-0 list-none p-0">
          {done.length > 0 && <ColHead />}
          {done.map((t) => (
            <Item key={t.id} t={t} isDone={true} />
          ))}
        </ul>
        {!done.length && (
          <div className="py-2 text-[13px] text-fg-faint">
            Drag completed tasks here.
          </div>
        )}
      </div>
    </div>
  );
}
