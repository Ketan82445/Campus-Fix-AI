# CampusFix AI — Security Audit & Hardening Report

Date: September 28, 2026
Auditor: Cybersecurity & Backend Lead

---

## 🛡️ Implemented Security Controls

### 1. Password Hashing & Secret Management
- **Algorithm**: `bcryptjs` with 10 salt rounds.
- Plaintext passwords are **NEVER** stored or printed in logs.
- Database seeds and API registrations hash passwords prior to persistence.
- JWT Secrets are injected strictly via `.env` variables (`JWT_SECRET`, `JWT_REFRESH_SECRET`).

### 2. Authentication & JWT Tokens
- Bearer JWT token strategy (`Authorization: Bearer <token>`).
- Token expiration enforced (`1d`).
- `GET /api/auth/me` verifies signature on every session initialization.

### 3. Role-Based Access Control (RBAC)
- Middleware enforced on Express routes: `requireRole(Role.ADMIN)`, `requireRole(Role.TECHNICIAN)`, `requireRole(Role.STUDENT)`.
- **Student Scoping**: Students can only view their own created complaints (`createdById == req.user.id`). Direct ID queries (IDOR attempts) on other students' complaints return `403 Forbidden`.
- **Technician Scoping**: Technicians can only update status on complaints assigned to them or within their designated department.
- **Admin Scoping**: Admins hold full system visibility, AI review override permissions, and user management capabilities.

### 4. Input Validation & Mass Assignment Defense
- **Validation Engine**: Zod schemas (`createComplaintSchema`, `updateStatusSchema`, `reviewAIPredictionSchema`, `registerSchema`).
- Requests containing illegal fields (e.g. attempting to pass `"role": "ADMIN"` on student registration) are stripped or rejected before database execution.

### 5. HTTP Security Headers & Rate Limiting
- **Helmet**: Configured on Express app to inject `X-Frame-Options`, `X-Content-Type-Options: nosniff`, `X-XSS-Protection`, and `Content-Security-Policy`.
- **Rate Limiting**: `express-rate-limit` configured to limit requests to 300 per 15-minute window per IP, returning `429 Too Many Requests` when exceeded.

### 6. AI Microservice Resilience & Error Masking
- System errors and database stack traces are caught by global Express error middleware (`errorHandler.ts`).
- Users receive sanitized error messages (`{ success: false, error: { code, message } }`).
- If the Python AI service is down or times out, the system automatically catches the failure and flags the ticket for manual admin review (`AI_REVIEW_REQUIRED`) without crashing or exposing raw socket errors.

---

## 🔒 Security Audit Test Results

| Security Test Case | Target Endpoint | Input / Action | Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Authentication Bypass** | `GET /api/complaints` | No token header | `401 Unauthorized` | **PASS** |
| **Role Escalation (RBAC)** | `GET /api/analytics/overview` | Student JWT token | `403 Forbidden` | **PASS** |
| **IDOR Protection** | `GET /api/complaints/:id` | Student querying another student's ticket | `403 Forbidden` | **PASS** |
| **Mass Assignment** | `POST /api/auth/register` | Passing `role: "ADMIN"` | Role defaults to `STUDENT` | **PASS** |
| **XSS / Script Injection** | `POST /api/complaints` | Title: `<script>alert(1)</script>` | HTML entity escaped / sanitized | **PASS** |
| **SQL Injection** | `GET /api/complaints?search=' OR 1=1--` | Parameterized Prisma query | Paramaterized safely by Prisma | **PASS** |
