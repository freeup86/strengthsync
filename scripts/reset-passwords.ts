/**
 * Script to reset all user passwords to a specified value
 *
 * The password is read from RESET_PASSWORD_VALUE so it is never committed.
 * Set it for this one command only; do not add it to .env.
 *
 * Run with:
 *   RESET_PASSWORD_VALUE='<password>' npx tsx --env-file=.env scripts/reset-passwords.ts
 *
 * The loopback check is the same guard every db:* npm script uses, so this
 * script can only target the local Docker database.
 */

import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

import { assertLocalDatabaseUrl } from "./assert-local-database.mjs";

const NEW_PASSWORD = process.env.RESET_PASSWORD_VALUE;

if (!NEW_PASSWORD) {
  console.error(
    "RESET_PASSWORD_VALUE is not set. Provide the new password for this command only, e.g.\n" +
      "  RESET_PASSWORD_VALUE='<password>' npx tsx --env-file=.env scripts/reset-passwords.ts"
  );
  process.exit(1);
}

try {
  assertLocalDatabaseUrl(process.env.DATABASE_URL);
} catch (error) {
  console.error(
    error instanceof Error
      ? error.message
      : "DATABASE_URL check failed; password reset was blocked."
  );
  process.exit(1);
}

const prisma = new PrismaClient();

async function resetAllPasswords(newPassword: string) {
  console.log("Starting password reset for all users...\n");

  // Hash the new password
  const passwordHash = await hash(newPassword, 12);
  console.log("Password hash generated from RESET_PASSWORD_VALUE");

  // Get count of users
  const userCount = await prisma.user.count();
  console.log(`Found ${userCount} users to update\n`);

  if (userCount === 0) {
    console.log("No users found. Exiting.");
    return;
  }

  // Update all users
  const result = await prisma.user.updateMany({
    data: {
      passwordHash,
    },
  });

  console.log(`Successfully updated ${result.count} users.`);
  console.log("\nAll users can now log in with the RESET_PASSWORD_VALUE password.");
}

resetAllPasswords(NEW_PASSWORD)
  .catch((error) => {
    console.error("Error resetting passwords:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
