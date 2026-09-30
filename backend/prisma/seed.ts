import { PrismaClient, Role, Category, Priority, Status } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Clean existing records in reverse order
  await prisma.complaintComment.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.aIPrediction.deleteMany();
  await prisma.statusHistory.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  // 2. Create Departments
  const deptIT = await prisma.department.create({
    data: {
      name: 'IT & Network Services',
      code: 'IT_NETWORK',
      description: 'Handles Wi-Fi, ethernet, server, software and network hardware issues.'
    }
  });

  const deptElectrical = await prisma.department.create({
    data: {
      name: 'Electrical Maintenance',
      code: 'ELECTRICAL',
      description: 'Handles wiring, power outages, switches, fans, lighting and electrical fixtures.'
    }
  });

  const deptPlumbing = await prisma.department.create({
    data: {
      name: 'Plumbing & Sanitation',
      code: 'PLUMBING',
      description: 'Handles water leaks, washrooms, pipe bursts, drainage and water supply.'
    }
  });

  const deptHousekeeping = await prisma.department.create({
    data: {
      name: 'Housekeeping & Cleaning',
      code: 'CLEANING',
      description: 'Handles cleanliness, waste management, classroom hygiene and washroom sanitization.'
    }
  });

  const deptFacilities = await prisma.department.create({
    data: {
      name: 'Infrastructure & Facilities',
      code: 'INFRASTRUCTURE',
      description: 'Handles furniture, doors, windows, classroom projectors, boards and structural damage.'
    }
  });

  const deptSecurity = await prisma.department.create({
    data: {
      name: 'Campus Security',
      code: 'SECURITY',
      description: 'Handles security concerns, unauthorized access, lost items and safety hazards.'
    }
  });

  console.log('✅ Departments created.');

  // 3. Password Hashing
  const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

  // 4. Create Users
  const adminUser = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@campusfix.local',
      passwordHash: defaultPasswordHash,
      role: Role.ADMIN,
      phone: '+91 9876543210'
    }
  });

  const techNetwork = await prisma.user.create({
    data: {
      name: 'Alex Network',
      email: 'tech.network@campusfix.local',
      passwordHash: defaultPasswordHash,
      role: Role.TECHNICIAN,
      phone: '+91 9876543211',
      departmentId: deptIT.id
    }
  });

  const techElec = await prisma.user.create({
    data: {
      name: 'Bob Sparks',
      email: 'tech.elec@campusfix.local',
      passwordHash: defaultPasswordHash,
      role: Role.TECHNICIAN,
      phone: '+91 9876543212',
      departmentId: deptElectrical.id
    }
  });

  const techPlumb = await prisma.user.create({
    data: {
      name: 'Charlie Pipes',
      email: 'tech.plumb@campusfix.local',
      passwordHash: defaultPasswordHash,
      role: Role.TECHNICIAN,
      phone: '+91 9876543213',
      departmentId: deptPlumbing.id
    }
  });

  const techClean = await prisma.user.create({
    data: {
      name: 'David Clean',
      email: 'tech.housekeeping@campusfix.local',
      passwordHash: defaultPasswordHash,
      role: Role.TECHNICIAN,
      phone: '+91 9876543214',
      departmentId: deptHousekeeping.id
    }
  });

  const student1 = await prisma.user.create({
    data: {
      name: 'Rahul Sharma',
      email: 'student1@campusfix.local',
      passwordHash: defaultPasswordHash,
      role: Role.STUDENT,
      phone: '+91 9876543215'
    }
  });

  const student2 = await prisma.user.create({
    data: {
      name: 'Priya Patel',
      email: 'student2@campusfix.local',
      passwordHash: defaultPasswordHash,
      role: Role.STUDENT,
      phone: '+91 9876543216'
    }
  });

  console.log('✅ Users created.');

  // 5. Seed Sample Complaints
  const cmp1 = await prisma.complaint.create({
    data: {
      complaintNumber: 'CMP-2026-001',
      title: 'Wi-Fi not working in Computer Lab 3',
      description: 'Internet has stopped working completely in Computer Lab 3 since morning. Students are unable to access lab assignments.',
      category: Category.IT_NETWORK,
      priority: Priority.HIGH,
      location: 'Computer Lab 3, CS Block 2nd Floor',
      status: Status.ASSIGNED,
      aiConfidence: 0.94,
      createdById: student1.id,
      departmentId: deptIT.id,
      assignedTechnicianId: techNetwork.id,
      statusHistory: {
        create: [
          { oldStatus: null, newStatus: Status.SUBMITTED, reason: 'Complaint submitted by student', changedById: student1.id },
          { oldStatus: Status.SUBMITTED, newStatus: Status.AI_ANALYZING, reason: 'AI processing complaint', changedById: null },
          { oldStatus: Status.AI_ANALYZING, newStatus: Status.ASSIGNED, reason: 'Auto-routed to IT & assigned to Alex Network', changedById: adminUser.id }
        ]
      },
      aiPredictions: {
        create: [
          {
            predictedCategory: Category.IT_NETWORK,
            predictedPriority: Priority.HIGH,
            predictedDepartment: 'IT & Network Services',
            confidence: 0.94,
            modelVersion: 'campusfix-v1',
            predictionIndicators: JSON.stringify(['Wi-Fi', 'Internet', 'Computer Lab', 'access']),
            status: 'SUCCESS'
          }
        ]
      },
      assignments: {
        create: [
          {
            technicianId: techNetwork.id,
            assignedById: adminUser.id,
            notes: 'Check access point router in Lab 3'
          }
        ]
      }
    }
  });

  const cmp2 = await prisma.complaint.create({
    data: {
      complaintNumber: 'CMP-2026-002',
      title: 'Water leakage near 2nd floor washroom',
      description: 'Major water leakage from pipe in the 2nd floor corridor washroom, causing slippery floor.',
      category: Category.PLUMBING,
      priority: Priority.HIGH,
      location: 'Main Academic Building, 2nd Floor Washroom',
      status: Status.IN_PROGRESS,
      aiConfidence: 0.89,
      createdById: student2.id,
      departmentId: deptPlumbing.id,
      assignedTechnicianId: techPlumb.id,
      statusHistory: {
        create: [
          { oldStatus: null, newStatus: Status.SUBMITTED, reason: 'Complaint submitted by student', changedById: student2.id },
          { oldStatus: Status.SUBMITTED, newStatus: Status.ASSIGNED, reason: 'Assigned to plumbing technician', changedById: adminUser.id },
          { oldStatus: Status.ASSIGNED, newStatus: Status.IN_PROGRESS, reason: 'Technician started repairing pipe', changedById: techPlumb.id }
        ]
      },
      assignments: {
        create: [
          {
            technicianId: techPlumb.id,
            assignedById: adminUser.id,
            status: 'IN_PROGRESS',
            notes: 'Inspecting main supply valve'
          }
        ]
      }
    }
  });

  const cmp3 = await prisma.complaint.create({
    data: {
      complaintNumber: 'CMP-2026-003',
      title: 'Broken fan switch in Room 204',
      description: 'The ceiling fan switch in Room 204 is loose and sparking when turned on.',
      category: Category.ELECTRICAL,
      priority: Priority.MEDIUM,
      location: 'Room 204, Mechanical Block',
      status: Status.RESOLVED,
      aiConfidence: 0.91,
      createdById: student1.id,
      departmentId: deptElectrical.id,
      assignedTechnicianId: techElec.id,
      resolvedAt: new Date(),
      statusHistory: {
        create: [
          { oldStatus: null, newStatus: Status.SUBMITTED, reason: 'Complaint created', changedById: student1.id },
          { oldStatus: Status.SUBMITTED, newStatus: Status.ASSIGNED, reason: 'Assigned to Bob Sparks', changedById: adminUser.id },
          { oldStatus: Status.ASSIGNED, newStatus: Status.IN_PROGRESS, reason: 'Work started', changedById: techElec.id },
          { oldStatus: Status.IN_PROGRESS, newStatus: Status.RESOLVED, reason: 'Replaced fan switchboard', changedById: techElec.id }
        ]
      },
      assignments: {
        create: [
          {
            technicianId: techElec.id,
            assignedById: adminUser.id,
            status: 'COMPLETED',
            notes: 'Switchboard replaced successfully'
          }
        ]
      }
    }
  });

  console.log('✅ Sample complaints created.');

  // 6. Audit Log
  await prisma.auditLog.create({
    data: {
      actorId: adminUser.id,
      action: 'SYSTEM_SEEDED',
      entityType: 'SYSTEM',
      metadata: JSON.stringify({ seededAt: new Date() })
    }
  });

  console.log('🎉 Database seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
