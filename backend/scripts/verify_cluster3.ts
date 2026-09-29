import { prisma } from '../src/config/prisma';
import { ComplaintSimilarityService } from '../src/services/complaintSimilarityService';
import { ComplaintService } from '../src/services/complaintService';
import { Category, Priority, Role } from '@prisma/client';

async function main() {
  console.log('🧪 Starting Cluster 3 & Cluster 20 Integration Verification...');

  // 1. Fetch or create test user
  const student = await prisma.user.findFirst({ where: { role: Role.STUDENT } });
  const admin = await prisma.user.findFirst({ where: { role: Role.ADMIN } });

  if (!student || !admin) {
    throw new Error('Test users not found');
  }

  console.log(`👤 Using test student: ${student.email}`);
  console.log(`👑 Using test admin: ${admin.email}`);

  // 2. Create primary complaint
  console.log('\n--- Step 1: Creating Primary Complaint ---');
  const primaryComp = await ComplaintService.createComplaint(
    { id: student.id, email: student.email, role: student.role, name: student.name },
    'Ceiling projector flickering and overheating in Computer Lab 3',
    'The overhead projector in Lab 3 shuts down after 10 minutes of display.',
    'CS & IT Block, 2nd Floor, Computer Lab 3',
    Category.IT_NETWORK,
    Priority.HIGH,
    {
      building: 'CS & IT Block',
      floor: '2nd Floor',
      room: 'Computer Lab 3'
    }
  );

  console.log(` Primary complaint created: #${primaryComp.complaintNumber} (ID: ${primaryComp.id})`);

  // 3. Test Similarity Search
  console.log('\n--- Step 2: Testing Duplicate & Similar Search Service ---');
  const similarityService = new ComplaintSimilarityService(prisma);
  const matches = await similarityService.findSimilarComplaints({
    title: 'Projector display failing in Computer Lab 3',
    description: 'Overhead projector won\'t stay on in Lab 3',
    location: 'CS & IT Block Lab 3',
    building: 'CS & IT Block',
    room: 'Computer Lab 3',
    category: Category.IT_NETWORK,
    userId: admin.id
  });

  console.log(` Matches found: ${matches.length}`);
  matches.forEach((m, idx) => {
    console.log(`  Match #${idx + 1}: ${m.complaintNumber} | Similarity: ${m.similarityScore}% | Reasons: ${m.matchReasons.join('; ')}`);
  });

  if (matches.length === 0 || matches[0].id !== primaryComp.id) {
    throw new Error('Expected similarity service to identify primary complaint');
  }
  console.log(' Similarity detection algorithm validated!');

  // 4. Test Community Issue Confirmation (Upvoting - Cluster 20)
  console.log('\n--- Step 3: Testing "I\'m Affected Too" Community Confirmation ---');
  const upvote1 = await ComplaintService.toggleUpvote(primaryComp.id, {
    id: admin.id,
    email: admin.email,
    role: admin.role,
    name: admin.name
  });
  console.log(` Toggled Upvote: upvoted=${upvote1.upvoted}, totalCount=${upvote1.upvoteCount}`);

  const compDetails = await ComplaintService.getComplaintById(primaryComp.id, {
    id: admin.id,
    email: admin.email,
    role: admin.role,
    name: admin.name
  });
  console.log(` Retrieved Complaint: hasUpvoted=${compDetails.hasUpvoted}, upvoteCount=${compDetails.upvoteCount}`);

  if (!compDetails.hasUpvoted || compDetails.upvoteCount !== 1) {
    throw new Error('Expected upvote state to be active with count 1');
  }

  // Toggle off
  const upvote2 = await ComplaintService.toggleUpvote(primaryComp.id, {
    id: admin.id,
    email: admin.email,
    role: admin.role,
    name: admin.name
  });
  console.log(` Untoggled Upvote: upvoted=${upvote2.upvoted}, totalCount=${upvote2.upvoteCount}`);
  if (upvote2.upvoted !== false || upvote2.upvoteCount !== 0) {
    throw new Error('Expected upvote toggle off to return count 0');
  }

  // 5. Test Duplicate Linking
  console.log('\n--- Step 4: Testing Duplicate Linking & Merge ---');
  const duplicateComp = await ComplaintService.createComplaint(
    { id: student.id, email: student.email, role: student.role, name: student.name },
    'Lab 3 projector not turning on at all',
    'Black screen when turning on projector in Lab 3.',
    'CS & IT Block Lab 3',
    Category.IT_NETWORK,
    Priority.HIGH,
    {
      building: 'CS & IT Block',
      floor: '2nd Floor',
      room: 'Computer Lab 3'
    }
  );

  console.log(` Created duplicate candidate: #${duplicateComp.complaintNumber} (ID: ${duplicateComp.id})`);

  // Admin marks as duplicate
  const marked = await ComplaintService.markAsDuplicate(
    duplicateComp.id,
    primaryComp.id,
    { id: admin.id, email: admin.email, role: admin.role, name: admin.name },
    'Identical projector failure in Computer Lab 3.'
  );

  console.log(` Ticket #${duplicateComp.complaintNumber} status: ${marked.status}, duplicateOfId: ${marked.duplicateOfId}`);
  if (marked.status !== 'CLOSED' || marked.duplicateOfId !== primaryComp.id) {
    throw new Error('Expected marked duplicate to have status CLOSED and duplicateOfId set');
  }

  // Check primary complaint shows duplicate in list
  const primaryWithDuplicates = await ComplaintService.getComplaintById(primaryComp.id, {
    id: admin.id,
    email: admin.email,
    role: admin.role,
    name: admin.name
  });

  console.log(` Primary complaint #${primaryComp.complaintNumber} has ${primaryWithDuplicates.duplicates?.length || 0} linked duplicate(s)`);
  if (!primaryWithDuplicates.duplicates?.some(d => d.id === duplicateComp.id)) {
    throw new Error('Expected primary complaint to contain duplicate in its duplicates list');
  }

  // Cleanup test tickets
  console.log('\n--- Step 5: Cleanup Test Records ---');
  await prisma.complaint.delete({ where: { id: duplicateComp.id } });
  await prisma.complaint.delete({ where: { id: primaryComp.id } });
  console.log(' Cleaned up test complaints.');

  console.log('\n🎉 ALL CLUSTER 3 & CLUSTER 20 VERIFICATIONS PASSED 100%!');
}

main()
  .catch((err) => {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
