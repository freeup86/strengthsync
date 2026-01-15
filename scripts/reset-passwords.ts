/**
 * Script to reset all user passwords to a specified value
 * Run with: npx tsx scripts/reset-passwords.ts
 */

import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const NEW_PASSWORD = "Welcome2026";

async function resetAllPasswords() {
  console.log("Starting password reset for all users...\n");

  // Hash the new password
  const passwordHash = await hash(NEW_PASSWORD, 12);
  console.log(`Password hash generated for: ${NEW_PASSWORD}`);

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
  console.log(`\nAll users can now log in with password: ${NEW_PASSWORD}`);
}

resetAllPasswords()
  .catch((error) => {
    console.error("Error resetting passwords:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
