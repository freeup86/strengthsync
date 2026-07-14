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
