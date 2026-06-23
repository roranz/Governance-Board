"use server";

import { prisma } from "@/lib/prisma";
import { today } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function createTodo(text: string) {
  if (!text.trim()) return;
  await prisma.todo.create({
    data: {
      text: text.trim(),
      status: "todo",
      priority: "Media",
      due: "",
      projectId: null,
      createdAt: today(),
      completedAt: "",
    },
  });
  revalidatePath("/todos");
}

export async function setTodoDone(id: string, done: boolean) {
  await prisma.todo.update({
    where: { id },
    data: {
      status: done ? "done" : "todo",
      completedAt: done ? today() : "",
    },
  });
  revalidatePath("/todos");
}

export async function deleteTodo(id: string) {
  await prisma.todo.delete({ where: { id } });
  revalidatePath("/todos");
}

export async function clearDoneTodos() {
  await prisma.todo.deleteMany({ where: { status: "done" } });
  revalidatePath("/todos");
}
