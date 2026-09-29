const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  console.log('Applying Cluster 15 (Student Resolution Feedback) DDL...');

  const ddlStatements = [
    // 1. Create ComplaintFeedback table
    `CREATE TABLE IF NOT EXISTS "ComplaintFeedback" (
       "id" TEXT NOT NULL PRIMARY KEY,
       "complaintId" TEXT NOT NULL,
       "studentId" TEXT NOT NULL,
       "rating" INTEGER NOT NULL,
       "comment" TEXT,
       "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
       CONSTRAINT "ComplaintFeedback_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE CASCADE ON UPDATE CASCADE,
       CONSTRAINT "ComplaintFeedback_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
     )`,

    // 2. Add Unique constraint and indexes
    `CREATE UNIQUE INDEX IF NOT EXISTS "ComplaintFeedback_complaintId_key" ON "ComplaintFeedback"("complaintId")`,
    `CREATE INDEX IF NOT EXISTS "ComplaintFeedback_studentId_idx" ON "ComplaintFeedback"("studentId")`,
    `CREATE INDEX IF NOT EXISTS "ComplaintFeedback_rating_idx" ON "ComplaintFeedback"("rating")`
  ];

  for (const stmt of ddlStatements) {
    try {
      await prisma.$executeRawUnsafe(stmt);
      console.log(`Executed: ${stmt.substring(0, 60)}...`);
    } catch (err) {
      console.error(`Failed to execute: ${stmt}`);
      console.error(err.message);
      if (!err.message.includes('already exists')) {
        throw err;
      }
    }
  }

  console.log('Cluster 15 Migration completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
