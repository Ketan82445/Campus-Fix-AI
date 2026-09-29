const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  console.log('Applying Cluster 5 (Incident Management) DDL...');

  const ddlStatements = [
    // 1. Create Enum IncidentSeverity
    `CREATE TYPE "IncidentSeverity" AS ENUM ('MINOR', 'MAJOR', 'CRITICAL')`,
    
    // 2. Create Incident table
    `CREATE TABLE IF NOT EXISTS "Incident" (
       "id" TEXT NOT NULL PRIMARY KEY,
       "title" TEXT NOT NULL,
       "description" TEXT NOT NULL,
       "category" "Category" NOT NULL,
       "severity" "IncidentSeverity" NOT NULL DEFAULT 'MAJOR',
       "status" "Status" NOT NULL DEFAULT 'IN_PROGRESS',
       "location" TEXT,
       "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
       "updatedAt" TIMESTAMP(3) NOT NULL,
       "resolvedAt" TIMESTAMP(3)
     )`,

    // 3. Add Indexes to Incident
    `CREATE INDEX IF NOT EXISTS "Incident_status_idx" ON "Incident"("status")`,
    `CREATE INDEX IF NOT EXISTS "Incident_category_idx" ON "Incident"("category")`,

    // 4. Add incidentId to Complaint
    `ALTER TABLE "Complaint" ADD COLUMN IF NOT EXISTS "incidentId" TEXT`,
    `ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE SET NULL ON UPDATE CASCADE`
  ];

  for (const stmt of ddlStatements) {
    try {
      await prisma.$executeRawUnsafe(stmt);
      console.log(`Executed: ${stmt.substring(0, 60)}...`);
    } catch (err) {
      console.error(`Failed to execute: ${stmt}`);
      console.error(err.message);
      if (!err.message.includes('already exists') && !err.message.includes('Duplicate type')) {
        throw err;
      }
    }
  }

  console.log('Cluster 5 Migration completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
