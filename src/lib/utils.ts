export const fmtDate = (d: string | null | undefined): string =>
  d ? new Date(d + "T00:00:00").toLocaleDateString("en-US", { day: "2-digit", month: "short" }) : "";

export const today = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function workingDays(fromIso: string, toIso: string): number {
  if (!fromIso || !toIso) return 0;
  const a = new Date(fromIso + "T00:00:00");
  const b = new Date(toIso + "T00:00:00");
  if (b < a) return 0;
  let n = 0;
  const c = new Date(a);
  while (c <= b) {
    const wd = c.getDay();
    if (wd !== 0 && wd !== 6) n++;
    c.setDate(c.getDate() + 1);
  }
  return n;
}
