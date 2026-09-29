const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  console.log('Applying Cluster 6 (SLA & Escalation Tracking) DDL...');

  const ddlStatements = [
    // 1. Add SLA columns to Complaint
    `ALTER TABLE "Complaint" ADD COLUMN IF NOT EXISTS "responseDeadline" TIMESTAMP(3)`,
    `ALTER TABLE "Complaint" ADD COLUMN IF NOT EXISTS "resolutionDeadline" TIMESTAMP(3)`,
    `ALTER TABLE "Complaint" ADD COLUMN IF NOT EXISTS "respondedAt" TIMESTAMP(3)`,
    `ALTER TABLE "Complaint" ADD COLUMN IF NOT EXISTS "slaBreached" BOOLEAN NOT NULL DEFAULT false`,
    `ALTER TABLE "Complaint" ADD COLUMN IF NOT EXISTS "escalationLevel" INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE "Complaint" ADD COLUMN IF NOT EXISTS "escalatedAt" TIMESTAMP(3)`,

    // 2. Add indexes
    `CREATE INDEX IF NOT EXISTS "Complaint_slaBreached_idx" ON "Complaint"("slaBreached")`,
    `CREATE INDEX IF NOT EXISTS "Complaint_resolutionDeadline_idx" ON "Complaint"("resolutionDeadline")`,

    // 3. Create SLAConfig table
    `CREATE TABLE IF NOT EXISTS "SLAConfig" (
       "id" TEXT NOT NULL PRIMARY KEY,
       "priority" "Priority" NOT NULL,
       "responseHours" INTEGER NOT NULL,
       "resolutionHours" INTEGER NOT NULL,
       "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
       "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
     )`,

    // 4. Unique index on SLAConfig(priority)
    `CREATE UNIQUE INDEX IF NOT EXISTS "SLAConfig_priority_key" ON "SLAConfig"("priority")`
  ];

  for (let i = 0; i < ddlStatements.length; i++) {
    const stmt = ddlStatements[i];
    console.log(`[${i + 1}/${ddlStatements.length}] Running DDL...`);
    try {
      await prisma.$executeRawUnsafe(stmt);
      console.log(`  -> OK`);
    } catch (err) {
      console.error(`  -> Failed:`, err.message);
      throw err;
    }
  }

  // 5. Seed default SLA configs if missing
  console.log('Seeding default SLA configurations...');
  const defaultConfigs = [
    { priority: 'CRITICAL', responseHours: 4, resolutionHours: 12 },
    { priority: 'HIGH', responseHours: 8, resolutionHours: 24 },
    { priority: 'MEDIUM', responseHours: 24, resolutionHours: 48 },
    { priority: 'LOW', responseHours: 48, resolutionHours: 72 }
  ];

  for (const cfg of defaultConfigs) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "SLAConfig" ("id", "priority", "responseHours", "resolutionHours", "updatedAt")
      VALUES (gen_random_uuid(), '${cfg.priority}', ${cfg.responseHours}, ${cfg.resolutionHours}, CURRENT_TIMESTAMP)
      ON CONFLICT ("priority") DO UPDATE 
      SET "responseHours" = EXCLUDED."responseHours", "resolutionHours" = EXCLUDED."resolutionHours", "updatedAt" = CURRENT_TIMESTAMP
    `);
  }
  console.log('  -> Default SLA configurations seeded.');

  // 6. Backfill existing complaints without SLA deadlines
  console.log('Backfilling SLA deadlines on existing complaints...');
  await prisma.$executeRawUnsafe(`
    UPDATE "Complaint"
    SET 
      "responseDeadline" = CASE "priority"
        WHEN 'CRITICAL' THEN "createdAt" + INTERVAL '4 hours'
        WHEN 'HIGH' THEN "createdAt" + INTERVAL '8 hours'
        WHEN 'MEDIUM' THEN "createdAt" + INTERVAL '24 hours'
        WHEN 'LOW' THEN "createdAt" + INTERVAL '48 hours'
        ELSE "createdAt" + INTERVAL '24 hours'
      END,
      "resolutionDeadline" = CASE "priority"
        WHEN 'CRITICAL' THEN "createdAt" + INTERVAL '12 hours'
        WHEN 'HIGH' THEN "createdAt" + INTERVAL '24 hours'
        WHEN 'MEDIUM' THEN "createdAt" + INTERVAL '48 hours'
        WHEN 'LOW' THEN "createdAt" + INTERVAL '72 hours'
        ELSE "createdAt" + INTERVAL '48 hours'
      END
    WHERE "resolutionDeadline" IS NULL
  `);

  console.log('  -> Existing complaints backfilled with SLA deadlines.');
  console.log(' Cluster 6 DDL & Seed successfully applied to Supabase PostgreSQL!');
}

main()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
