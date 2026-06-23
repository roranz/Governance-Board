"use server";

import { prisma } from "@/lib/prisma";
import { today } from "@/lib/utils";
import { revalidatePath } from "next/cache";

type CreateProjectInput = {
  appId: string;
  name: string;
  start?: string;
  end?: string;
  budgetH?: number;
};

export async function createProject(input: CreateProjectInput) {
  if (!input.name.trim() || !input.appId) return;
  await prisma.project.create({
    data: {
      appId: input.appId,
      name: input.name.trim(),
      status: "Pianificato",
      start: input.start || today(),
      end: input.end || today(),
      progress: 0,
      ownerName: "Team",
      budgetH: input.budgetH ?? 0,
      spentH: 0,
    },
  });
  revalidatePath("/", "layout");
}

export async function deleteProject(id: string) {
  await prisma.project.delete({ where: { id } });
  revalidatePath("/", "layout");
}

export async function moveProject(id: string, status: string) {
  const data: { status: string; progress?: number } = { status };
  if (status === "Completato") data.progress = 100;
  await prisma.project.update({ where: { id }, data });
  revalidatePath("/", "layout");
}

export async function updateProjectHours(
  id: string,
  field: "budgetH" | "spentH",
  value: number,
) {
  await prisma.project.update({
    where: { id },
    data: { [field]: Math.max(0, Math.floor(value)) },
  });
  revalidatePath("/", "layout");
}
