# CampusFix AI Security Architecture

This document details the security architecture and mechanisms protecting the CampusFix AI application.

## 1. Trust Model
**Rule 1**: The Frontend is fundamentally untrusted.
* All data originating from the client is treated as hostile.
* User IDs provided in JSON payloads are ignored in favor of the authenticated ID extracted from the JWT.
* Roles provided by the client during registration are discarded. The backend enforces defaults (`STUDENT`).

## 2. Authentication & Authorization

### 2.1. JWT Strategy
* Authentication is handled via stateless JSON Web Tokens (JWTs).
* Tokens are signed with a strong `JWT_SECRET` maintained in environment variables.
* Tokens have a finite expiration time.
* The frontend stores tokens in `localStorage` and transmits them via the `Authorization: Bearer` header, inherently protecting against CSRF attacks.

### 2.2. Role-Based Access Control (RBAC)
* Access is governed by custom Express middleware (`authenticate`, `authorize`).
* **authenticate**: Validates the JWT signature and extracts the user payload.
* **authorize(Role[])**: Restricts endpoint access to specific roles (e.g., `ADMIN`, `TECHNICIAN`, `STUDENT`).
* The system prevents horizontal privilege escalation (IDOR) by explicitly checking database record ownership against the authenticated user's ID before allowing modifications.

## 3. Data Protection

### 3.1. Input Validation & Sanitization
* **Validation**: All incoming requests are validated against strict Zod schemas before reaching the controllers.
* **Sanitization**: String inputs (titles, descriptions) are passed through a custom Regex-based XSS Sanitizer to strip dangerous HTML and `<script>` tags.
* **Database Queries**: Prisma ORM is used exclusively, automatically parameterizing all queries to prevent SQL Injection.

### 3.2. Error Handling
* Express uses a global error-handling middleware (`errorHandler.ts`).
* Internal stack traces and database schema details (Prisma error codes) are masked from the client.
* The API returns standardized JSON error responses.

## 4. Infrastructure Security

### 4.1. File Uploads (Supabase)
* Local filesystem storage is prohibited.
* Files are streamed directly to a Supabase Storage Bucket.
* The `StorageService` enforces strict limits:
  * Maximum file size: 5MB.
  * Allowed MIME types: `image/jpeg`, `image/png`, `application/pdf`.
  * Filenames are sanitized to prevent directory traversal (`../`).

### 4.2. Network Security
* **Helmet**: Sets secure HTTP headers (HSTS, Content Security Policy, X-Frame-Options) to protect against common web vulnerabilities.
* **CORS**: Configured with a strict origin whitelist, rejecting unauthorized cross-origin requests.
* **Rate Limiting**: Critical endpoints (e.g., `/api/auth/login`, `/api/auth/register`) are protected by `express-rate-limit` to thwart brute-force attacks.

### 4.3. AI Security
* The AI Service context is strictly scoped to the authenticated user's role and ID.
* The AI cannot retrieve or modify records outside the user's explicit permissions, preventing prompt injection attacks from bypassing RBAC.
