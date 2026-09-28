# CampusFix AI — API Test & Verification Report

Date of Verification: September 28, 2026
Environment: Local Integrated Dev / Staging (PostgreSQL + Express + FastAPI)
Test Runner: Jest + Supertest & PowerShell / Curl HTTP Client

---

## 📊 Complete API Endpoint Matrix

| Method | Endpoint | Auth | Role Required | Expected Code | Actual Code | Verification Status | Notes / Payload Verification |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | No | Public | 200 OK | 200 OK | **PASS** | Returns status of Backend, PostgreSQL, and FastAPI AI service |
| `POST` | `/api/auth/register` | No | Public | 201 Created | 201 Created | **PASS** | Validates email uniqueness & hashes password with bcrypt |
| `POST` | `/api/auth/login` | No | Public | 200 OK | 200 OK | **PASS** | Returns JWT bearer token & sanitized user object |
| `GET` | `/api/auth/me` | Yes | Any | 200 OK | 200 OK | **PASS** | Validates JWT header & returns profile |
| `POST` | `/api/auth/logout` | Yes | Any | 200 OK | 200 OK | **PASS** | Clears session token |
| `POST` | `/api/complaints` | Yes | STUDENT / ADMIN | 201 Created | 201 Created | **PASS** | Calls AI microservice, auto-classifies, maps dept & auto-assigns tech |
| `GET` | `/api/complaints` | Yes | Any | 200 OK | 200 OK | **PASS** | Paginated results with RBAC scoping (Students see own, Techs see assigned) |
| `GET` | `/api/complaints/:id` | Yes | Any | 200 OK | 200 OK | **PASS** | Returns timeline, AI confidence, technician details & comments |
| `POST` | `/api/complaints/:id/status` | Yes | Any | 200 OK | 200 OK | **PASS** | Enforces valid status transitions & records status history |
| `POST` | `/api/complaints/:id/reopen` | Yes | STUDENT / ADMIN | 200 OK | 200 OK | **PASS** | Reopens ticket (`RESOLVED` &rarr; `REOPENED` &rarr; `IN_PROGRESS`) |
| `POST` | `/api/complaints/:id/review-ai`| Yes | ADMIN | 200 OK | 200 OK | **PASS** | Overrides low-confidence AI category, priority & department |
| `POST` | `/api/complaints/:id/comments` | Yes | Any | 201 Created | 201 Created | **PASS** | Posts discussion notes or technician internal notes |
| `GET` | `/api/analytics/overview` | Yes | ADMIN | 200 OK | 200 OK | **PASS** | Returns real database counts (Total, Open, Critical, Resolved) |
| `GET` | `/api/analytics/categories` | Yes | ADMIN | 200 OK | 200 OK | **PASS** | PostgreSQL `groupBy` category distribution |
| `GET` | `/api/analytics/departments` | Yes | ADMIN | 200 OK | 200 OK | **PASS** | Active technician workload per department |
| `GET` | `/api/analytics/recurring` | Yes | ADMIN | 200 OK | 200 OK | **PASS** | Clusters complaints by Location + Category to flag infrastructure risks |
| `GET` | `/api/users/technicians` | Yes | Any | 200 OK | 200 OK | **PASS** | Returns technician directory with workload task counts |
| `GET` | `/api/notifications` | Yes | Any | 200 OK | 200 OK | **PASS** | User notification queue |

---

## 🧪 Edge Cases & Security Boundary Tests

1. **Unauthenticated Access Attempt**:
   - `GET /api/analytics/overview` without `Authorization` header.
   - Result: `401 Unauthorized` (`code: "UNAUTHORIZED"`). **PASS**
2. **Forbidden Access Attempt (RBAC)**:
   - Student JWT attempting `GET /api/analytics/overview`.
   - Result: `403 Forbidden` (`code: "FORBIDDEN"`). **PASS**
3. **Invalid Email Registration**:
   - `POST /api/auth/register` with duplicate email.
   - Result: `400 Bad Request` (`code: "USER_EXISTS"`). **PASS**
4. **Malformed Validation Payload**:
   - `POST /api/complaints` with 2-character title.
   - Result: `400 Bad Request` (`code: "VALIDATION_ERROR"`). **PASS**
