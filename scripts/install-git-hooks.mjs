import { spawnSync } from "node:child_process";
import { chmodSync } from "node:fs";

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

const result = spawnSync(
  "git",
  ["config", "--local", "core.hooksPath", ".githooks"],
  { shell: false }
);

if (result.error) {
  fail("git config could not be started.");
} else if (result.status !== 0) {
  fail(`git config exited with status ${result.status}.`);
} else {
  try {
    chmodSync(".githooks/pre-commit", 0o755);
    console.log("Installed repository hooks from .githooks.");
  } catch {
    fail("The repository pre-commit hook could not be made executable.");
  }
}
