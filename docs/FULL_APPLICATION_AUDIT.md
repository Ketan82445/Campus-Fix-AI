# FULL APPLICATION AUDIT

## 1. Frontend Architecture
- **Framework**: React 18, Vite
- **Routing**: `react-router-dom`
- **State Management**: React Context (`AuthContext`)
- **API Clients**: Axios instance in `api.ts`, resource-specific clients (`complaintApi.ts`, `authApi.ts`, etc.)
- **Authentication State**: Handled by Context. JWT stored in `localStorage` (`campusfix_token`, `campusfix_refresh_token`).
- **File Upload UI**: Native Supabase file uploads via `StorageService`. Custom UI in `AttachmentGallery.tsx`.
- **Dashboards**: Separate views for Student, Technician, and Admin with protected routes (`ProtectedRoute` wrapper).
- **Environment Variables**: Managed via `.env` with `VITE_` prefix for public vars.

## 2. Backend Architecture
- **Framework**: Node.js, Express (TypeScript)
- **Database Access**: Prisma ORM, PostgreSQL (via Supabase PgBouncer pooler).
- **Authentication**: JWT-based access and refresh tokens. Passwords hashed with bcrypt.
- **Middleware**: `auth.ts` (checks JWT), `requireRole` (RBAC), `errorHandler.ts` (centralized error handling), `multer` (file parsing).
- **Controllers/Routes**: Modular setup (`authRoutes`, `complaintRoutes`, `inventoryRoutes`, `workOrderRoutes`, etc.).
- **Services**: Business logic separated from controllers (`complaintService`, `workOrderService`, `storageService`).
- **AI Integration**: Two integrations. 
  - FastAPI (Python) for AI classification.
  - Gemini 1.5 Flash via Google Generative AI SDK in `chatService.ts` for vision and troubleshooting.

## 3. Database Architecture
- **Schema**: Prisma Schema
- **Models**: `User`, `Department`, `Category`, `Complaint`, `WorkOrder`, `InventoryItem`, `WorkOrderPart`, `ComplaintComment`, `ComplaintFollower`, `Incident`, `AuditLog`.
- **Relations**: Strict foreign key constraints with `Cascade` and `SetNull` deletions.
- **Constraints**: Unique emails, unique complaint/work order numbers.
- **Enums**: Roles (`STUDENT`, `TECHNICIAN`, `ADMIN`, etc.), Statuses, Priorities.

## 4. AI Architecture
- **FastAPI / Python**: Local API for categorizing and prioritizing complaints.
- **Gemini**: Directly queried via Node SDK for prompt generation and image analysis.

## 5. Testing and Infrastructure
- **Tests**: Minimal jest unit tests (found via script).
- **Env**: `.env` handles secrets. `.gitignore` is correctly configured to hide `.env`.
