import { getAppState } from "@/lib/queries";
import { today } from "@/lib/utils";

export async function GET() {
  const state = await getAppState();
  const body = JSON.stringify(state, null, 2);
  return new Response(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="governance-data-${today()}.json"`,
    },
  });
}
