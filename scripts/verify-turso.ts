import { createClient } from "@libsql/client";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const envPath = join(process.cwd(), ".env");
if (existsSync(envPath)) {
  const content = readFileSync(envPath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

async function main() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  const res = await client.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
  console.log("Tabelle in Turso:");
  for (const row of res.rows) console.log("  -", row.name);
  client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
