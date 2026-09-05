# Production database migrations

This describes how schema changes reach the production Render Postgres instance,
and the one-time step you must complete before that can work.

## Why this exists

Until now the schema reached databases through `prisma db push`, and the only
route to production was `npm run db:prod:console`, which shells out to
`render psql` over the database's public endpoint. That endpoint is open only
because the Render database has a non-empty `ipAllowList`.

The goal is an empty `ipAllowList`: no public IP can reach the database, and the
only thing that can talk to it is a Render service on the same private network.
That means migrations have to run inside Render, which needs a real migration
history in the repository. There was none.

## The baseline migration

`prisma/migrations/20260905055913_init/migration.sql` is that history. It was
generated offline, from the schema file only, with no database connection:

```bash
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/20260905055913_init/migration.sql
```

It creates every enum, table, index, and foreign key in `prisma/schema.prisma`.
It has never been executed anywhere. It is a written description of the schema
that `prisma db push` has been maintaining by hand.

`prisma/migrations/migration_lock.toml` records the provider and must stay
committed. The previous `.gitignore` excluded it, which would have left Render
with an incomplete migrations directory.

## Read this before the first deploy: the ordering trap

Production already has all of those tables. It does not have Prisma's
`_prisma_migrations` bookkeeping table, so Prisma believes nothing has ever been
applied.

If `prisma migrate deploy` runs against production before the baseline is
recorded, it will try to create objects that already exist, fail on the first
conflicting statement, roll back, and write a **failed** row into
`_prisma_migrations`. No data is lost and the deploy is cancelled, but that
failed row then blocks every future migration until it is cleared with
`prisma migrate resolve --rolled-back 20260905055913_init`.

The fix is to tell production, once, that this migration is already applied:

```
npx prisma migrate resolve --applied 20260905055913_init
```

`migrate resolve --applied` runs no SQL from the migration file. It creates
`_prisma_migrations` if needed and inserts a single row marking that migration
as applied. After that, `prisma migrate deploy` sees the baseline as done and
only applies migrations added later.

**Run it exactly once, and run it before either of these happens:**

- before `prisma migrate deploy` first runs against production, and
- before the database's `ipAllowList` is emptied, unless you are running it from
  inside Render.

Getting that order wrong is the whole trap. Do the resolve first. Turn on the
migrate step second. Close the allow list third.

## Ordered procedure

1. Merge the `prisma/migrations/` directory and the `.gitignore` change. Do not
   sync `render.yaml` yet and do not add any migrate step to the service.
2. Record the baseline once, using one of the three options below.
3. Verify it. From a Render Shell on the web service, or from your laptop while
   the allow list is still open, run `npx prisma migrate status`. It must report
   that the database schema is up to date, with `20260905055913_init` applied.
   If it reports a failed migration, clear it with
   `npx prisma migrate resolve --rolled-back 20260905055913_init` and start
   again at step 2.
4. Only now enable the migration step: reconcile and sync `render.yaml`, or set
   the pre-deploy command by hand in the dashboard.
5. Deploy once with no schema change pending and confirm the migrate step
   succeeds and reports nothing to apply.
6. Empty the database's `ipAllowList`.
7. Confirm the app still works. It uses the internal connection string, so an
   empty allow list does not affect it.

### Option A: Render Shell (preferred)

Open a shell on the `strengthsync` web service in the Render dashboard and run:

```bash
npx prisma migrate resolve --applied 20260905055913_init
```

This runs inside Render, on the private network, with the service's own
`DATABASE_URL`. It works whether the allow list is open or already empty.
Render Shell requires a paid instance type.

### Option B: from your laptop, while the allow list is still open

Use the external connection string from the Render dashboard, for this one
command only:

```bash
DATABASE_URL='<external connection string>' \
  npx prisma migrate resolve --applied 20260905055913_init
```

Do not put that value in `.env`, `.mcp.json`, or any shell profile. This is the
one deliberate exception to the loopback guard in
`scripts/assert-local-database.mjs`; every `npm run db:*` script still refuses a
non-loopback host, and that is intentional.

### Option C: one temporary deploy, if you have no shell access

On the free plan there is no Render Shell. Set the service's start command in
the dashboard to, for exactly one deploy:

```
npx prisma migrate resolve --applied 20260905055913_init ; npm run start
```

The `;` rather than `&&` matters: on any later restart the resolve fails because
the migration is already recorded, and `&&` would stop the app from starting.
Change the start command back to `npm run start` as soon as the deploy is
healthy.

## After baselining

- Schema changes must produce a migration file. Run `npm run db:migrate` locally
  (`prisma migrate dev` against the Docker database) and commit the generated
  `prisma/migrations/<timestamp>_<name>/migration.sql`.
- Do not use `prisma db push` for schema changes any more. It mutates a database
  without writing a migration, so production would drift away from the recorded
  history. Note that `npm run db:local:setup` and `npm run db:local:reset` still
  use `db push`; they are fine for rebuilding a throwaway local database, but
  they are not how a schema change gets recorded.
- `prisma migrate deploy` needs only `DATABASE_URL`. It never uses a shadow
  database, which is why the datasource in `prisma/schema.prisma` does not need
  `shadowDatabaseUrl` or `directUrl`.
- `npm run db:prod:console` stops working the moment the allow list is empty.
  Use a Render Shell for production diagnostics instead.
