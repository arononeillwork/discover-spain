// Second half of `npm run setup` (the first half is `npm run db:start`).
// Creates .env.local from .env.example if it is missing, then checks it against the running local
// Supabase stack. Plain Node, no dependencies, so it works the same on macOS, Linux and Windows.
import { copyFileSync, existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const example = join(root, ".env.example");
const local = join(root, ".env.local");

/** Parses KEY=value / KEY="value" lines; ignores comments and blank lines. */
function parseEnv(text) {
  const env = {};
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (match) env[match[1]] = match[2].replace(/^(["'])(.*)\1$/, "$2");
  }
  return env;
}

if (existsSync(local)) {
  console.log("✔ .env.local already exists, leaving it as it is.");
} else {
  copyFileSync(example, local);
  console.log("✔ Created .env.local from .env.example.");
}

// Best effort: compare .env.local with the keys the local stack actually uses.
const status = spawnSync("npx supabase status -o env", { cwd: root, encoding: "utf8", shell: true });
if (status.status === 0) {
  const running = parseEnv(status.stdout);
  const mine = parseEnv(readFileSync(local, "utf8"));
  const mismatches = [
    ["NEXT_PUBLIC_SUPABASE_URL", running.API_URL],
    ["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", running.PUBLISHABLE_KEY],
  ].filter(([name, value]) => value && mine[name] !== value);

  if (mismatches.length === 0) {
    console.log("✔ .env.local matches the running local Supabase stack.");
  } else {
    console.warn("\n⚠ .env.local does not match the running local Supabase stack. Set these in .env.local:");
    for (const [name, value] of mismatches) console.warn(`  ${name}=${value}`);
  }
} else {
  console.warn("⚠ Could not read `supabase status`, so .env.local was not checked. Is the local stack running?");
}

console.log(`
Ready. Next:
  npm run dev              → app on http://localhost:3000
  Supabase Studio          → http://127.0.0.1:54323 (edit content, approve tradespeople)
  Mailpit                  → http://127.0.0.1:54324 (local sign-in emails)`);
