# Credential-Free Local Database Implementation Plan

> **For agentic workers:** Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` only after the user chooses an execution mode. Beads is the sole progress tracker; the numbered steps below are executable instructions, not a second task system.

**Goal:** Make normal StrengthSync development use a loopback-only Docker PostgreSQL database, remove every persistent local Render database URL, guard every package-level Prisma mutation, and block future PostgreSQL credential commits.

**Architecture:** PostgreSQL is the only Docker Compose service. Next.js, Prisma, and the local PostgreSQL MCP server run on the host and connect to `127.0.0.1`. Production application traffic stays on Render's private network, while human production diagnostics use authenticated `render psql` sessions. A shared fail-closed guard protects local database commands, and a dependency-free scanner protects repository and staged content.

**Tech Stack:** Node.js 20, Next.js 15, Prisma 6, PostgreSQL 15, Docker Compose v5, Node's built-in `node:test`, Git hooks, Render CLI.

## Global Constraints

- Follow the approved design in `history/2026-07-13-credential-free-local-database-design.md`.
- Beads is canonical. Search before creating an issue, use `--json`, claim before editing, close after verification, and commit Beads state separately from source phases.
- Each source phase changes at most five files and stops for explicit user approval before the next phase.
- Before each edit, re-read the target file. After each edit, re-read it and inspect `git diff -- <file>`.
- Use `apply_patch` for every file creation or content edit. Do not overwrite ignored files wholesale when a targeted patch will preserve unrelated local secrets.
- Never print, copy, reconstruct, or pass the Render PostgreSQL URL through local commands.
- Never scan or rewrite Git history in this work. The exposed credential was already revoked; the prevention layer scans current tracked or staged content.
- Do not mutate Render's `0.0.0.0/0` external allowlist until the user supplies and approves a trusted stable CIDR.
- Keep `.env` and `.mcp.json` ignored and mode `0600`.
- Use local disposable values only:

```text
POSTGRES_USER=strengthsync_local
POSTGRES_PASSWORD=strengthsync_local_dev
POSTGRES_DB=strengthsync_local
POSTGRES_PORT=5432
DATABASE_URL=postgresql://strengthsync_local:strengthsync_local_dev@127.0.0.1:5432/strengthsync_local
```

- Do not add mock application records. `prisma/seed.ts` remains the source of truth and must seed exactly 4 domains, 34 themes, and 20 badges, with 0 organizations and 0 users.
- A phase is not complete until its tests pass. Final completion additionally requires `npx tsc --noEmit`, `ESLINT_USE_FLAT_CONFIG=false npx eslint . --quiet`, and `npm run build`.
- Push and deployment are separate, explicit approval gates. Do not push merely because a phase commit exists.

---

## Existing Beads work items

**Files:** Beads state only; no source file.

The planning session searched before creating these implementation issues:

- Phase 1: `strengthsync-e2b` — Build local database safety foundation
- Phase 2: `strengthsync-kdx` — Move local configuration to Docker PostgreSQL
- Phase 3: `strengthsync-she` — Add PostgreSQL secret prevention controls
- Phase 4: `strengthsync-b0z` — Verify credential-free database workflow

All four are linked to epic `strengthsync-6a1`.

### Step 1: Load and verify Beads at execution start

Run:

```bash
bd prime
bd ready --json
bd show strengthsync-e2b --json
bd show strengthsync-kdx --json
bd show strengthsync-she --json
bd show strengthsync-b0z --json
```

Expected: all four implementation issues are open and ready for their approval-gated phases. Do not create duplicates.

---

# Phase 1: Local database safety foundation

**Approval gate:** Start only after explicit Phase 1 approval.

**Files (exactly five):**

- Create: `scripts/assert-local-database.test.mjs`
- Create: `scripts/assert-local-database.mjs`
- Create: `.env.example`
- Modify: `docker-compose.yml`
- Modify: `package.json`

## Task 1: Claim the Phase 1 Beads issue

### Step 1: Claim outside the source phase

Run `bd update strengthsync-e2b --status in_progress --json`, replace the matching line in `.beads/issues.jsonl` from `bd export --jsonl` without accepting an unrelated full-file rewrite, and commit only Beads state:

```bash
bd dolt commit -m "Start local database safety foundation"
git add .beads/issues.jsonl .beads/interactions.jsonl
git commit -m "Start local database safety foundation"
```

Expected: the source worktree is clean before the first source edit.

## Task 2: Write the local guard tests first

### Step 1: Re-read context and create the failing test

Read `package.json` and confirm there is no existing Node test framework. Create `scripts/assert-local-database.test.mjs` with this behavior:

```js
import assert from "node:assert/strict";
import test from "node:test";

import {
  LocalDatabaseSafetyError,
  assertConfirmation,
  assertLocalDatabaseUrl,
} from "./assert-local-database.mjs";

const acceptedUrls = [
  "postgresql://strengthsync_local:strengthsync_local_dev@localhost:5432/strengthsync_local",
  "postgres://strengthsync_local:strengthsync_local_dev@127.0.0.1:5432/strengthsync_local",
  "postgresql://strengthsync_local:strengthsync_local_dev@[::1]:5432/strengthsync_local",
];

const remotePostgresqlUrl = (authorityAndPath) =>
  ["postgres", "ql://", authorityAndPath].join("");

for (const databaseUrl of acceptedUrls) {
  test(`accepts loopback database URL: ${new URL(databaseUrl).hostname}`, () => {
    assert.equal(assertLocalDatabaseUrl(databaseUrl).hostname, new URL(databaseUrl).hostname);
  });
}

const rejectedUrls = [
  undefined,
  "",
  "not-a-url",
  "mysql://user:secret@127.0.0.1:3306/strengthsync",
  remotePostgresqlUrl("user:secret@db:5432/strengthsync"),
  remotePostgresqlUrl("user:secret@10.0.0.5:5432/strengthsync"),
  remotePostgresqlUrl("user:secret@192.168.1.5:5432/strengthsync"),
  remotePostgresqlUrl("user:secret@dpg-example-a.oregon-postgres.render.com:5432/strengthsync"),
  remotePostgresqlUrl("user:secret@dpg-example-a:5432/strengthsync"),
];

for (const databaseUrl of rejectedUrls) {
  test(`rejects unsafe database URL: ${databaseUrl ? "provided" : "missing"}`, () => {
    assert.throws(() => assertLocalDatabaseUrl(databaseUrl), LocalDatabaseSafetyError);
  });
}

test("redacts credentials from validation errors", () => {
  const databaseUrl = remotePostgresqlUrl(
    "sensitive-user:sensitive-password@db.example.com:5432/strengthsync"
  );
  assert.throws(
    () => assertLocalDatabaseUrl(databaseUrl),
    (error) => {
      assert.ok(error instanceof LocalDatabaseSafetyError);
      assert.equal(error.message.includes("sensitive-user"), false);
      assert.equal(error.message.includes("sensitive-password"), false);
      assert.equal(error.message.includes(databaseUrl), false);
      assert.equal(error.message.includes("db.example.com"), true);
      return true;
    }
  );
});

test("requires the exact destructive confirmation flag", () => {
  assert.doesNotThrow(() =>
    assertConfirmation(["--confirm-local-reset"], "--confirm-local-reset")
  );
  assert.throws(
    () => assertConfirmation([], "--confirm-local-reset"),
    LocalDatabaseSafetyError
  );
  assert.throws(
    () => assertConfirmation(["--confirm-local-destroy"], "--confirm-local-reset"),
    LocalDatabaseSafetyError
  );
});
```

### Step 2: Run the test and observe the intended failure

Run:

```bash
node --test scripts/assert-local-database.test.mjs
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `scripts/assert-local-database.mjs`. A syntax error or unrelated failure is not the intended red state and must be corrected before continuing.

## Task 3: Implement the local database guard

### Step 1: Create the smallest complete guard

Create `scripts/assert-local-database.mjs`. It must export the three interfaces used by the tests and implement the following actions:

```js
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
```

Do not add the raw URL to any error or log path.

### Step 2: Run the unit test

Run:

```bash
node --test scripts/assert-local-database.test.mjs
```

Expected: all tests PASS.

## Task 4: Replace Compose with one loopback database service

### Step 1: Rewrite `docker-compose.yml`

Replace the existing multi-service file with:

```yaml
name: strengthsync-local

services:
  db:
    image: postgres:15-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:?Set POSTGRES_USER in the Compose environment file}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD in the Compose environment file}
      POSTGRES_DB: ${POSTGRES_DB:?Set POSTGRES_DB in the Compose environment file}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "127.0.0.1:${POSTGRES_PORT:?Set POSTGRES_PORT in the Compose environment file}:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB"]
      interval: 2s
      timeout: 5s
      retries: 15

volumes:
  postgres_data:
    name: strengthsync-local-postgres-data
```

This deliberately removes `version`, `app`, `migrate`, the custom network, all-interface port publishing, and production wording.

### Step 2: Create `.env.example`

Use this tracked local-development template:

```dotenv
# Disposable local PostgreSQL used by Docker Compose, Prisma, and local MCP.
POSTGRES_USER=strengthsync_local
POSTGRES_PASSWORD=strengthsync_local_dev
POSTGRES_DB=strengthsync_local
POSTGRES_PORT=5432
DATABASE_URL=postgresql://strengthsync_local:strengthsync_local_dev@127.0.0.1:5432/strengthsync_local

# Local application configuration.
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=local-development-only-secret

# Optional integrations. Leave empty until a local workflow needs them.
OPENAI_API_KEY=
OPENAI_ORG_ID=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_S3_BUCKET=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
TEAMS_WEBHOOK_URL=
MICROSOFT_APP_ID=
MICROSOFT_APP_PASSWORD=
MICROSOFT_APP_TENANT_ID=
CRON_SECRET=
```

### Step 3: Validate Compose before package integration

Run:

```bash
docker compose --env-file .env.example config --quiet
docker compose --env-file .env.example config
```

Expected: exit 0, no obsolete-version warning, one `db` service, and a `127.0.0.1` published host IP. Inspect output for configuration only; it contains disposable local values.

## Task 5: Guard every package-level database mutation

### Step 1: Update only the `scripts` object in `package.json`

Preserve every dependency and replace the script object with this exact target:

```json
{
  "dev": "next dev --turbo",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "type-check": "tsc --noEmit",
  "postinstall": "prisma generate",
  "db:generate": "prisma generate",
  "db:push": "node --env-file=.env scripts/assert-local-database.mjs push",
  "db:migrate": "node --env-file=.env scripts/assert-local-database.mjs migrate",
  "db:seed": "node --env-file=.env scripts/assert-local-database.mjs seed",
  "db:reset": "node --env-file=.env scripts/assert-local-database.mjs reset",
  "db:local:guard": "node --env-file=.env scripts/assert-local-database.mjs guard",
  "db:local:up": "docker compose --env-file .env.example up -d --wait --wait-timeout 60 db",
  "db:local:setup": "node --env-file=.env scripts/assert-local-database.mjs setup",
  "db:local:reset": "node --env-file=.env scripts/assert-local-database.mjs reset",
  "db:local:down": "docker compose --env-file .env.example down",
  "db:local:destroy": "node --env-file=.env scripts/assert-local-database.mjs destroy",
  "db:prod:console": "render psql",
  "test:local-db": "node --test scripts/assert-local-database.test.mjs"
}
```

`db:reset` and `db:local:reset` both require:

```bash
npm run db:local:reset -- --confirm-local-reset
```

`db:local:destroy` requires:

```bash
npm run db:local:destroy -- --confirm-local-destroy
```

### Step 2: Verify package behavior without touching production

Run:

```bash
npm run test:local-db
DATABASE_URL=postgresql://strengthsync_local:strengthsync_local_dev@127.0.0.1:5432/strengthsync_local node scripts/assert-local-database.mjs guard
node --env-file=.env scripts/assert-local-database.mjs guard
```

Expected:

- Unit tests PASS.
- The explicit loopback URL passes.
- The current `.env` still points at the remote replacement user at this phase boundary, so the last command must FAIL safely before invoking Prisma and must print only the rejected hostname. This proves Phase 2 is necessary without exposing the credential.

### Step 3: Review the five-file phase

Run:

```bash
git diff --check
git status --short
git diff --stat
```

Expected: exactly the five Phase 1 source files are changed. No `.env`, `.mcp.json`, README, lockfile, or Beads file is mixed into the source commit.

### Step 4: Commit Phase 1 source

Run:

```bash
git add docker-compose.yml scripts/assert-local-database.mjs scripts/assert-local-database.test.mjs package.json .env.example
git commit -m "Add guarded local PostgreSQL workflow"
```

### Step 5: Close Phase 1 outside the source phase

Run `bd close strengthsync-e2b --reason "Added loopback Compose PostgreSQL and tested guards for all package database mutations" --json`, persist Beads, and create a tracker-only commit:

```bash
bd dolt commit -m "Complete local database safety foundation"
git add .beads/issues.jsonl .beads/interactions.jsonl
git commit -m "Complete local database safety foundation"
```

Stop and request explicit approval for Phase 2. Do not push.

---

# Phase 2: Local configuration, real database integration, and documentation

**Approval gate:** Start only after explicit Phase 2 approval.

**Files (exactly five):**

- Modify ignored local file: `.env`
- Modify ignored local file: `.mcp.json`
- Create tracked file: `.mcp.example.json`
- Modify tracked file: `README.md`
- Modify tracked implementation record: `history/2026-07-13-credential-free-local-database-implementation-plan.md`

**Approved Phase 2 plan amendment:** Review expanded this phase from four to five files so the plan itself records the supported MCP package and final reviewed workflow. The configuration remains within the five-file maximum.

## Task 6: Claim the Phase 2 Beads issue

Claim `strengthsync-kdx` and commit Beads state exactly as in Phase 1. The tracker commit is outside the five-file source/configuration phase.

## Task 7: Remove the Render URL from persistent local configuration

### Step 1: Inspect without printing credentials

Run only hostname-safe checks:

```bash
node --env-file=.env -e 'const value=process.env.DATABASE_URL; const host=value ? new URL(value).hostname : "missing"; console.log(`DATABASE_URL host: ${host}`)'
node -e 'const fs=require("fs"); const value=JSON.parse(fs.readFileSync(".mcp.json","utf8")); const raw=value.mcpServers.postgres.env?.DATABASE_URL; const host=raw ? new URL(raw).hostname : "missing"; console.log("MCP PostgreSQL host: " + host)'
```

Expected before editing: both report a Render host but never print usernames, passwords, or complete URLs.

### Step 2: Patch `.env` in place

Preserve every unrelated local value. Replace only `DATABASE_URL` and add/update these four Compose variables:

```dotenv
POSTGRES_USER=strengthsync_local
POSTGRES_PASSWORD=strengthsync_local_dev
POSTGRES_DB=strengthsync_local
POSTGRES_PORT=5432
DATABASE_URL=postgresql://strengthsync_local:strengthsync_local_dev@127.0.0.1:5432/strengthsync_local
```

Do not copy optional keys from `.env.example` over populated local integration values.

### Step 3: Rewrite `.mcp.json` and add `.mcp.example.json`

Use the pinned `@yawlabs/postgres-mcp@0.6.20` package listed in the official MCP Registry. It is read-only by default: do not set `ALLOW_WRITES`. Pass the local connection through the MCP `env` block, never as a command argument.

Verify the approved package exists:

```bash
npm view @yawlabs/postgres-mcp@0.6.20 version
```

Expected exact output: `0.6.20`.

Both files must contain:

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": [
        "-y",
        "@yawlabs/postgres-mcp@0.6.20"
      ],
      "env": {
        "DATABASE_URL": "postgresql://strengthsync_local:strengthsync_local_dev@127.0.0.1:5432/strengthsync_local"
      }
    }
  }
}
```

### Step 4: Restore ignored-file permissions and prove local-only state

Run:

```bash
chmod 600 .env .mcp.json
ls -l .env .mcp.json
git check-ignore -v .env .mcp.json
node --env-file=.env scripts/assert-local-database.mjs guard
node -e 'const fs=require("fs"); for (const file of [".env",".mcp.json",".env.example",".mcp.example.json"]) { const text=fs.readFileSync(file,"utf8"); if (/\.render\.com|onrender\.com|\bdpg-[a-z0-9-]+/i.test(text)) throw new Error(`remote PostgreSQL host remains in ${file}`); } console.log("local configuration contains no Render PostgreSQL host")'
```

Expected: modes end in `600`; both ignored files are confirmed ignored; guard passes; safe scan prints only the success sentence.

## Task 8: Rewrite the README around the approved workflow

### Step 1: Replace stale setup and Docker sections

Keep the product overview, feature list, CliftonStrengths reference, project structure, license, and contribution content. Make these exact workflow facts explicit:

- Prerequisites: Node.js 20.6 or newer, Docker Desktop with Compose, npm, and Render CLI only for production diagnostics.
- Repository URL: `https://github.com/lcortez-code/strengthsync.git`.
- Configuration command: `cp .env.example .env`.
- Local boot sequence:

```bash
npm install
npm run db:local:up
npm run db:local:setup
npm run dev
```

- Lifecycle and guarded mutation commands:

```bash
npm run db:local:up
npm run db:local:setup
npm run db:migrate
npm run db:seed
npm run db:local:reset -- --confirm-local-reset
npm run db:local:down
npm run db:local:destroy -- --confirm-local-destroy
```

- Production diagnostics:

```bash
render login
npm run db:prod:console
```

- State explicitly that local `.env` and `.mcp.json` must never contain a Render PostgreSQL URL, `render psql` is the only supported local production database path, the seed is reference-only, and application organizations/users must be created through the UI/API.
- State that PostgreSQL publishes only on `127.0.0.1` and the Docker volume is disposable.
- Document `npm run hooks:install` directly as the repository commit-protection setup command.
- Remove PostgreSQL as a host-installed prerequisite, all `docker-compose` syntax, app/migrate Compose instructions, `REDIS_URL`, “future” placeholders, and the misleading “production” label on `prisma migrate dev`.

### Step 2: Verify README claims against commands

Run:

```bash
rg -n "Node.js 20|db:local:up|db:local:setup|db:prod:console|reference-only|127.0.0.1|hooks:install" README.md
rg -n "freeup86|docker-compose|\.env\.local|REDIS_URL|PostgreSQL 14" README.md
```

Expected: the first search finds each new workflow fact. The second search returns no matches.

## Task 9: Prove the reference-only seed against real PostgreSQL

### Step 1: Start and initialize the actual Docker database

Run:

```bash
npm run db:local:up
npm run db:local:setup
docker compose --env-file .env.example ps
docker compose --env-file .env.example port db 5432
```

Expected: `db` is healthy; the published address is `127.0.0.1:5432`; Prisma schema application and seed succeed.

### Step 2: Query the real schema for exact seed counts

Run:

```bash
docker compose --env-file .env.example exec -T db psql -U strengthsync_local -d strengthsync_local -Atc 'SELECT (SELECT count(*) FROM "StrengthDomain"), (SELECT count(*) FROM "StrengthTheme"), (SELECT count(*) FROM "Badge"), (SELECT count(*) FROM "Organization"), (SELECT count(*) FROM "User");'
```

Expected exact output:

```text
4|34|20|0|0
```

Any nonzero organization/user count fails the phase. Do not fix that by changing the expectation; inspect the seed and database volume.

### Step 3: Exercise the destructive safety gates without destroying data

Run:

```bash
npm run db:local:reset
npm run db:local:destroy
```

Expected: both FAIL before changing the database and tell the user which confirmation flag is required. Then prove the database is still healthy:

```bash
docker compose --env-file .env.example ps
```

### Step 4: Review and commit only tracked Phase 2 files

Run:

```bash
git diff --check
git status --short
git diff -- README.md .mcp.example.json history/2026-07-13-credential-free-local-database-implementation-plan.md
git check-ignore .env .mcp.json
git add README.md .mcp.example.json history/2026-07-13-credential-free-local-database-implementation-plan.md
git commit -m "Document credential-free local database setup"
```

Expected: exactly the three approved tracked files are committed; `.env` and `.mcp.json` remain local, ignored, and uncommitted. Close the Phase 2 Beads issue with a tracker-only commit as in Phase 1, then stop for explicit Phase 3 approval. Do not push.

---

# Phase 3: PostgreSQL credential detection and commit protection

**Approval gate:** Start only after explicit Phase 3 approval.

**Files (exactly five):**

- Create: `scripts/check-postgres-secrets.test.mjs`
- Create: `scripts/check-postgres-secrets.mjs`
- Create: `scripts/install-git-hooks.mjs`
- Create: `.githooks/pre-commit`
- Modify: `package.json`

## Task 10: Claim `strengthsync-she`

Run:

```bash
bd update strengthsync-she --status in_progress --json
```

Persist and commit Beads state outside the source phase as described in Phase 1.

## Task 11: Write the PostgreSQL detector tests first

### Step 1: Create the failing detector test

Create `scripts/check-postgres-secrets.test.mjs` with these exact cases:

```js
import assert from "node:assert/strict";
import test from "node:test";

import { formatFindings, scanText } from "./check-postgres-secrets.mjs";

const postgresqlUrl = (authorityAndPath) =>
  ["postgres", "ql://", authorityAndPath].join("");
const postgresUrl = (authorityAndPath) =>
  ["postgres", "://", authorityAndPath].join("");

test("detects a credential-bearing postgresql URL", () => {
  assert.deepEqual(
    scanText(`DATABASE_URL=${postgresqlUrl("service_user:s3cret@db.vendor.test:5432/app")}`, "config.env"),
    [{ filePath: "config.env", line: 1, type: "postgresql-credentials" }]
  );
});

test("detects postgres protocol and percent-encoded credentials", () => {
  assert.deepEqual(
    scanText(postgresUrl("service%40user:p%40ssword@203.0.113.5:5432/app"), "config.txt"),
    [{ filePath: "config.txt", line: 1, type: "postgresql-credentials" }]
  );
});

test("accepts disposable loopback URLs", () => {
  const text = [
    "postgresql://local:local@localhost:5432/app",
    "postgres://local:local@127.0.0.1:5432/app",
    "postgresql://local:local@[::1]:5432/app",
  ].join("\n");
  assert.deepEqual(scanText(text, ".env.example"), []);
});

test("accepts explicit documentation credentials on example hosts", () => {
  assert.deepEqual(
    scanText(postgresqlUrl("user:password@db.example.com:5432/app"), "README.md"),
    []
  );
});

test("reports malformed credential-shaped PostgreSQL URLs", () => {
  assert.deepEqual(
    scanText(postgresqlUrl("service:secret@%invalid-host/app"), "broken.env"),
    [{ filePath: "broken.env", line: 1, type: "malformed-postgresql-credentials" }]
  );
});

test("reports path, line, and type without secret content", () => {
  const text = `safe\n${postgresqlUrl("private_user:private_password@db.vendor.test/app")}`;
  const output = formatFindings(scanText(text, "settings.toml"));
  assert.equal(output, "settings.toml:2 postgresql-credentials");
  assert.equal(output.includes("private_user"), false);
  assert.equal(output.includes("private_password"), false);
});
```

### Step 2: Observe the intended failure

Run:

```bash
node --test scripts/check-postgres-secrets.test.mjs
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `scripts/check-postgres-secrets.mjs`.

## Task 12: Implement dependency-free repository and staged scanning

### Step 1: Implement pure scanning interfaces

Create `scripts/check-postgres-secrets.mjs` with:

- `scanText(text, filePath)` returning only `{ filePath, line, type }` objects.
- `formatFindings(findings)` returning one safe line per finding.
- Candidate matching for both `postgres://` and `postgresql://`.
- Credential shape defined as nonempty username, a password separator, and `@` in the authority.
- Loopback allowlist: `localhost`, `127.0.0.1`, `::1`, `[::1]`.
- Documentation exception only when the host is `example.com` or ends in `.example.com`, username is `user` or `username`, and password is `password`, `example`, or `changeme`.
- `malformed-postgresql-credentials` for credential-shaped candidates that cannot be parsed.
- Repository mode using `git ls-files -z` and current working-tree bytes.
- Staged mode using `git diff --cached --name-only --diff-filter=ACMR -z` and `git show` with the index-qualified path argument so the hook scans the exact index content.
- NUL-containing files treated as binary and skipped.
- UTF-8 decoding through `new TextDecoder("utf-8", { fatal: true })`; unreadable or invalid tracked text fails the scan.
- CLI accepts no argument or only `--staged`; unknown arguments fail.
- Exit 1 on findings or scan errors, exit 0 otherwise.

The implementation must never include the matched candidate in output or thrown error messages. Git command failures may include the Git exit status, but not file content.

Use these constants to keep matching behavior auditable:

```js
const POSTGRES_URL_PATTERN = /\bpostgres(?:ql)?:\/\/[^\s"'`]+/giu;
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
const PLACEHOLDER_HOST = /^(?:[a-z0-9-]+\.)*example\.com$/i;
const PLACEHOLDER_USERS = new Set(["user", "username"]);
const PLACEHOLDER_PASSWORDS = new Set(["password", "example", "changeme"]);
```

Trim only common trailing prose punctuation `)`, `]`, `}`, `,`, `.`, and `;` before parsing. Determine line number from the match offset rather than including a source excerpt.

### Step 2: Run tests and the repository scan

Run:

```bash
node --test scripts/check-postgres-secrets.test.mjs
node scripts/check-postgres-secrets.mjs
node scripts/check-postgres-secrets.mjs --staged
```

Expected: all tests PASS and both scans exit 0 without printing file content.

## Task 13: Install repository-local commit protection

### Step 1: Create the hook installer

Create `scripts/install-git-hooks.mjs` using `spawnSync` with `shell: false` to:

1. run `git config --local core.hooksPath .githooks`;
2. run `chmodSync(".githooks/pre-commit", 0o755)`;
3. fail nonzero with a concise error if either operation fails;
4. print `Installed repository hooks from .githooks.` on success.

It must not read or modify global Git configuration.

### Step 2: Create `.githooks/pre-commit`

Use:

```sh
#!/bin/sh
set -eu

npm run security:secrets -- --staged
```

Set executable mode with `chmod 755 .githooks/pre-commit`.

### Step 3: Add Phase 3 package scripts

Preserve the Phase 1 scripts and add:

```json
{
  "test:security": "node --test scripts/assert-local-database.test.mjs scripts/check-postgres-secrets.test.mjs",
  "security:secrets": "node scripts/check-postgres-secrets.mjs",
  "hooks:install": "node scripts/install-git-hooks.mjs"
}
```

### Step 4: Install and verify the local hook

Run:

```bash
npm run hooks:install
git config --local --get core.hooksPath
npm run test:security
npm run security:secrets
sh .githooks/pre-commit
```

Expected: hooks path is exactly `.githooks`; tests and scans pass; the hook invokes the staged scanner.

### Step 5: Review and commit the five-file source phase

Run:

```bash
git diff --check
git status --short
git diff --stat
```

Expected: exactly the five Phase 3 files are changed and no Beads file is mixed in.

Run:

```bash
git add scripts/check-postgres-secrets.mjs scripts/check-postgres-secrets.test.mjs scripts/install-git-hooks.mjs .githooks/pre-commit package.json
git commit -m "Block PostgreSQL credentials before commit"
```

The pre-commit hook must run and pass during this commit. Close `strengthsync-she` with reason `Added tested PostgreSQL DSN scanning for tracked and staged content with a repository-local pre-commit hook`, persist Beads, and commit only Beads state. Stop for explicit Phase 4 approval. Do not push.

---

# Phase 4: Full verification, push, deployment, and production observation

**Approval gate:** Start verification after explicit Phase 4 approval. Push and deployment still require their own explicit approval if not already included in that response.

**Planned source files:** none.

## Task 14: Claim the verification issue

Claim `strengthsync-b0z` and persist it in a tracker-only commit before running verification.

## Task 15: Run the complete local quality gates

### Step 1: Security and configuration tests

Run:

```bash
npm run test:security
npm run security:secrets
npm run security:secrets -- --staged
npm run db:local:guard
docker compose --env-file .env.example config --quiet
```

Expected: all exit 0 with no secret findings or Compose warnings.

### Step 2: Rebuild the real local database from zero

Run:

```bash
npm run db:local:destroy -- --confirm-local-destroy
npm run db:local:up
npm run db:local:setup
docker compose --env-file .env.example ps
docker compose --env-file .env.example port db 5432
docker compose --env-file .env.example exec -T db psql -U strengthsync_local -d strengthsync_local -Atc 'SELECT (SELECT count(*) FROM "StrengthDomain"), (SELECT count(*) FROM "StrengthTheme"), (SELECT count(*) FROM "Badge"), (SELECT count(*) FROM "Organization"), (SELECT count(*) FROM "User");'
```

Expected: healthy database, loopback-only port, exact count `4|34|20|0|0`.

### Step 3: Run required application gates

Keep the local database running, then run:

```bash
npx tsc --noEmit
ESLINT_USE_FLAT_CONFIG=false npx eslint . --quiet
npm run build
```

Expected: all exit 0. Fix every reported error within a newly approved phase if a fix would touch source files; do not improvise past the five-file approval boundary.

### Step 4: Fresh-eyes local walkthrough

Run the documented sequence from a clean shell:

```bash
npm run db:local:down
npm run db:local:up
npm run db:local:setup
npm run dev
```

Verify as a new developer:

1. the server starts without a Render hostname;
2. registration creates the first real local organization/user through the UI;
3. seeded themes and badges are visible where the authenticated UI exposes them;
4. stopping and restarting Compose preserves local data;
5. `db:local:destroy` requires confirmation and is clearly documented.

This walkthrough intentionally creates real local application records through the UI. Afterward, destroy and recreate the volume, then re-run the exact `4|34|20|0|0` reference-only count before final reporting.

## Task 16: Inspect repository state before any push

Run:

```bash
git status --short --branch
git log --oneline --decorate -10
git diff --check
git rev-list --left-right --count origin/main...HEAD
bd dolt commit -m "Session close"
bd dolt remote list --json
```

Expected: no uncommitted source or Beads changes, no unexpected files, and only the reviewed commits ahead of `origin/main`. If a Beads remote is configured, run `bd dolt push`; otherwise no Beads remote sync is required.

Present the exact commit list and request push approval if it has not already been granted.

## Task 17: Push and observe Render only after approval

### Step 1: Push the reviewed branch

Run:

```bash
git push origin main
git rev-list --left-right --count origin/main...HEAD
```

Expected: push succeeds and the count is `0 0`.

### Step 2: Observe the deployment

Run with network access:

```bash
render services -o json
```

Identify the existing StrengthSync web service from current Render output. Observe its deployment in the Render dashboard or CLI until it reaches the successful live state. Do not create a new service and do not change any environment variables or IP allowlist entries.

### Step 3: Verify production without a local production URL

Set `SERVICE_URL` to the current public URL returned by Render service metadata, then run:

```bash
curl -fsS -o /dev/null -w '%{http_code}\n' "$SERVICE_URL/"
PROBE_EMAIL="db-probe-$(uuidgen | tr '[:upper:]' '[:lower:]')@invalid.example"
curl -fsS -X POST "$SERVICE_URL/api/auth/forgot-password" -H 'content-type: application/json' --data "{\"email\":\"$PROBE_EMAIL\"}"
render psql -- -Atc 'SELECT 1;'
```

Expected:

- root returns `200`;
- the forgot-password endpoint returns a success envelope after a real `User.findUnique` lookup, creates no record, and sends no mail because the unique `.invalid` address cannot exist legitimately;
- authenticated Render PostgreSQL returns `1`;
- no local file or environment variable receives the production URL.

Inspect recent web-service logs for the deployment and probe. There must be no database connection, Prisma, migration, or 5xx errors. The expected “no user found” probe log is informational.

## Task 18: Close verification and report the remaining allowlist gate

Close the verification issue and then the epic only if every acceptance criterion except the separately gated allowlist mutation is satisfied. Use explicit reasons and persist Beads:

```bash
bd close strengthsync-b0z --reason "Passed security, Docker PostgreSQL, seed, type, lint, build, Git, deployment, and production diagnostics verification" --json
bd close strengthsync-6a1 --reason "Local development is credential-free; production diagnostics use authenticated Render CLI; prevention and verification are complete" --json
bd dolt commit -m "Session close"
bd dolt remote list --json
```

If a Beads remote exists, run `bd dolt push`. Commit any final Beads JSONL change in a tracker-only Git commit, push it only with approval, and confirm `origin/main...HEAD` is `0 0` after that approved push.

Final report must include:

- files and command surfaces changed;
- exact test, type, lint, build, Compose, seed, scanner, Git, deployment, and production outcomes;
- confirmation that ignored local configuration contains only loopback PostgreSQL;
- confirmation that the production URL was not printed or persisted;
- confirmation that the revoked credential remains unusable from the earlier incident response;
- the unresolved production hardening gate: Render's external allowlist remains `0.0.0.0/0` until the user supplies a trusted stable CIDR.

## Self-review checklist for the implementer

Before claiming completion, compare the result against both perspectives:

- **Perfectionist:** reject any unguarded package-level Prisma mutation, non-loopback port binding, secret-bearing output, undocumented destructive command, scanner false-negative in the specified cases, seeded fake user/org, mixed Beads/source phase, skipped quality gate, or claimed allowlist fix without a trusted CIDR.
- **Pragmatist:** accept the dependency-free guard/scanner and explicit Render CLI boundary because they solve the incident class without introducing a secret broker or changing application architecture.

If these perspectives disagree because of an actual test failure or source change outside the plan, stop and ask for the next phase approval instead of silently expanding scope.
