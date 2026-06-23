"use server";

import { prisma } from "@/lib/prisma";
import { APP_PALETTE } from "@/lib/theme";
import { revalidatePath } from "next/cache";

export async function createApp(name: string, desc: string) {
  if (!name.trim()) return;
  const count = await prisma.application.count();
  await prisma.application.create({
    data: {
      name: name.trim(),
      desc: desc.trim(),
      color: APP_PALETTE[count % APP_PALETTE.length],
      position: count,
    },
  });
  revalidatePath("/", "layout");
}

export async function deleteApp(id: string) {
  await prisma.application.delete({ where: { id } });
  revalidatePath("/", "layout");
}
