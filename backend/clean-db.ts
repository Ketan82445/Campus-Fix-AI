import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Deleting orphaned upvotes...');
  const result = await prisma.$executeRaw`
    DELETE FROM "ComplaintUpvote" 
    WHERE "complaintId" NOT IN (SELECT id FROM "Complaint");
  `;
  console.log(`Deleted orphaned upvotes: ${result}`);
  
  console.log('Deleting orphaned attachments...');
  const result2 = await prisma.$executeRaw`
    DELETE FROM "FileAttachment" 
    WHERE "complaintId" IS NOT NULL AND "complaintId" NOT IN (SELECT id FROM "Complaint");
  `;
  console.log(`Deleted orphaned attachments: ${result2}`);

  console.log('Deleting orphaned feedbacks...');
  const result3 = await prisma.$executeRaw`
    DELETE FROM "ComplaintFeedback" 
    WHERE "complaintId" NOT IN (SELECT id FROM "Complaint");
  `;
  console.log(`Deleted orphaned feedbacks: ${result3}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
