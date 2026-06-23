"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function recalcProject(projectId: string) {
  const tasks = await prisma.task.findMany({ where: { projectId } });
  if (!tasks.length) return;
  const progress = Math.round(
    (tasks.filter((t) => t.status === "done").length / tasks.length) * 100,
  );
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return;
  const data: { progress: number; status?: string } = { progress };
  if (progress === 100) data.status = "Completato";
  else if (progress > 0 && project.status === "Pianificato")
    data.status = "In corso";
  await prisma.project.update({ where: { id: projectId }, data });
}

export async function createTask(
  projectId: string,
  name: string,
  status: string,
  ownerName: string,
) {
  if (!projectId || !name.trim()) return;
  await prisma.task.create({
    data: {
      projectId,
      name: name.trim(),
      status,
      ownerName: ownerName || "Team",
      due: "",
    },
  });
  await recalcProject(projectId);
  revalidatePath("/", "layout");
}

export async function moveTask(id: string, status: string) {
  const t = await prisma.task.update({ where: { id }, data: { status } });
  await recalcProject(t.projectId);
  revalidatePath("/", "layout");
}

export async function setTaskOwner(id: string, ownerName: string) {
  await prisma.task.update({ where: { id }, data: { ownerName } });
  revalidatePath("/", "layout");
}

export async function deleteTask(id: string) {
  const t = await prisma.task.delete({ where: { id } });
  await recalcProject(t.projectId);
  revalidatePath("/", "layout");
}
