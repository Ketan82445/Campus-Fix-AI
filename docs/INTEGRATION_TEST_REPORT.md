# CampusFix AI — Integration Test Report

Date: September 28, 2026

---

## 🔄 Verified Integration Paths

### 1. Frontend &rarr; Backend Integration
- Centralized Axios client (`frontend/src/services/api.ts`) configured with `baseURL = import.meta.env.VITE_API_BASE_URL`.
- JWT token attached automatically via Axios request interceptor (`Authorization: Bearer <token>`).
- Global 401 response interceptor clears expired tokens and redirects to `/login`.
- Verified live React state updates upon API responses across Student, Technician, and Admin dashboards.

### 2. Backend &rarr; Database (PostgreSQL & Prisma) Integration
- Singleton Prisma client configured with connection pool.
- Relational integrity maintained across `Complaint`, `User`, `Department`, `Assignment`, `StatusHistory`, `AIPrediction`, and `Notification`.
- Transactional complaint creation ensures database state consistency even if optional notification dispatch fails.

### 3. Backend &rarr; AI Microservice Integration
- `AIClientService` handles communication with Python FastAPI service (`http://localhost:8000/predict`).
- Returns predicted `category`, `priority`, `department`, `confidence`, `modelVersion`, and `indicators`.
- Tested fallback handling when AI service is paused: system logs complaint successfully, sets status to `AI_REVIEW_REQUIRED`, and notifies Admin.

### 4. End-to-End Complaint Lifecycle Dry Run
1. **Submission**: Student logs issue: *"Wi-Fi is disconnected in Computer Lab 3 since morning."*
2. **AI Inference**: Python ML service predicts `Category: IT_NETWORK`, `Priority: HIGH`, `Confidence: 0.94`.
3. **Auto Routing**: Express Backend maps `IT_NETWORK` &rarr; `IT & Network Services` Department.
4. **Auto Assignment**: Selects available IT technician (`Alex Network`) with lowest active workload.
5. **Technician Action**: Technician receives notification, opens task, and updates status to `IN_PROGRESS` with work note.
6. **Resolution**: Technician completes work and marks ticket as `RESOLVED`.
7. **Confirmation**: Student receives resolution notification, inspects fix, and confirms closure &rarr; Status becomes `CLOSED`.
