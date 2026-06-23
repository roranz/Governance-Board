import { createClient } from "@libsql/client";
import { readFileSync, readdirSync, existsSync } from "node:fs";
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

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url) {
  console.error("TURSO_DATABASE_URL non impostata (passare con --env-file=.env)");
  process.exit(1);
}

const migrationsDir = join(process.cwd(), "prisma", "migrations");
const migrations = readdirSync(migrationsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

async function main() {
  const client = createClient({ url: url!, authToken });
  for (const m of migrations) {
    const sqlPath = join(migrationsDir, m, "migration.sql");
    const sql = readFileSync(sqlPath, "utf8");
    const sqlNoComments = sql
      .split(/\r?\n/)
      .filter((line) => !line.trim().startsWith("--"))
      .join("\n");
    const statements = sqlNoComments
      .split(/;\s*(?:\n|$)/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    console.log(`Applying migration ${m} (${statements.length} statements)...`);
    for (const stmt of statements) {
      try {
        await client.execute(stmt);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (/already exists/i.test(message)) {
          console.log(`  skip (already exists): ${stmt.slice(0, 60).replace(/\s+/g, " ")}...`);
        } else {
          throw err;
        }
      }
    }
  }
  console.log("Schema pushed to Turso.");
  client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
