"use server";

import { prisma } from "@/lib/prisma";
import { today } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function createMilestone(
  projectId: string,
  name: string,
  date: string,
) {
  if (!projectId || !name.trim()) return;
  await prisma.milestone.create({
    data: { projectId, name: name.trim(), date: date || today(), done: false },
  });
  revalidatePath("/", "layout");
}

export async function toggleMilestone(id: string) {
  const m = await prisma.milestone.findUnique({ where: { id } });
  if (!m) return;
  await prisma.milestone.update({ where: { id }, data: { done: !m.done } });
  revalidatePath("/", "layout");
}

export async function deleteMilestone(id: string) {
  await prisma.milestone.delete({ where: { id } });
  revalidatePath("/", "layout");
}
