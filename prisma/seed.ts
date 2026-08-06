import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME ?? "Platform Admin";

  if (!adminEmail || !adminPassword) {
    console.warn("ADMIN_EMAIL or ADMIN_PASSWORD missing. Skipping admin seed.");
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      role: Role.ADMIN,
      passwordHash,
    },
    create: {
      name: adminName,
      email: adminEmail,
      role: Role.ADMIN,
      passwordHash,
      adminProfile: {
        create: {},
      },
    },
  });

  await prisma.admin.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: { userId: adminUser.id },
  });

  await prisma.appSetting.upsert({
    where: { key: "pricing.kmlPrice" },
    update: {
      updatedByUserId: adminUser.id,
    },
    create: {
      key: "pricing.kmlPrice",
      value: "50",
      updatedByUserId: adminUser.id,
    },
  });

  console.log(`Admin user ready: ${adminEmail}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
