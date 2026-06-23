import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const seed = {
  apps: [
    { id: "cjce", name: "CJ CE", desc: "Customer Journey · Cliente Esistente", color: "#5B8DEF" },
    { id: "reev0", name: "REEV0", desc: "Reportistica Evolutiva", color: "#34D399" },
    { id: "wmcr0", name: "WMCR0", desc: "Wealth Mgmt Change Request", color: "#F0A04B" },
  ],
  projects: [
    { id: "cjonb", appId: "cjce", name: "CJ ONBOARDING", status: "In corso", start: "2026-05-01", end: "2026-07-31", progress: 45, ownerName: "Paolo", budgetH: 320, spentH: 150 },
    { id: "cjrec", appId: "cjce", name: "CJ RECESSO", status: "In corso", start: "2026-06-01", end: "2026-09-15", progress: 20, ownerName: "Paolo", budgetH: 240, spentH: 48 },
    { id: "reevrpt", appId: "reev0", name: "Analisi Patrimonio · Disclaimer", status: "Pianificato", start: "2026-06-15", end: "2026-08-01", progress: 10, ownerName: "Team", budgetH: 120, spentH: 12 },
    { id: "wmcrq3", appId: "wmcr0", name: "WMCR Q3 Change Set", status: "In corso", start: "2026-04-15", end: "2026-07-10", progress: 65, ownerName: "Team", budgetH: 180, spentH: 117 },
  ],
  tasks: [
    { id: "t1", projectId: "cjonb", name: "Analisi requisiti onboarding", status: "done", ownerName: "Team", due: "2026-05-20" },
    { id: "t2", projectId: "cjonb", name: "Sviluppo flusso KYC", status: "doing", ownerName: "Team", due: "2026-06-30" },
    { id: "t3", projectId: "cjonb", name: "Integrazione anagrafica", status: "todo", ownerName: "Team", due: "2026-07-15" },
    { id: "t4", projectId: "cjrec", name: "Mappatura processo recesso", status: "doing", ownerName: "Team", due: "2026-07-01" },
    { id: "t5", projectId: "cjrec", name: "Definizione regole legali", status: "todo", ownerName: "Team", due: "2026-07-20" },
    { id: "t6", projectId: "reevrpt", name: "Adattamento footer/layout", status: "todo", ownerName: "Team", due: "2026-07-05" },
    { id: "t7", projectId: "reevrpt", name: "Test disclaimer multi-scenario", status: "todo", ownerName: "Team", due: "2026-07-18" },
    { id: "t8", projectId: "wmcrq3", name: "Test multi-scenario", status: "doing", ownerName: "Team", due: "2026-06-25" },
    { id: "t9", projectId: "wmcrq3", name: "Coordinamento release", status: "todo", ownerName: "Team", due: "2026-07-08" },
  ],
  milestones: [
    { id: "m1", projectId: "cjonb", name: "Go-live onboarding", date: "2026-07-31", done: false },
    { id: "m2", projectId: "cjrec", name: "UAT recesso", date: "2026-08-20", done: false },
    { id: "m3", projectId: "wmcrq3", name: "Release Q3", date: "2026-07-10", done: false },
    { id: "m4", projectId: "reevrpt", name: "Approvazione disclaimer", date: "2026-07-01", done: false },
  ],
  todos: [
    { id: "td1", text: "Preparare doc giustificazione change request", status: "todo", priority: "Alta", due: "2026-06-16", projectId: "reevrpt", createdAt: "2026-06-10", completedAt: "" },
    { id: "td2", text: "Coordinare release con il team", status: "todo", priority: "Media", due: "2026-07-08", projectId: "wmcrq3", createdAt: "2026-06-12", completedAt: "" },
    { id: "td3", text: "Verbalizzare riunione settimanale", status: "done", priority: "Bassa", due: "", projectId: null, createdAt: "2026-06-05", completedAt: "2026-06-09" },
    { id: "td4", text: "Sollecitare feedback su CJ RECESSO", status: "todo", priority: "Media", due: "", projectId: "cjrec", createdAt: "2026-06-13", completedAt: "" },
  ],
  owners: ["Team", "Paolo"],
};

async function main() {
  await prisma.todo.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.application.deleteMany();
  await prisma.owner.deleteMany();

  for (const o of seed.owners) {
    await prisma.owner.create({ data: { name: o } });
  }
  for (let i = 0; i < seed.apps.length; i++) {
    const a = seed.apps[i];
    await prisma.application.create({ data: { ...a, position: i } });
  }
  for (const p of seed.projects) {
    await prisma.project.create({ data: p });
  }
  for (const t of seed.tasks) {
    await prisma.task.create({ data: t });
  }
  for (const m of seed.milestones) {
    await prisma.milestone.create({ data: m });
  }
  for (const td of seed.todos) {
    await prisma.todo.create({ data: td });
  }
  console.log("Seed completato");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
