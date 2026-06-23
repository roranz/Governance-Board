import { getAppState } from "@/lib/queries";
import { DashboardMetrics } from "@/components/dashboard/metrics";
import { EventsTimeline } from "@/components/dashboard/events-timeline";
import { TaskDistribution } from "@/components/dashboard/task-distribution";
import { ProjectProgress } from "@/components/dashboard/project-progress";
import { UpcomingLists } from "@/components/dashboard/upcoming-lists";

export default async function DashboardPage() {
  const state = await getAppState();
  return (
    <div>
      <DashboardMetrics state={state} />

      <h2 className="mx-0 mb-3 mt-1 text-base font-semibold text-fg">
        Deadlines timeline
      </h2>
      <EventsTimeline apps={state.apps} projects={state.projects} tasks={state.tasks} milestones={state.milestones} />

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
        <div>
          <h2 className="mx-0 mb-3 mt-1 text-base font-semibold text-fg">
            Task distribution
          </h2>
          <TaskDistribution tasks={state.tasks} />
        </div>
        <div>
          <h2 className="mx-0 mb-3 mt-1 text-base font-semibold text-fg">
            Project progress
          </h2>
          <ProjectProgress apps={state.apps} projects={state.projects} />
        </div>
      </div>

      <UpcomingLists state={state} />
    </div>
  );
}
