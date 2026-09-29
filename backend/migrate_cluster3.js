const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  console.log('Applying Cluster 3 (Duplicate & Similar Complaint + Community Upvotes) DDL...');

  const ddlStatements = [
    // 1. Add duplicateOfId column to Complaint
    `ALTER TABLE "Complaint" ADD COLUMN IF NOT EXISTS "duplicateOfId" TEXT`,

    // 2. Add foreign key from Complaint(duplicateOfId) to Complaint(id)
    `DO $$ BEGIN
       IF NOT EXISTS (
         SELECT 1 FROM pg_constraint WHERE conname = 'Complaint_duplicateOfId_fkey'
       ) THEN
         ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_duplicateOfId_fkey" 
         FOREIGN KEY ("duplicateOfId") REFERENCES "Complaint"("id") ON DELETE SET NULL ON UPDATE CASCADE;
       END IF;
     END $$`,

    // 3. Add index on duplicateOfId
    `CREATE INDEX IF NOT EXISTS "Complaint_duplicateOfId_idx" ON "Complaint"("duplicateOfId")`,

    // 4. Create ComplaintUpvote table if not exists
    `CREATE TABLE IF NOT EXISTS "ComplaintUpvote" (
       "id" TEXT NOT NULL PRIMARY KEY,
       "complaintId" TEXT NOT NULL,
       "userId" TEXT NOT NULL,
       "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
       CONSTRAINT "ComplaintUpvote_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE CASCADE ON UPDATE CASCADE,
       CONSTRAINT "ComplaintUpvote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
     )`,

    // 5. Add unique index on ComplaintUpvote(complaintId, userId)
    `CREATE UNIQUE INDEX IF NOT EXISTS "ComplaintUpvote_complaintId_userId_key" ON "ComplaintUpvote"("complaintId", "userId")`,

    // 6. Add indexes on complaintId and userId
    `CREATE INDEX IF NOT EXISTS "ComplaintUpvote_complaintId_idx" ON "ComplaintUpvote"("complaintId")`,
    `CREATE INDEX IF NOT EXISTS "ComplaintUpvote_userId_idx" ON "ComplaintUpvote"("userId")`
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

  console.log(' Cluster 3 DDL successfully applied to Supabase PostgreSQL!');
}

main()
  .catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
