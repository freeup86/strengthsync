import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { formatFindings, scanText } from "./check-postgres-secrets.mjs";

const postgresqlUrl = (authorityAndPath) =>
  ["postgres", "ql://", authorityAndPath].join("");
const postgresUrl = (authorityAndPath) =>
  ["postgres", "://", authorityAndPath].join("");
const scannerPath = fileURLToPath(
  new URL("./check-postgres-secrets.mjs", import.meta.url)
);
const installerPath = fileURLToPath(
  new URL("./install-git-hooks.mjs", import.meta.url)
);
const packageJsonPath = fileURLToPath(new URL("../package.json", import.meta.url));
const preCommitPath = fileURLToPath(
  new URL("../.githooks/pre-commit", import.meta.url)
);

function run(command, args, cwd) {
  return spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    shell: false,
  });
}

function git(cwd, args) {
  const result = run("git", args, cwd);
  assert.equal(result.status, 0, result.stderr);
}

function createRepository(t) {
  const repository = mkdtempSync(join(tmpdir(), "strengthsync-secret-scan-"));
  t.after(() => rmSync(repository, { force: true, recursive: true }));
  git(repository, ["init", "--quiet"]);
  return repository;
}

function runScanner(cwd, args = []) {
  return run(process.execPath, [scannerPath, ...args], cwd);
}

function scannerOutput(result) {
  return `${result.stdout}${result.stderr}`;
}

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

for (const [description, search] of [
  ["ordinary query string", "?schema=private"],
  [
    "percent-encoded mixed-case destination-routing override",
    "?%68%4F%73%54=%6E%6F%6E%6C%6F%63%61%6C",
  ],
]) {
  test(`rejects credential-bearing loopback URL with ${description} without leaking details`, () => {
    const databaseUrl = postgresqlUrl(
      `query_user:query_password@localhost:5432/app${search}`
    );
    const findings = scanText(databaseUrl, ".env.example");
    assert.deepEqual(findings, [
      { filePath: ".env.example", line: 1, type: "postgresql-credentials" },
    ]);

    const output = formatFindings(findings);
    for (const privateText of [
      databaseUrl,
      "query_user",
      "query_password",
      "schema",
      "private",
      "%68%4F%73%54",
      "%6E%6F%6E%6C%6F%63%61%6C",
    ]) {
      assert.equal(output.includes(privateText), false);
    }
  });
}

test("does not let documentation placeholders bypass the query rule", () => {
  assert.deepEqual(
    scanText(
      postgresqlUrl("user:password@db.example.com:5432/app?schema=public"),
      "README.md"
    ),
    [{ filePath: "README.md", line: 1, type: "postgresql-credentials" }]
  );
});

test("sanitizes control characters in finding paths", () => {
  assert.equal(
    formatFindings([
      {
        filePath: "settings/\n\u001b[31m.env",
        line: 4,
        type: "postgresql-credentials",
      },
    ]),
    "settings/\\u000a\\u001b[31m.env:4 postgresql-credentials"
  );
});

test("repository mode scans current tracked working-tree bytes", (t) => {
  const repository = createRepository(t);
  writeFileSync(join(repository, "config.env"), "SAFE=true\n");
  git(repository, ["add", "--", "config.env"]);

  const databaseUrl = postgresqlUrl(
    "working_user:working_password@db.vendor.test:5432/app"
  );
  writeFileSync(join(repository, "config.env"), `${databaseUrl}\n`);

  const result = runScanner(repository);
  assert.equal(result.status, 1);
  assert.equal(scannerOutput(result), "config.env:1 postgresql-credentials\n");
  for (const privateText of [databaseUrl, "working_user", "working_password"]) {
    assert.equal(scannerOutput(result).includes(privateText), false);
  }
});

test("staged mode scans exact index bytes rather than working-tree bytes", (t) => {
  const repository = createRepository(t);
  const databaseUrl = postgresqlUrl(
    "staged_user:staged_password@db.vendor.test:5432/app"
  );
  writeFileSync(join(repository, "config.env"), `${databaseUrl}\n`);
  git(repository, ["add", "--", "config.env"]);
  writeFileSync(join(repository, "config.env"), "SAFE=true\n");

  const stagedResult = runScanner(repository, ["--staged"]);
  assert.equal(stagedResult.status, 1);
  assert.equal(
    scannerOutput(stagedResult),
    "config.env:1 postgresql-credentials\n"
  );
  assert.equal(runScanner(repository).status, 0);
});

test("repository and staged modes skip NUL-containing binary files", (t) => {
  const repository = createRepository(t);
  const binaryContent = Buffer.concat([
    Buffer.from([0]),
    Buffer.from(postgresqlUrl("binary_user:binary_password@db.vendor.test/app")),
  ]);
  writeFileSync(join(repository, "archive.bin"), binaryContent);
  git(repository, ["add", "--", "archive.bin"]);

  for (const args of [[], ["--staged"]]) {
    const result = runScanner(repository, args);
    assert.equal(result.status, 0);
    assert.equal(scannerOutput(result), "");
  }
});

test("invalid UTF-8 fails safely and sanitizes the tracked path", (t) => {
  const repository = createRepository(t);
  const filePath = "invalid\n\u001b[31m.env";
  writeFileSync(join(repository, filePath), Buffer.from([0xc3, 0x28]));
  git(repository, ["add", "--", filePath]);

  for (const args of [[], ["--staged"]]) {
    const result = runScanner(repository, args);
    assert.equal(result.status, 1);
    assert.equal(
      scannerOutput(result),
      "invalid\\u000a\\u001b[31m.env: invalid UTF-8 text\n"
    );
  }
});

test("repository mode does not follow tracked symlinks outside the repository", (t) => {
  const repository = createRepository(t);
  const outsideDirectory = mkdtempSync(join(tmpdir(), "strengthsync-secret-outside-"));
  t.after(() => rmSync(outsideDirectory, { force: true, recursive: true }));
  const outsideFile = join(outsideDirectory, "outside.env");
  writeFileSync(
    outsideFile,
    postgresqlUrl("outside_user:outside_password@db.vendor.test/app")
  );
  symlinkSync(outsideFile, join(repository, "linked.env"));
  git(repository, ["add", "--", "linked.env"]);

  for (const args of [[], ["--staged"]]) {
    const result = runScanner(repository, args);
    assert.equal(result.status, 0);
    assert.equal(scannerOutput(result), "");
  }
});

test("unknown arguments fail without echoing argument names or values", (t) => {
  const repository = createRepository(t);
  const result = runScanner(repository, ["--password=top-secret"]);
  assert.equal(result.status, 1);
  assert.equal(scannerOutput(result), "Expected no arguments or --staged.\n");
});

test("Git failures report only the command and exit status", (t) => {
  const directory = mkdtempSync(join(tmpdir(), "strengthsync-secret-nongit-"));
  t.after(() => rmSync(directory, { force: true, recursive: true }));

  const result = runScanner(directory);
  assert.equal(result.status, 1);
  assert.equal(scannerOutput(result), "git ls-files exited with status 128.\n");
});

test("package scripts expose the combined security test, scanner, and hook installer", () => {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  assert.equal(
    packageJson.scripts["test:security"],
    "node --test scripts/assert-local-database.test.mjs scripts/check-postgres-secrets.test.mjs"
  );
  assert.equal(
    packageJson.scripts["security:secrets"],
    "node scripts/check-postgres-secrets.mjs"
  );
  assert.equal(
    packageJson.scripts["hooks:install"],
    "node scripts/install-git-hooks.mjs"
  );
  assert.equal(
    packageJson.scripts["test:local-db"],
    "node --test scripts/assert-local-database.test.mjs"
  );
});

test("pre-commit hook invokes only the staged secret scanner", () => {
  assert.equal(existsSync(preCommitPath), true);
  assert.equal(
    readFileSync(preCommitPath, "utf8"),
    "#!/bin/sh\nset -eu\n\nnpm run security:secrets -- --staged\n"
  );
  assert.equal(statSync(preCommitPath).mode & 0o777, 0o755);
});

test("hook installer configures only the local hooks path and executable mode", (t) => {
  const repository = createRepository(t);
  mkdirSync(join(repository, ".githooks"));
  const hookPath = join(repository, ".githooks", "pre-commit");
  writeFileSync(hookPath, "#!/bin/sh\n", { mode: 0o600 });

  const result = run(process.execPath, [installerPath], repository);
  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
  assert.equal(result.stdout, "Installed repository hooks from .githooks.\n");

  const hooksPath = run(
    "git",
    ["config", "--local", "--get", "core.hooksPath"],
    repository
  );
  assert.equal(hooksPath.status, 0);
  assert.equal(hooksPath.stdout, ".githooks\n");
  assert.equal(statSync(hookPath).mode & 0o777, 0o755);
});

test("hook installer reports a concise local Git configuration failure", (t) => {
  const directory = mkdtempSync(join(tmpdir(), "strengthsync-hooks-nongit-"));
  t.after(() => rmSync(directory, { force: true, recursive: true }));
  mkdirSync(join(directory, ".githooks"));
  writeFileSync(join(directory, ".githooks", "pre-commit"), "#!/bin/sh\n");

  const result = run(process.execPath, [installerPath], directory);
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.equal(result.stderr, "git config exited with status 128.\n");
});
