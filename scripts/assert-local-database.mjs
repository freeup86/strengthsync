import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
const POSTGRES_PROTOCOLS = new Set(["postgres:", "postgresql:"]);

export class LocalDatabaseSafetyError extends Error {
  constructor(message) {
    super(message);
    this.name = "LocalDatabaseSafetyError";
  }
}

export function assertLocalDatabaseUrl(rawUrl) {
  if (typeof rawUrl !== "string" || rawUrl.trim() === "") {
    throw new LocalDatabaseSafetyError(
      "DATABASE_URL is required and must point to loopback PostgreSQL."
    );
  }

  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new LocalDatabaseSafetyError(
      "DATABASE_URL is malformed and must point to loopback PostgreSQL."
    );
  }

  if (!POSTGRES_PROTOCOLS.has(parsed.protocol)) {
    throw new LocalDatabaseSafetyError(
      "DATABASE_URL must use the postgres or postgresql protocol."
    );
  }

  const hostname = parsed.hostname.toLowerCase();
  if (!LOOPBACK_HOSTS.has(hostname)) {
    throw new LocalDatabaseSafetyError(
      `DATABASE_URL host "${hostname || "missing"}" is not loopback; local database commands were blocked.`
    );
  }

  return parsed;
}

export function assertConfirmation(args, requiredFlag) {
  if (!args.includes(requiredFlag)) {
    throw new LocalDatabaseSafetyError(
      `Destructive local database command requires ${requiredFlag}.`
    );
  }
}

function run(command, args) {
  const result = spawnSync(command, args, {
    env: process.env,
    stdio: "inherit",
    shell: false,
  });

  if (result.error) {
    throw new LocalDatabaseSafetyError(`${command} could not be started.`);
  }
  if (result.status !== 0) {
    throw new LocalDatabaseSafetyError(`${command} exited with status ${result.status}.`);
  }
}

export function main(args = process.argv.slice(2)) {
  const [action, ...actionArgs] = args;
  assertLocalDatabaseUrl(process.env.DATABASE_URL);

  switch (action) {
    case "guard":
      return;
    case "push":
      run("npx", ["prisma", "db", "push"]);
      return;
    case "migrate":
      run("npx", ["prisma", "migrate", "dev"]);
      return;
    case "seed":
      run("npx", ["tsx", "prisma/seed.ts"]);
      return;
    case "setup":
      run("npx", ["prisma", "db", "push"]);
      run("npx", ["tsx", "prisma/seed.ts"]);
      return;
    case "reset":
      assertConfirmation(actionArgs, "--confirm-local-reset");
      run("npx", ["prisma", "db", "push", "--force-reset"]);
      run("npx", ["tsx", "prisma/seed.ts"]);
      return;
    case "destroy":
      assertConfirmation(actionArgs, "--confirm-local-destroy");
      run("docker", ["compose", "--env-file", ".env.example", "down", "--volumes"]);
      return;
    default:
      throw new LocalDatabaseSafetyError(
        "Expected one database action: guard, push, migrate, seed, setup, reset, or destroy."
      );
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (error) {
    const message =
      error instanceof LocalDatabaseSafetyError
        ? error.message
        : "Local database command failed unexpectedly.";
    console.error(message);
    process.exitCode = 1;
  }
}
