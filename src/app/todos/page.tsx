import { getAppState } from "@/lib/queries";
import { TodosView } from "@/components/todos-view";

export default async function TodosPage() {
  const state = await getAppState();
  return <TodosView todos={state.todos} />;
}
