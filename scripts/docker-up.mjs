// `npm run docker:up`: runs `docker compose up --build` with .env.example and then .env.local (if
// it exists) as Compose env files, so the NEXT_PUBLIC_* build args come from the same place as for
// `npm run dev`. Values exported in your shell still win. Extra arguments are passed through,
// e.g. `npm run docker:up -- --detach`.
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envFiles = [".env.example", ".env.local"].filter((file) => existsSync(join(root, file)));

const args = ["compose", ...envFiles.flatMap((file) => ["--env-file", file]), "up", "--build", ...process.argv.slice(2)];
console.log(`> docker ${args.join(" ")}`);

// Ctrl+C reaches Compose directly (same process group); wait for it to stop the containers.
process.on("SIGINT", () => {});

const result = spawnSync("docker", args, { cwd: root, stdio: "inherit" });
if (result.error) {
  console.error(`Could not run docker: ${result.error.message}. Is Docker Desktop installed and running?`);
  process.exit(1);
}
process.exit(result.status ?? 1);
