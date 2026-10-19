// Runs a command with the variables from an env file (they win over .env.local).
// Used for the staging dev server: node scripts/with-env.mjs .env.staging.local next dev -p 3001
import { spawn } from "node:child_process";

const [file, cmd, ...args] = process.argv.slice(2);
process.loadEnvFile(file);
const bin = cmd === "next" ? ["./node_modules/next/dist/bin/next", ...args] : [cmd, ...args];
const child = spawn(process.execPath, bin, { stdio: "inherit", env: process.env });
child.on("exit", (code) => process.exit(code ?? 0));
