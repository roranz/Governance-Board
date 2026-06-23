import { getAppState } from "@/lib/queries";
import { buildReportHTML } from "@/lib/report-html";

export async function GET() {
  const state = await getAppState();
  const html = buildReportHTML(state);
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
