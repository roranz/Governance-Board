"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addOwner(name: string) {
  const v = name.trim();
  if (!v) return;
  const existing = await prisma.owner.findUnique({ where: { name: v } });
  if (existing) return;
  await prisma.owner.create({ data: { name: v } });
  revalidatePath("/", "layout");
}

export async function deleteOwner(name: string) {
  if (name === "Team") return;
  await prisma.$transaction([
    prisma.task.updateMany({ where: { ownerName: name }, data: { ownerName: "Team" } }),
    prisma.project.updateMany({ where: { ownerName: name }, data: { ownerName: "Team" } }),
    prisma.owner.delete({ where: { name } }),
  ]);
  revalidatePath("/", "layout");
}
