// `npm run db:types`: regenerates src/lib/database.types.ts from the local Supabase schema.
// The file is only replaced when generation succeeds, so running this while the local stack is
// stopped can't overwrite it with an error message. The output is then formatted with oxfmt
// (fetched by npx on first use) to match the committed file. Plain Node, no dependencies.
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const target = join(root, "src", "lib", "database.types.ts");
const OXFMT = "oxfmt@0.71.0";

const gen = spawnSync("npx supabase gen types typescript --local", {
  cwd: root,
  encoding: "utf8",
  shell: true,
  maxBuffer: 64 * 1024 * 1024,
  stdio: ["ignore", "pipe", "inherit"],
});

if (gen.status !== 0 || !gen.stdout.includes("export type Database")) {
  if (gen.stdout.trim()) console.error(gen.stdout.trim());
  console.error("✖ Type generation failed, so src/lib/database.types.ts was left unchanged. Is the local stack running? (npm run db:start)");
  process.exit(1);
}

const dir = mkdtempSync(join(tmpdir(), "discover-spain-types-"));
try {
  const tmp = join(dir, "database.types.ts");
  writeFileSync(tmp, gen.stdout);

  const fmt = spawnSync(`npx --yes ${OXFMT} ${JSON.stringify(tmp)}`, { cwd: root, encoding: "utf8", shell: true, stdio: "inherit" });
  if (fmt.status !== 0) console.warn(`⚠ Formatting with ${OXFMT} failed; writing the unformatted types instead.`);

  writeFileSync(target, readFileSync(tmp));
  console.log("✔ Updated src/lib/database.types.ts");
} finally {
  rmSync(dir, { recursive: true, force: true });
}
