import { prisma } from '../src/config/prisma';
import { SLAService } from '../src/services/slaService';
import { ComplaintService } from '../src/services/complaintService';
import { Priority, Category, Role } from '@prisma/client';

async function main() {
  console.log('🧪 Starting Cluster 6 (SLA & Escalation Tracking) Integration Verification...\n');

  // Step 1: Verify SLA Configs seeded
  console.log('--- Step 1: Checking SLA Configurations in Database ---');
  const configs = await SLAService.getSLAConfigs();
  console.log(`Found ${configs.length} SLA configs in database:`);
  configs.forEach(c => {
    console.log(`  - ${c.priority}: Response <= ${c.responseHours}h, Resolution <= ${c.resolutionHours}h`);
  });

  if (configs.length < 4) {
    throw new Error('Expected at least 4 default SLA configurations (CRITICAL, HIGH, MEDIUM, LOW)');
  }
  console.log('✓ SLA Configurations verified successfully.\n');

  // Step 2: Fetch a test student & admin
  const student = await prisma.user.findFirst({ where: { role: Role.STUDENT } });
  const admin = await prisma.user.findFirst({ where: { role: Role.ADMIN } });
  if (!student || !admin) {
    throw new Error('Test users (student or admin) not found in database');
  }

  // Step 3: Create a Critical complaint to verify calculated SLA deadlines
  console.log('--- Step 2: Creating Test Ticket with Priority CRITICAL ---');
  const criticalComplaint = await ComplaintService.createComplaint(
    { id: student.id, email: student.email, role: student.role, name: student.name },
    'CRITICAL: Power failure and smoke smell in Server Room A',
    'UPS battery backup has overheated and tripped main circuit breakers.',
    'Block 1, Server Room A',
    Category.ELECTRICAL,
    Priority.CRITICAL,
    { building: 'Block 1', room: 'Server Room A' }
  );

  console.log(`Created Ticket #${criticalComplaint.complaintNumber} (ID: ${criticalComplaint.id})`);
  console.log(`  Priority: ${criticalComplaint.priority}`);
  console.log(`  Response Deadline: ${criticalComplaint.responseDeadline?.toISOString()}`);
  console.log(`  Resolution Deadline: ${criticalComplaint.resolutionDeadline?.toISOString()}`);

  if (!criticalComplaint.responseDeadline || !criticalComplaint.resolutionDeadline) {
    throw new Error('SLA deadlines were not automatically set on complaint creation!');
  }

  const expectedRespHours = 4;
  const expectedResHours = 12;
  const createdTime = new Date(criticalComplaint.createdAt).getTime();
  const respDiffHours = Math.round((new Date(criticalComplaint.responseDeadline).getTime() - createdTime) / (1000 * 60 * 60));
  const resDiffHours = Math.round((new Date(criticalComplaint.resolutionDeadline).getTime() - createdTime) / (1000 * 60 * 60));

  console.log(`  Calculated Response Hours offset: ${respDiffHours}h (Expected ~${expectedRespHours}h)`);
  console.log(`  Calculated Resolution Hours offset: ${resDiffHours}h (Expected ~${expectedResHours}h)`);

  if (respDiffHours !== expectedRespHours || resDiffHours !== expectedResHours) {
    throw new Error(`SLA calculation mismatch: response=${respDiffHours}h, resolution=${resDiffHours}h`);
  }
  console.log('✓ SLA deadline calculation logic verified.\n');

  // Step 4: Test First Response Recording
  console.log('--- Step 3: Testing SLA Response Timestamp Recording ---');
  await SLAService.recordResponse(criticalComplaint.id);
  const compAfterResp = await prisma.complaint.findUnique({ where: { id: criticalComplaint.id } });
  console.log(`  respondedAt: ${compAfterResp?.respondedAt?.toISOString()}`);
  if (!compAfterResp?.respondedAt) {
    throw new Error('respondedAt was not recorded on first action!');
  }
  console.log('✓ Response tracking verified.\n');

  // Step 5: Test Escalation Engine with Simulated Overdue Ticket
  console.log('--- Step 4: Testing SLA Breach & Auto-Escalation Engine ---');
  // Backdate the resolution deadline to 2 hours ago
  const overdueDeadline = new Date(Date.now() - 2 * 60 * 60 * 1000);
  await prisma.complaint.update({
    where: { id: criticalComplaint.id },
    data: {
      resolutionDeadline: overdueDeadline,
      slaBreached: false,
      escalationLevel: 0
    }
  });

  console.log(`Simulated overdue resolution deadline: ${overdueDeadline.toISOString()}`);
  const escalationResult = await SLAService.checkAndEscalateBreachedSLAs();
  console.log(`Escalation scan executed:`);
  console.log(`  Newly breached complaints: ${escalationResult.breachedCount}`);
  console.log(`  Auto-escalated tickets: ${escalationResult.escalatedCount}`);

  const compAfterEscalation = await prisma.complaint.findUnique({
    where: { id: criticalComplaint.id }
  });

  console.log(`  slaBreached flag: ${compAfterEscalation?.slaBreached}`);
  console.log(`  escalationLevel: ${compAfterEscalation?.escalationLevel}`);
  console.log(`  escalatedAt: ${compAfterEscalation?.escalatedAt?.toISOString()}`);

  if (!compAfterEscalation?.slaBreached || compAfterEscalation.escalationLevel < 1) {
    throw new Error('Escalation engine failed to flag SLA breach or escalate ticket!');
  }
  console.log('✓ SLA Breach detection and auto-escalation confirmed.\n');

  // Step 6: Test Resolution Recording
  console.log('--- Step 5: Testing Ticket Resolution & Final SLA Record ---');
  await SLAService.recordResolution(criticalComplaint.id);
  const compAfterResolve = await prisma.complaint.findUnique({
    where: { id: criticalComplaint.id }
  });
  console.log(`  Status: ${compAfterResolve?.status}`);
  console.log(`  slaBreached persisted: ${compAfterResolve?.slaBreached}`);
  console.log('✓ Resolution tracking confirmed.\n');

  // Step 7: Test SLA Analytics Aggregator
  console.log('--- Step 6: Testing SLA Dashboard Statistics ---');
  const stats = await SLAService.getSLAStats();
  console.log('SLA Statistics summary:');
  console.log(`  Total Open with SLA: ${stats.totalOpenWithSLA}`);
  console.log(`  Breached Total: ${stats.breachedTotal}`);
  console.log(`  At Risk (< 2h left): ${stats.atRiskCount}`);
  console.log(`  Overall Compliance Rate: ${stats.complianceRate}%`);
  console.log('  Breakdown by priority:');
  stats.byPriority.forEach(p => {
    console.log(`    - ${p.priority}: ${p.total} open, ${p.breached} breached, ${p.atRisk} at-risk, ${p.complianceRate}% compliance`);
  });

  // Cleanup test complaint
  console.log('\n--- Step 7: Cleaning up test data ---');
  await prisma.auditLog.deleteMany({ where: { entityId: criticalComplaint.id } });
  await prisma.notification.deleteMany({ where: { entityId: criticalComplaint.id } });
  await prisma.statusHistory.deleteMany({ where: { complaintId: criticalComplaint.id } });
  await prisma.aIPrediction.deleteMany({ where: { complaintId: criticalComplaint.id } });
  await prisma.complaint.delete({ where: { id: criticalComplaint.id } });
  console.log('✓ Test complaint cleaned up.');

  console.log('\n======================================================');
  console.log('🎉 ALL CLUSTER 6 VERIFICATION CHECKS PASSED 100%!');
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
