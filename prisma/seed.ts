import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

// ─── Seed: Create First Owner ───
// Reads credentials from .env (SEED_OWNER_EMAIL / NAME / PASSWORD).
// Idempotent: skips if the email already exists.
// Fails if any env var is missing (never creates a weak default account).

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_OWNER_EMAIL;
  const name = process.env.SEED_OWNER_NAME;
  const password = process.env.SEED_OWNER_PASSWORD;

  // ── Validate env vars ──
  const missing: string[] = [];
  if (!email) missing.push("SEED_OWNER_EMAIL");
  if (!name) missing.push("SEED_OWNER_NAME");
  if (!password) missing.push("SEED_OWNER_PASSWORD");

  if (missing.length > 0) {
    console.error(
      `\n❌ Seed aborted: missing required environment variables: ${missing.join(", ")}\n` +
        `   Please set them in your .env file before running the seed.\n` +
        `   See .env.example for reference.\n`,
    );
    process.exit(1);
  }

  // ── Idempotent check ──
  const existing = await prisma.user.findUnique({
    where: { email: email! },
  });

  if (existing) {
    console.log(`✓ Owner already exists (email: ${email}). Skipping seed.`);
    return;
  }

  // ── Create Owner ──
  const passwordHash = await bcrypt.hash(password!, 10);
  const owner = await prisma.user.create({
    data: {
      email: email!,
      name: name!,
      passwordHash,
      role: "Owner",
      status: "Active",
    },
  });

  console.log(`✓ Owner created successfully:`);
  console.log(`  - ID:    ${owner.id}`);
  console.log(`  - Email: ${owner.email}`);
  console.log(`  - Name:  ${owner.name}`);
  console.log(`  - Role:  ${owner.role}`);
  console.log(`\n  ⚠️  Please change the password after first login.\n`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
