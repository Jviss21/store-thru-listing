/**
 * Prisma seed — 10 orgs, one user per org, Hammoq ops user.
 * Run: npm run db:seed  (requires DATABASE_URL + prisma db push first)
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PILOT_ORGS } from "../src/lib/orgs";
import { SEED_USERS, PILOT_PASSWORD } from "../src/lib/db/seed-data";

const prisma = new PrismaClient();

async function main() {
  const password = process.env.DEMO_PASSWORD?.trim() || PILOT_PASSWORD;
  const passwordHash = await bcrypt.hash(password, 10);

  for (const org of PILOT_ORGS) {
    await prisma.organization.upsert({
      where: { id: org.id },
      create: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        region: org.region,
        type: org.type,
        featureFlags: {
          create: {
            autoList: org.flags.autoList,
            shopgoodwill: org.flags.shopgoodwill,
            ebay: org.flags.ebay,
            killSwitchOff: org.flags.killSwitchOff,
          },
        },
      },
      update: {
        name: org.name,
        slug: org.slug,
        region: org.region,
        type: org.type,
      },
    });

    await prisma.featureFlags.upsert({
      where: { orgId: org.id },
      create: {
        orgId: org.id,
        autoList: org.flags.autoList,
        shopgoodwill: org.flags.shopgoodwill,
        ebay: org.flags.ebay,
        killSwitchOff: org.flags.killSwitchOff,
      },
      update: {
        autoList: org.flags.autoList,
        shopgoodwill: org.flags.shopgoodwill,
        ebay: org.flags.ebay,
        killSwitchOff: org.flags.killSwitchOff,
      },
    });

    for (const channel of ["ShopGoodwill", "eBay"] as const) {
      const connected =
        (channel === "ShopGoodwill" && org.flags.shopgoodwill) ||
        (channel === "eBay" && org.flags.ebay);
      await prisma.marketplaceConnection.upsert({
        where: { orgId_channel: { orgId: org.id, channel } },
        create: {
          orgId: org.id,
          channel,
          status: connected ? "Not connected" : "Not connected",
          syncEnabled: false,
          notes: "Phase 1 stub — OAuth in Phase 2",
        },
        update: {},
      });
    }
  }

  for (const user of SEED_USERS) {
    await prisma.user.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        email: user.email.toLowerCase(),
        name: user.name,
        passwordHash,
        isOps: user.isOps,
      },
      update: {
        email: user.email.toLowerCase(),
        name: user.name,
        passwordHash,
        isOps: user.isOps,
      },
    });

    for (const m of user.memberships) {
      await prisma.membership.upsert({
        where: { orgId_userId: { orgId: m.orgId, userId: user.id } },
        create: {
          orgId: m.orgId,
          userId: user.id,
          role: m.role,
          status: "Active",
        },
        update: { role: m.role, status: "Active" },
      });
    }
  }

  await prisma.auditEvent.create({
    data: {
      action: "seed.complete",
      metaJson: JSON.stringify({
        orgs: PILOT_ORGS.length,
        users: SEED_USERS.length,
        at: new Date().toISOString(),
      }),
    },
  });

  console.log(
    `Seeded ${PILOT_ORGS.length} orgs, ${SEED_USERS.length} users. Password: ${password}`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
