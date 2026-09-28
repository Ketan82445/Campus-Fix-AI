# CampusFix AI — Database & Model Audit

Date: September 28, 2026
Database System: PostgreSQL 16 (Relational DB)
ORM: Prisma ORM v5.22.0

---

## 🗄️ Relational Entity Verification

### 1. User Model
- **Primary Key**: `id` (UUID)
- **Fields**: `name`, `email` (Unique), `passwordHash`, `role` (`STUDENT`, `TECHNICIAN`, `ADMIN`), `phone`, `departmentId` (FK &rarr; Department), `createdAt`, `updatedAt`.
- **Indexes**: `@@index([email])`, `@@index([role])`.

### 2. Department Model
- **Primary Key**: `id` (UUID)
- **Fields**: `name` (Unique), `code` (Unique), `description`, `createdAt`, `updatedAt`.

### 3. Complaint Model
- **Primary Key**: `id` (UUID)
- **Fields**: `complaintNumber` (Unique e.g. `CMP-2026-0001`), `title`, `description`, `category` (Enum), `priority` (Enum), `location`, `status` (Enum), `aiConfidence`, `createdById` (FK &rarr; User), `departmentId` (FK &rarr; Department), `assignedTechnicianId` (FK &rarr; User).
- **Indexes**: `@@index([status])`, `@@index([category])`, `@@index([priority])`, `@@index([departmentId])`, `@@index([createdById])`, `@@index([assignedTechnicianId])`.

### 4. StatusHistory Model
- Records immutable transitions storing `oldStatus`, `newStatus`, `reason`, `changedById` (FK &rarr; User), and `createdAt`.

### 5. AIPrediction Model
- Stores machine learning inference data: `predictedCategory`, `predictedPriority`, `predictedDepartment`, `confidence`, `modelVersion`, `predictionIndicators` (JSON), `status` (`SUCCESS`, `FAILED`, `LOW_CONFIDENCE`).

### 6. Assignment Model
- Records technician assignment tasks with workload notes and assignment status (`ASSIGNED`, `ACCEPTED`, `IN_PROGRESS`, `COMPLETED`, `REJECTED`).

---

## 🔄 Migration & Seed Verification
- Migration file `prisma/migrations/20260928113149_init/migration.sql` successfully generated and applied.
- Seed script (`prisma/seed.ts`) populates 6 departments, 6 default users (Admin, 4 Technicians, 2 Students), sample complaints, and initial status histories.
