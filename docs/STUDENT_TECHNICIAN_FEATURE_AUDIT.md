# CampusFix AI — Student & Technician Feature Audit

## 1. Existing Functionality
*   **Database Foundation**: Prisma schema is remarkably robust. It already contains `Complaint`, `WorkOrder`, `WorkOrderPart`, `Asset`, `AssetMaintenance`, `Incident`, and `Notification`.
*   **Roles & RBAC**: Fully implemented for `STUDENT`, `TECHNICIAN`, and `ADMIN`.
*   **Work Order Statuses**: The `WorkOrderStatus` enum already supports advanced states like `WAITING_FOR_PARTS` and `WAITING_FOR_APPROVAL`.
*   **Complaint Form**: `CreateComplaintPage` exists with file uploads (Supabase-backed), QR pre-filling (`building`, `floor`, `room`), and basic multilingual placeholders.
*   **AI Integration**: Two distinct AI systems exist:
    *   `chatService.ts`: Node.js based Gemini integration for chatbot queries.
    *   `ai-service` (Python/FastAPI) & `aiClientService.ts`: Dedicated classification service for priority, category, and department predictions.
*   **Similarity Detection**: `complaintSimilarityService.ts` actively uses NLP tokenization (Jaccard similarity) to detect duplicates.

## 2. Partially Implemented Functionality
*   **AI Structuring**: AI predicts category/priority, but the UI is a single form rather than a guided, interactive "review and edit" wizard.
*   **Similar Complaints**: The frontend shows a banner for similar complaints, but lacks the ability for students to "Follow" the issue or confirm "Me Too" without creating a new complaint.
*   **SLA Tracking**: `SLAConfig` exists in the database, but the UI lacks real-time countdown indicators and breach warnings.
*   **Messaging**: `ComplaintComment` exists, but there is no dedicated, real-time threaded chat interface specifically linking Students and Technicians.

## 3. Missing Functionality
*   **Student Wizard**: Multi-step guided complaint creation is missing.
*   **Drafts**: No mechanism (either local or backend `Status.DRAFT`) to save incomplete complaints.
*   **Voice/Photo AI**: No speech-to-text ingestion or image-based AI diagnostics.
*   **Technician Command Center**: Current technician dashboard is basic; lacks one-tap workflow transitions (Start, Pause, Resolve).
*   **Technician Timer**: No mechanism to track actual active labor duration versus waiting time.
*   **Asset History View**: Technicians cannot easily pull up an asset's historical recurring issues while on the job.
*   **Offline Mode**: No Service Worker or local caching for offline technician operations.
*   **Shift Handover & Skills**: Technician routing based on `TechnicianSkill`, `TechnicianCertification`, or `TechnicianAvailability`.
*   **Part Requests**: While `WorkOrderPart` exists for *used* parts, there is no formal workflow for *requesting* a spare part that is out of stock.

## 4. Reusable Components
*   **Uploads**: The Supabase `StorageService` and `handleFileSelect` logic can be perfectly reused for Technician "Before/After" evidence.
*   **QR Scanner**: The existing QR code parser can be reused for Technician Asset scanning.
*   **API Clients**: The Axios interceptor setup securely handles JWTs and can be cleanly extended for new endpoints.

## 5. Required Database Changes
*   **Draft Status**: Extend `Status` enum to include `DRAFT` (or handle strictly via `localStorage`).
*   **Followers**: Create `ComplaintFollower` model to allow users to subscribe to incidents.
*   **Technician Profiles**: Create `TechnicianSkill`, `TechnicianCertification`, and `TechnicianAvailability` models.
*   **Parts Workflow**: Create `PartRequest` model for inventory approval flows.
*   **Work Order History**: Create `WorkOrderStatusHistory` to track precise timestamps of state changes (Start, Pause, Resume).

## 6. Required API Changes
*   **Wizard Endpoints**: API support for saving/resuming drafts.
*   **Follow Issue**: `POST /api/complaints/:id/follow` to attach a user to a known issue.
*   **Technician Workflow**: `POST /api/work-orders/:id/transition` to strictly validate state changes (e.g., `ASSIGNED` -> `IN_PROGRESS`).
*   **Part Requests**: Endpoints for requesting and approving inventory.

## 7. Required Frontend Changes
*   **Refactor `CreateComplaintPage`**: Convert into a multi-step `<ComplaintWizard>` component.
*   **Voice Input**: Integrate Web Speech API (or backend Whisper) for the `Describe the issue` step.
*   **Technician UI**: Build `<TechnicianJobCard>`, `<SLAIndicator>`, `<WorkOrderChecklist>`, and `<AssetHistory>` components.
*   **Mobile Optimization**: Ensure touch targets are massive for the Technician One-Tap workflow.

## 8. Integration Risks
*   **Database Migrations**: Altering Enums (like `Status`) in PostgreSQL via Prisma can sometimes be tricky or require manual SQL if dropping values, though adding `DRAFT` is safe.
*   **AI Dependency**: The wizard relies heavily on the `ai-service`. If the Python backend fails or times out, the frontend must gracefully fallback to manual entry without blocking the student.
*   **State Conflicts**: Concurrency issues if two technicians try to "Accept" the same ticket simultaneously.

## 9. Security Considerations
*   **Draft Privacy**: Students must only be able to fetch their own drafts via strict IDOR checks.
*   **Technician Boundaries**: Technicians must only interact with Work Orders assigned to them or their department. They cannot approve their own part requests.
*   **Evidence Integrity**: "Before/After" photos must be immutable once the Work Order is closed to prevent audit tampering.
*   **Anonymous Reporting**: If implemented, must rigorously strip `userId` references while retaining enough metadata for institutional auditing (if required).
