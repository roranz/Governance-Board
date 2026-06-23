"use client";

import { useRef, useState, useTransition } from "react";
import { importSnapshot } from "@/actions/snapshot";

export function Header() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const onFile = (file: File | undefined) => {
    if (!file) return;
    setLoadError(null);
    const fd = new FormData();
    fd.append("file", file);
    startTransition(async () => {
      try {
        await importSnapshot(fd);
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : "Errore");
      }
    });
  };

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 px-1 pb-3.5 pt-5">
      <div className="flex items-center gap-3">
        <div className="flex h-[38px] w-[38px] items-center justify-center rounded-lg bg-accent text-[15px] font-bold text-bg">
          GB
        </div>
        <div>
          <div className="text-[19px] font-semibold text-fg">Governance Board</div>
          <div className="mt-px text-xs text-fg-dim">Tasks · Projects · Applications</div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(e) => {
            onFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <a
          href="/api/snapshot"
          className="cursor-pointer rounded-lg bg-accent px-3.5 py-2 text-[13px] font-semibold text-bg hover:opacity-90"
          title="Scarica i dati come file .json"
        >
          💾 Save
        </a>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={isPending}
          className="cursor-pointer rounded-lg border border-edge-hi bg-transparent px-3.5 py-2 text-[13px] font-medium text-fg hover:border-accent disabled:opacity-50"
          title="Carica uno snapshot .json"
        >
          {isPending ? "⏳ Loading…" : "📂 Load"}
        </button>
        <a
          href="/api/report"
          target="_blank"
          rel="noreferrer"
          className="cursor-pointer rounded-lg border border-accent px-3.5 py-2 text-[13px] font-medium text-accent hover:bg-accent-dim"
          title="Apri il report HTML (stampabile in PDF)"
        >
          ↧ Print report
        </a>
        <div className="rounded-lg border border-edge bg-panel px-3.5 py-2 text-right">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-accent">
            Today
          </div>
          <div className="mt-0.5 text-[13px] capitalize text-fg">{today}</div>
        </div>
      </div>
      {loadError && (
        <div className="basis-full rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
          Load failed: {loadError}
        </div>
      )}
    </header>
  );
}
