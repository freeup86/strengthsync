import { spawnSync } from "node:child_process";
import {
  closeSync,
  constants,
  lstatSync,
  openSync,
  readFileSync,
  readlinkSync,
} from "node:fs";
import { pathToFileURL } from "node:url";

const POSTGRES_URL_PATTERN = /\bpostgres(?:ql)?:\/\/[^\s"'`]+/giu;
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
const PLACEHOLDER_HOST = /^(?:[a-z0-9-]+\.)*example\.com$/i;
const PLACEHOLDER_USERS = new Set(["user", "username"]);
const PLACEHOLDER_PASSWORDS = new Set(["password", "example", "changeme"]);
const TRAILING_PROSE_PUNCTUATION = /[\)\]\},.;]+$/u;
const CONTROL_CHARACTERS = /[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu;
const UTF8_DECODER = new TextDecoder("utf-8", { fatal: true });

class SecretScanError extends Error {}

function hasCredentialShape(candidate) {
  const authority = candidate
    .slice(candidate.indexOf("://") + 3)
    .split(/[/?#]/u, 1)[0];
  const passwordSeparator = authority.indexOf(":");
  const hostSeparator = authority.lastIndexOf("@");
  return passwordSeparator > 0 && hostSeparator > passwordSeparator;
}

function lineAt(text, offset) {
  return 1 + (text.slice(0, offset).match(/\n/gu)?.length ?? 0);
}

function sanitizePath(filePath) {
  return filePath.replace(CONTROL_CHARACTERS, (character) => {
    const codePoint = character.codePointAt(0).toString(16).padStart(4, "0");
    return codePoint.length === 4 ? `\\u${codePoint}` : `\\u{${codePoint}}`;
  });
}

export function scanText(text, filePath) {
  const findings = [];

  for (const match of text.matchAll(POSTGRES_URL_PATTERN)) {
    const candidate = match[0].replace(TRAILING_PROSE_PUNCTUATION, "");
    if (!hasCredentialShape(candidate)) {
      continue;
    }

    let parsed;
    try {
      parsed = new URL(candidate.replace(/^postgres(?:ql)?:/iu, "http:"));
    } catch {
      findings.push({
        filePath,
        line: lineAt(text, match.index),
        type: "malformed-postgresql-credentials",
      });
      continue;
    }

    const isLoopback = LOOPBACK_HOSTS.has(parsed.hostname.toLowerCase());
    const isDocumentationPlaceholder =
      PLACEHOLDER_HOST.test(parsed.hostname) &&
      PLACEHOLDER_USERS.has(parsed.username) &&
      PLACEHOLDER_PASSWORDS.has(parsed.password);

    if (candidate.includes("?") || (!isLoopback && !isDocumentationPlaceholder)) {
      findings.push({
        filePath,
        line: lineAt(text, match.index),
        type: "postgresql-credentials",
      });
    }
  }

  return findings;
}

export function formatFindings(findings) {
  return findings
    .map(({ filePath, line, type }) => `${sanitizePath(filePath)}:${line} ${type}`)
    .join("\n");
}

function runGit(args, operation) {
  const result = spawnSync("git", args, {
    encoding: "buffer",
    shell: false,
  });

  if (result.error) {
    throw new SecretScanError(`git ${operation} could not be started.`);
  }
  if (result.status !== 0) {
    throw new SecretScanError(
      `git ${operation} exited with status ${result.status}.`
    );
  }

  return result.stdout;
}

function decodePathList(bytes) {
  let pathList;
  try {
    pathList = UTF8_DECODER.decode(bytes);
  } catch {
    throw new SecretScanError("Git returned a non-UTF-8 tracked path.");
  }
  return pathList.split("\0").filter((filePath) => filePath !== "");
}

function listRepositoryPaths() {
  return decodePathList(runGit(["ls-files", "-z"], "ls-files"));
}

function listStagedPaths() {
  return decodePathList(
    runGit(
      ["diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z"],
      "diff"
    )
  );
}

function readWorkingTreeBytes(filePath) {
  try {
    if (lstatSync(filePath).isSymbolicLink()) {
      return readlinkSync(filePath, { encoding: "buffer" });
    }

    const descriptor = openSync(
      filePath,
      constants.O_RDONLY | constants.O_NOFOLLOW
    );
    try {
      return readFileSync(descriptor);
    } finally {
      closeSync(descriptor);
    }
  } catch {
    throw new SecretScanError(
      `${sanitizePath(filePath)}: unable to read tracked bytes`
    );
  }
}

function readStagedBytes(filePath) {
  return runGit(["show", `:${filePath}`], "show");
}

function scanBytes(bytes, filePath) {
  if (bytes.includes(0)) {
    return [];
  }

  let text;
  try {
    text = UTF8_DECODER.decode(bytes);
  } catch {
    throw new SecretScanError(`${sanitizePath(filePath)}: invalid UTF-8 text`);
  }
  return scanText(text, filePath);
}

export function main(args = process.argv.slice(2)) {
  const staged = args.length === 1 && args[0] === "--staged";
  if (args.length !== 0 && !staged) {
    throw new SecretScanError("Expected no arguments or --staged.");
  }

  const paths = staged ? listStagedPaths() : listRepositoryPaths();
  const readBytes = staged ? readStagedBytes : readWorkingTreeBytes;
  const findings = paths.flatMap((filePath) =>
    scanBytes(readBytes(filePath), filePath)
  );

  if (findings.length > 0) {
    console.error(formatFindings(findings));
    return 1;
  }
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.exitCode = main();
  } catch (error) {
    console.error(
      error instanceof SecretScanError
        ? error.message
        : "PostgreSQL credential scan failed unexpectedly."
    );
    process.exitCode = 1;
  }
}
