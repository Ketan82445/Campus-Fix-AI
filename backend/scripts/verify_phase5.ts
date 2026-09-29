import { prisma } from '../src/config/prisma';
import { AnalyticsService } from '../src/services/analyticsService';
import { ComplaintService } from '../src/services/complaintService';
import { Priority, Category, Role } from '@prisma/client';

async function main() {
  console.log('🧪 Starting Phase 5 (Clusters 7 & 8) Analytics Verification...\n');

  const student = await prisma.user.findFirst({ where: { role: Role.STUDENT } });
  if (!student) throw new Error('Student not found for testing');

  // Step 1: Create a recurring issue (3 issues in same location/category)
  console.log('--- Step 1: Simulating Recurring Issue Cluster ---');
  const c1 = await ComplaintService.createComplaint(
    { id: student.id, email: student.email, role: student.role, name: student.name },
    'AC not working', 'Blowing hot air', 'Lab 3', Category.ELECTRICAL, Priority.MEDIUM
  );
  const c2 = await ComplaintService.createComplaint(
    { id: student.id, email: student.email, role: student.role, name: student.name },
    'AC leaking', 'Water dropping', 'Lab 3', Category.ELECTRICAL, Priority.MEDIUM
  );
  const c3 = await ComplaintService.createComplaint(
    { id: student.id, email: student.email, role: student.role, name: student.name },
    'AC noise', 'Loud buzzing', 'Lab 3', Category.ELECTRICAL, Priority.LOW
  );

  // Set building/floor explicitly via raw update to bypass default fields
  await prisma.complaint.updateMany({
    where: { id: { in: [c1.id, c2.id, c3.id] } },
    data: { building: 'Science Block', floor: '1st Floor' }
  });

  // Step 2: Verify Recurring Issues Engine
  console.log('--- Step 2: Running Recurring Issues Engine ---');
  const recurring = await AnalyticsService.getRecurringIssues(30);
  const lab3Cluster = recurring.find(r => r.location === 'Lab 3' && r.category === Category.ELECTRICAL);

  console.log(recurring);
  if (!lab3Cluster) throw new Error('Failed to detect recurring issue cluster in Lab 3');
  console.log(`Detected Cluster in Lab 3: ${lab3Cluster.count} occurrences. Severity: ${lab3Cluster.severity}`);
  console.log('✓ Recurring Issues logic verified.\n');

  // Step 3: Verify Hotspots Engine
  console.log('--- Step 3: Running Problem Hotspots Engine ---');
  const hotspots = await AnalyticsService.getProblemHotspots(30);
  const scienceBlockHotspot = hotspots.byBuildingAndFloor.find(h => h.building === 'Science Block' && h.floor === '1st Floor');
  
  if (!scienceBlockHotspot) throw new Error('Failed to detect Science Block hotspot');
  console.log(`Detected Hotspot: ${scienceBlockHotspot.building}, ${scienceBlockHotspot.floor} (${scienceBlockHotspot.issueCount} issues)`);
  console.log('✓ Problem Hotspots logic verified.\n');

  // Cleanup
  console.log('--- Step 4: Cleaning up test data ---');
  await prisma.auditLog.deleteMany({ where: { entityId: { in: [c1.id, c2.id, c3.id] } } });
  await prisma.aIPrediction.deleteMany({ where: { complaintId: { in: [c1.id, c2.id, c3.id] } } });
  await prisma.statusHistory.deleteMany({ where: { complaintId: { in: [c1.id, c2.id, c3.id] } } });
  await prisma.assignment.deleteMany({ where: { complaintId: { in: [c1.id, c2.id, c3.id] } } });
  await prisma.complaint.deleteMany({ where: { id: { in: [c1.id, c2.id, c3.id] } } });
  
  console.log('✓ Test data cleaned up.');
  console.log('\n======================================================');
  console.log('🎉 ALL PHASE 5 VERIFICATION CHECKS PASSED 100%!');
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
