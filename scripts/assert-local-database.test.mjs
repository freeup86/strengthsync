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

const loopbackUrlWithQuery = (search) => {
  const databaseUrl = new URL(acceptedUrls[0]);
  databaseUrl.search = search;
  return databaseUrl.toString();
};

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

for (const [description, search] of [
  ["destination-routing query override", "?host=nonlocal"],
  ["encoded mixed-case destination-routing query override", "?%68%4F%73%54=%6E%6F%6E%6C%6F%63%61%6C"],
]) {
  test(`rejects loopback URL with ${description} without revealing URL details`, () => {
    const databaseUrl = loopbackUrlWithQuery(search);
    const parsed = new URL(databaseUrl);
    const [queryName, queryValue] = parsed.searchParams.entries().next().value;

    assert.throws(
      () => assertLocalDatabaseUrl(databaseUrl),
      (error) => {
        assert.ok(error instanceof LocalDatabaseSafetyError);
        assert.equal(error.message.includes(queryName), false);
        assert.equal(error.message.includes(queryValue), false);
        assert.equal(error.message.includes(databaseUrl), false);
        assert.equal(error.message.includes(parsed.username), false);
        assert.equal(error.message.includes(parsed.password), false);
        return true;
      }
    );
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
