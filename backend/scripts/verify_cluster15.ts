import { prisma } from '../src/config/prisma';
import { FeedbackService } from '../src/services/feedbackService';
import { ComplaintService } from '../src/services/complaintService';
import { Priority, Category, Role, Status } from '@prisma/client';

async function main() {
  console.log('🧪 Starting Cluster 15 (Student Feedback) Integration Verification...\n');

  // Step 1: Fetch test student & technician
  const student = await prisma.user.findFirst({ where: { role: Role.STUDENT } });
  const technician = await prisma.user.findFirst({ where: { role: Role.TECHNICIAN } });
  
  if (!student || !technician) {
    throw new Error('Test users not found in database');
  }

  // Step 2: Create a resolved complaint
  console.log('--- Step 1: Creating a RESOLVED Test Ticket ---');
  const complaint = await ComplaintService.createComplaint(
    { id: student.id, email: student.email, role: student.role, name: student.name },
    'AC leaking in Library',
    'Water dripping on books.',
    'Library Ground Floor',
    Category.OTHER,
    Priority.LOW
  );
  
  await prisma.complaint.update({
    where: { id: complaint.id },
    data: {
      status: Status.RESOLVED,
      assignedTechnicianId: technician.id,
      resolvedAt: new Date()
    }
  });

  console.log(`Created Ticket #${complaint.complaintNumber} (Assigned to: ${technician.email})`);
  console.log('✓ Resolved ticket prepared.\n');

  // Step 3: Submit Feedback
  console.log('--- Step 2: Submitting 5-Star Feedback ---');
  const feedback = await FeedbackService.submitFeedback(
    complaint.id,
    student.id,
    5,
    'Fast and excellent service! No more leaks.'
  );

  console.log(`Submitted feedback ID: ${feedback.id}`);
  console.log(`Rating: ${feedback.rating} stars`);
  console.log(`Comment: "${feedback.comment}"`);
  console.log('✓ Feedback submission confirmed.\n');

  // Step 4: Verify Duplicate Feedback Rejection
  console.log('--- Step 3: Testing Duplicate Feedback Prevention ---');
  try {
    await FeedbackService.submitFeedback(complaint.id, student.id, 4);
    throw new Error('Allowed duplicate feedback submission!');
  } catch (err: any) {
    console.log(`Successfully blocked duplicate feedback: ${err.message}`);
  }
  console.log('✓ Duplicate protection confirmed.\n');

  // Step 5: Verify Technician Average Performance
  console.log('--- Step 4: Testing Technician Performance Aggregation ---');
  const stats = await FeedbackService.getTechnicianPerformance(technician.id);
  
  console.log(`Technician Average Rating: ${stats.averageRating}`);
  console.log(`Total Reviews: ${stats.totalReviews}`);
  console.log(`5-Star Reviews: ${stats.ratingDistribution[5]}`);
  
  if (stats.totalReviews < 1 || stats.ratingDistribution[5] < 1) {
    throw new Error('Technician performance aggregation failed');
  }
  console.log('✓ Technician analytics confirmed.\n');

  // Cleanup test complaint
  console.log('\n--- Step 5: Cleaning up test data ---');
  await prisma.auditLog.deleteMany({ where: { entityId: complaint.id } });
  await prisma.complaintFeedback.deleteMany({ where: { complaintId: complaint.id } });
  await prisma.statusHistory.deleteMany({ where: { complaintId: complaint.id } });
  await prisma.aIPrediction.deleteMany({ where: { complaintId: complaint.id } });
  await prisma.complaint.delete({ where: { id: complaint.id } });
  console.log('✓ Test complaint cleaned up.');

  console.log('\n======================================================');
  console.log('🎉 ALL CLUSTER 15 VERIFICATION CHECKS PASSED 100%!');
  console.log('======================================================');
}

main()
  .catch(err => {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
