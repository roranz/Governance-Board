import { prisma } from "./prisma";
import type { AppState } from "./types";

export async function getAppState(): Promise<AppState> {
  const [apps, projects, tasks, milestones, todos, owners] = await Promise.all([
    prisma.application.findMany({ orderBy: { position: "asc" } }),
    prisma.project.findMany({ orderBy: { name: "asc" } }),
    prisma.task.findMany({ orderBy: { due: "asc" } }),
    prisma.milestone.findMany({ orderBy: { date: "asc" } }),
    prisma.todo.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.owner.findMany({ orderBy: { name: "asc" } }),
  ]);
  return {
    apps,
    projects,
    tasks,
    milestones,
    todos,
    owners: owners.map((o) => o.name),
  };
}
