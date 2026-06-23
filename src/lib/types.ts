import type {
  Application,
  Owner,
  Project,
  Task,
  Milestone,
  Todo,
} from "@prisma/client";

export type { Application, Owner, Project, Task, Milestone, Todo };

export type AppState = {
  apps: Application[];
  projects: Project[];
  tasks: Task[];
  milestones: Milestone[];
  todos: Todo[];
  owners: string[];
};

export type Nav = {
  appId: string | null;
  projectId: string | null;
};
