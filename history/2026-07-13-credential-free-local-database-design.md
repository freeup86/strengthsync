# Credential-Free Local Database Development Design

**Status:** Approved
**Date:** 2026-07-13
**Epic:** `strengthsync-6a1`

## Objective

Remove the Render PostgreSQL connection URL from persistent local development files and make normal development use a real, disposable PostgreSQL database running in Docker. Preserve authenticated production diagnostics through the Render CLI without creating a second local path to the production database.

## Context

- GitGuardian detected a live Render PostgreSQL URL committed in `.codex/config.toml`.
- The exposed database user has been revoked and replaced.
- Render and the currently ignored `.env` and `.mcp.json` use the replacement user.
- `docker-compose.yml` already defines PostgreSQL, but it mixes local database, application, and migration services and exposes PostgreSQL on every local interface.
- `prisma/seed.ts` writes only reference domains, themes, and badges. It does not copy or synthesize production organizations, users, or activity.
- The README references a missing `.env.example` and legacy `docker-compose` commands.
- Render CLI supports authenticated `render psql` sessions.
- Neither 1Password CLI nor Doppler CLI is installed, and the approved design intentionally introduces no secret broker.
- Default Gitleaks rules did not detect the leaked PostgreSQL DSN, so repository-specific detection is required.

## Decisions

1. Use Docker PostgreSQL with the Next.js application running directly on the host.
2. Use only loopback database hosts for local application, Prisma, and MCP workflows.
3. Seed only real reference data: domains, themes, and badges.
4. Create development organizations and users through the application UI and API, not through fictional seed records.
5. Use authenticated `render psql` for production diagnostics.
6. Do not store, inject, or reconstruct the Render production database URL in local application or MCP workflows.
7. Add a fail-closed local database guard to every schema-changing or destructive database command.
8. Add repository-specific PostgreSQL credential detection and a pre-commit hook.
9. Do not change the Render external IP allowlist until a trusted stable CIDR is supplied. The current `0.0.0.0/0` rule is a separately gated production operation because guessing a CIDR can lock out authorized diagnostics.

## Scope

### Included

- Local PostgreSQL lifecycle through Docker Compose.
- Loopback-only network exposure.
- Local configuration templates and ignored runtime configuration.
- Guarded Prisma schema, seed, migration, and reset commands.
- Authenticated Render CLI production console access.
- PostgreSQL DSN secret detection for repository and staged content.
- Developer documentation and real-database verification.

### Excluded

- Copying or sanitizing production records into local development.
- Running the local Next.js application against Render PostgreSQL.
- Adding 1Password, Doppler, or another secret broker.
- Replacing Render PostgreSQL with an IAM-authenticated database provider.
- Mutating the Render IP allowlist without a trusted CIDR.
- Changing non-database application secrets or their providers.

## Architecture

### Local data plane

PostgreSQL runs as the only service in `docker-compose.yml`. Its port is published on `127.0.0.1`, its storage uses a named development volume, and its credentials are disposable local defaults. The service health check uses the configured local user and database.

Next.js continues to run on the host with `npm run dev`. Prisma and the local PostgreSQL MCP server read a loopback URL from ignored local configuration. No local process receives a Render PostgreSQL URL.

### Production data plane

Deployed Render services continue to use Render's internal PostgreSQL connection URL. Developers open an interactive production console through `render psql`, which uses Render CLI authentication. There is no package command or fallback that reads a local production connection URL.

### Data flow

```text
Host Next.js / Prisma / local MCP -> 127.0.0.1 -> Docker PostgreSQL
Render services -> Render private network -> Render PostgreSQL
Developer terminal -> Render CLI authentication -> interactive production psql
```

There is no production-to-local data or credential flow.

## Components and interfaces

### Docker PostgreSQL

`docker-compose.yml` will:

- remove the obsolete top-level Compose version;
- contain only the local PostgreSQL service and its named volume;
- publish `127.0.0.1:5432:5432`;
- use explicit local-only defaults for database name, username, and password;
- wait for PostgreSQL readiness through a variable-aware health check;
- avoid production deployment language and configuration.

The production Dockerfile remains unchanged because Render can continue using it independently of the local Compose workflow.

### Local database guard

`scripts/assert-local-database.mjs` will parse `DATABASE_URL` with the standard URL implementation and accept only:

- `postgresql:` or `postgres:` protocols;
- `localhost`;
- `127.0.0.1`;
- IPv6 loopback.

It will reject a missing URL, malformed URL, unsupported protocol, empty host, Docker service hostname, private-network host, or public host. Error output will include only safe remediation and, when available, the rejected hostname. It will never echo the URL, username, or password.

### Command surface

`package.json` will expose:

- `db:local:up` to start and wait for the Docker PostgreSQL service;
- `db:local:setup` to validate the local URL, apply the Prisma schema, and run the reference seed;
- `db:local:reset` to require an explicit confirmation flag, validate the local URL, reset the local schema, and reseed reference data;
- `db:local:down` to stop local services without deleting the volume;
- `db:local:destroy` to require explicit confirmation before deleting the local volume;
- `db:prod:console` to invoke interactive `render psql` without a stored connection URL;
- `test:security` to run local database guard and secret detector tests;
- `security:secrets` to scan repository content for credential-bearing PostgreSQL URLs.

No command silently falls back from local PostgreSQL to Render PostgreSQL.

### Configuration

A tracked `.env.example` will provide safe local configuration, including a loopback PostgreSQL URL with disposable credentials. The ignored `.env` will be updated in place so its database URL matches the local Docker database while preserving unrelated developer-specific values.

A tracked `.mcp.example.json` will configure the PostgreSQL MCP server for the same loopback database. The ignored `.mcp.json` will be rewritten to match it. Neither file will contain a Render hostname.

### PostgreSQL credential detector

A dependency-free Node script will detect credential-bearing `postgres://` and `postgresql://` URLs. It will distinguish production-shaped credentials from approved localhost examples and explicit documentation placeholders. It will scan repository content during verification and staged content through a tracked pre-commit hook.

Detection output will contain the file path, line number, and detector type only. It will not print the matched secret. The hook installation command will configure the repository-local Git hooks path explicitly; it will not modify global Git configuration.

## Failure handling

- Local database commands fail before invoking Prisma if the URL is absent, malformed, or non-local.
- Setup fails if Docker is unavailable, PostgreSQL does not become healthy, Prisma schema application fails, or reference seeding fails.
- Reset and destroy fail unless the local URL is valid and the explicit confirmation argument is present.
- Production console access fails when Render CLI is missing or unauthenticated. It never requests a database URL as fallback input.
- Secret scans fail closed on unreadable inputs or malformed scan state.
- Secret reports redact credential content.
- Render allowlist mutation is refused until a trusted CIDR is explicitly supplied.

## Testing strategy

### Unit tests

Node's built-in test runner will cover:

- accepted loopback PostgreSQL URLs;
- rejected public and private-network hosts;
- rejected Render internal and external host shapes;
- missing, empty, malformed, and unsupported URLs;
- redacted error messages;
- detection of credential-bearing PostgreSQL URLs;
- acceptance of localhost examples and documented placeholders;
- encoded and alternate-protocol PostgreSQL URL variants.

Each behavior will follow a red-green-refactor cycle before implementation.

### Integration tests

Verification will use the real Docker PostgreSQL service to prove:

- Compose configuration is valid without warnings;
- the service binds only to loopback and becomes healthy;
- the Prisma schema applies successfully;
- the reference seed completes successfully;
- the database contains the expected domain, theme, and badge records;
- no organization or user records are introduced by seeding;
- the host Prisma client connects with the local URL.

### Repository quality gates

Every implementation phase must run the checks relevant to its files. Final verification must include:

- local unit and security tests;
- Docker PostgreSQL integration;
- `npx tsc --noEmit`;
- `ESLINT_USE_FLAT_CONFIG=false npx eslint . --quiet`;
- `npm run build`;
- `docker compose config --quiet` with no warning output;
- repository and staged secret scans;
- a clean Git worktree and zero ahead/behind count after approved pushes;
- production root and database-backed route checks after the final deployment.

## Delivery phases

Each phase changes no more than five files and stops for explicit approval before the next phase.

### Phase 1: Local database safety foundation

- `docker-compose.yml`
- `scripts/assert-local-database.mjs`
- `scripts/assert-local-database.test.mjs`
- `package.json`
- `.env.example`

This phase delivers loopback Docker PostgreSQL, the tested guard, and guarded local commands.

### Phase 2: Local configuration and documentation

- `.env` (ignored local file)
- `.mcp.json` (ignored local file)
- `.mcp.example.json`
- `README.md`

This phase removes the Render URL from persistent local application and MCP configuration and documents the approved workflows.

### Phase 3: Credential detection and commit protection

- `scripts/check-postgres-secrets.mjs`
- `scripts/check-postgres-secrets.test.mjs`
- `scripts/install-git-hooks.mjs`
- `.githooks/pre-commit`
- `package.json`

This phase completes bead `strengthsync-she` with test-first PostgreSQL DSN detection and repository-local pre-commit enforcement.

### Phase 4: Full verification and production observation

No planned source files. This phase runs the complete quality, Docker integration, secret, Git, deployment, and production checks. The Render allowlist remains unchanged unless a trusted CIDR is supplied and approved before this phase.

## Acceptance criteria

- Persistent local files contain no Render PostgreSQL URL.
- Local Next.js, Prisma, and MCP workflows use only loopback Docker PostgreSQL.
- Reference seeding creates no organization or user records.
- Destructive local commands cannot operate on a non-loopback host.
- Production diagnostics work through authenticated `render psql` without a local production URL.
- Credential-bearing PostgreSQL URLs are blocked by automated tests, repository scanning, and the pre-commit hook.
- All required type, lint, build, Compose, integration, secret, Git, deployment, and production checks pass.
- Every implementation phase stays within five changed files and receives explicit approval before the next phase.
