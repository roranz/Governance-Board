"use server";

import { prisma } from "@/lib/prisma";
import { APP_PALETTE } from "@/lib/theme";
import { revalidatePath } from "next/cache";

type SnapshotApp = { id?: string; name: string; desc?: string; color?: string };
type SnapshotProject = {
  id?: string;
  appId: string;
  name: string;
  status?: string;
  start?: string;
  end?: string;
  progress?: number;
  owner?: string;
  ownerName?: string;
  budgetH?: number;
  spentH?: number;
  disabled?: boolean;
};
type SnapshotTask = {
  id?: string;
  projectId: string;
  name: string;
  status?: string;
  owner?: string;
  ownerName?: string;
  due?: string;
};
type SnapshotMilestone = {
  id?: string;
  projectId: string;
  name: string;
  date: string;
  done?: boolean;
};
type SnapshotTodo = {
  id?: string;
  text: string;
  status?: string;
  done?: boolean;
  priority?: string;
  due?: string;
  projectId?: string | null;
  createdAt?: string;
  completedAt?: string;
};
type Snapshot = {
  apps: SnapshotApp[];
  projects: SnapshotProject[];
  tasks?: SnapshotTask[];
  milestones?: SnapshotMilestone[];
  todos?: SnapshotTodo[];
  owners?: string[];
};

export async function importSnapshot(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("File mancante");
  const text = await file.text();
  let data: Snapshot;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("JSON non valido");
  }
  if (!data || !Array.isArray(data.apps) || !Array.isArray(data.projects)) {
    throw new Error("Snapshot non valido: mancano apps/projects");
  }

  await prisma.$transaction(async (tx) => {
    await tx.todo.deleteMany();
    await tx.milestone.deleteMany();
    await tx.task.deleteMany();
    await tx.project.deleteMany();
    await tx.application.deleteMany();
    await tx.owner.deleteMany();

    const owners = new Set<string>(data.owners ?? []);
    owners.add("Team");
    data.projects.forEach((p) => {
      const o = p.ownerName ?? p.owner;
      if (o) owners.add(o);
    });
    data.tasks?.forEach((t) => {
      const o = t.ownerName ?? t.owner;
      if (o) owners.add(o);
    });
    for (const name of owners) {
      await tx.owner.create({ data: { name } });
    }

    const appIdMap = new Map<string, string>();
    for (let i = 0; i < data.apps.length; i++) {
      const a = data.apps[i];
      const created = await tx.application.create({
        data: {
          name: a.name,
          desc: a.desc ?? "",
          color: a.color ?? APP_PALETTE[i % APP_PALETTE.length],
          position: i,
        },
      });
      if (a.id) appIdMap.set(a.id, created.id);
    }

    const projectIdMap = new Map<string, string>();
    for (const p of data.projects) {
      const appId = appIdMap.get(p.appId) ?? p.appId;
      const created = await tx.project.create({
        data: {
          appId,
          name: p.name,
          status: p.status ?? "Pianificato",
          start: p.start ?? "",
          end: p.end ?? "",
          progress: p.progress ?? 0,
          ownerName: p.ownerName ?? p.owner ?? "Team",
          budgetH: p.budgetH ?? 0,
          spentH: p.spentH ?? 0,
          disabled: p.disabled ?? false,
        },
      });
      if (p.id) projectIdMap.set(p.id, created.id);
    }

    for (const t of data.tasks ?? []) {
      const projectId = projectIdMap.get(t.projectId) ?? t.projectId;
      await tx.task.create({
        data: {
          projectId,
          name: t.name,
          status: t.status ?? "todo",
          ownerName: t.ownerName ?? t.owner ?? "Team",
          due: t.due ?? "",
        },
      });
    }

    for (const m of data.milestones ?? []) {
      const projectId = projectIdMap.get(m.projectId) ?? m.projectId;
      await tx.milestone.create({
        data: {
          projectId,
          name: m.name,
          date: m.date,
          done: m.done ?? false,
        },
      });
    }

    for (const td of data.todos ?? []) {
      const status = td.status ?? (td.done ? "done" : "todo");
      const projectId = td.projectId
        ? projectIdMap.get(td.projectId) ?? td.projectId
        : null;
      await tx.todo.create({
        data: {
          text: td.text,
          status,
          priority: td.priority ?? "Media",
          due: td.due ?? "",
          projectId,
          createdAt: td.createdAt ?? "",
          completedAt: td.completedAt ?? "",
        },
      });
    }
  });

  revalidatePath("/", "layout");
}
