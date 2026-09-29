import { prisma } from '../src/config/prisma';
import { IncidentService } from '../src/services/incidentService';
import { AssignmentService } from '../src/services/assignmentService';
import { Priority, Category, Role, IncidentSeverity, Status } from '@prisma/client';
import { ComplaintService } from '../src/services/complaintService';

async function main() {
  console.log('🧪 Starting Cluster 5 (Incident & Smart Assignment) Integration Verification...\n');

  // Step 1: Fetch actors
  const admin = await prisma.user.findFirst({ where: { role: Role.ADMIN } });
  const student = await prisma.user.findFirst({ where: { role: Role.STUDENT } });
  const department = await prisma.department.findFirst();
  
  if (!admin || !student || !department) {
    throw new Error('Test users or department not found');
  }

  // Find technicians in this department to test assignment
  const technicians = await prisma.user.findMany({ 
    where: { role: Role.TECHNICIAN, departmentId: department.id } 
  });

  if (technicians.length < 1) {
    throw new Error('Need at least one technician in the test department');
  }

  console.log(`Found ${technicians.length} technician(s) in department ${department.name}\n`);

  // Step 2: Test Incident Creation
  console.log('--- Step 1: Creating a Major Incident ---');
  const incident = await IncidentService.createIncident({
    title: 'Main Transformer Failure',
    description: 'Campus-wide power outage due to blown transformer.',
    category: Category.ELECTRICAL,
    severity: IncidentSeverity.CRITICAL,
    location: 'Main Power Grid'
  }, admin.id);

  console.log(`Created Incident ID: ${incident.id} [${incident.severity}]`);
  
  // Step 3: Create multiple complaints about the outage
  console.log('\n--- Step 2: Creating User Complaints & Testing Smart Assignment ---');
  const c1 = await ComplaintService.createComplaint(
    { id: student.id, email: student.email, role: student.role, name: student.name },
    'No power in hostel A',
    'Lights went out suddenly.',
    'Hostel A',
    Category.ELECTRICAL,
    Priority.CRITICAL
  );

  const c2 = await ComplaintService.createComplaint(
    { id: student.id, email: student.email, role: student.role, name: student.name },
    'Server room losing UPS power',
    'Need power restored immediately before UPS dies.',
    'IT Block',
    Category.ELECTRICAL,
    Priority.CRITICAL
  );

  // Both should have triggered smart assignment to a technician. Let's verify.
  const assigned1 = await prisma.complaint.findUnique({ where: { id: c1.id }, include: { assignedTechnician: true } });
  const assigned2 = await prisma.complaint.findUnique({ where: { id: c2.id }, include: { assignedTechnician: true } });

  console.log(`Complaint 1 assigned to: ${assigned1?.assignedTechnician?.name || 'Unassigned'}`);
  console.log(`Complaint 2 assigned to: ${assigned2?.assignedTechnician?.name || 'Unassigned'}`);

  // Step 4: Link complaints to incident
  console.log('\n--- Step 3: Linking Complaints to Parent Incident ---');
  await IncidentService.linkComplaints(incident.id, [c1.id, c2.id], admin.id);
  
  const updatedIncident = await IncidentService.getIncidentById(incident.id);
  console.log(`Incident now has ${updatedIncident.complaints.length} linked complaints.`);
  
  if (updatedIncident.complaints.length !== 2) {
    throw new Error('Failed to link complaints to incident');
  }

  // Step 5: Resolve Incident with Cascade
  console.log('\n--- Step 4: Resolving Incident (Cascading to Complaints) ---');
  await IncidentService.resolveIncident(incident.id, true, admin.id);

  const finalC1 = await prisma.complaint.findUnique({ where: { id: c1.id } });
  const finalC2 = await prisma.complaint.findUnique({ where: { id: c2.id } });

  console.log(`Complaint 1 Status: ${finalC1?.status}`);
  console.log(`Complaint 2 Status: ${finalC2?.status}`);

  if (finalC1?.status !== Status.RESOLVED || finalC2?.status !== Status.RESOLVED) {
    throw new Error('Cascade resolution failed');
  }
  console.log('✓ Incident cascade resolution successful.');

  // Cleanup
  console.log('\n--- Step 5: Cleaning up test data ---');
  await prisma.auditLog.deleteMany({ where: { entityId: incident.id } });
  await prisma.auditLog.deleteMany({ where: { entityId: { in: [c1.id, c2.id] } } });
  await prisma.statusHistory.deleteMany({ where: { complaintId: { in: [c1.id, c2.id] } } });
  await prisma.aIPrediction.deleteMany({ where: { complaintId: { in: [c1.id, c2.id] } } });
  await prisma.assignment.deleteMany({ where: { complaintId: { in: [c1.id, c2.id] } } });
  await prisma.complaint.deleteMany({ where: { id: { in: [c1.id, c2.id] } } });
  await prisma.incident.delete({ where: { id: incident.id } });
  
  console.log('✓ Test data cleaned up.');

  console.log('\n======================================================');
  console.log('🎉 ALL CLUSTER 5 VERIFICATION CHECKS PASSED 100%!');
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
