# CampusFix AI — Architecture & System Design

CampusFix AI is an intelligent campus complaint and issue resolution platform built with a modular, decoupled full-stack architecture.

## System Architecture Diagram

```mermaid
flowchart TD
    subgraph Client ["Frontend Layer (React 18 + TS + Tailwind)"]
        StudentUI["Student Portal"]
        TechUI["Technician Workstation"]
        AdminUI["Admin Command Center"]
        AIChatbot["Context-Aware Chatbot"]
    end

    subgraph Backend ["Backend API Layer (Node.js + Express + Prisma)"]
        AuthMiddleware["JWT & RBAC Middleware"]
        ComplaintService["Complaint Lifecycle Service"]
        RoutingEngine["Deterministic Department Router"]
        AssignmentService["Workload Assignment Algorithm"]
        AnalyticsEngine["PostgreSQL Data Aggregator"]
        NotificationService["Notification Manager"]
    end

    subgraph AIService ["Python AI Microservice (FastAPI + scikit-learn)"]
        NLPPreprocessor["Text Cleaner & TF-IDF Vectorizer"]
        CategoryClassifier["Category Logistic Regression"]
        PriorityClassifier["Priority Classifier"]
        IndicatorExtractor["Keyword Indicator Extractor"]
    end

    subgraph Database ["Persistence Layer (PostgreSQL)"]
        UsersTable[("Users Table")]
        ComplaintsTable[("Complaints Table")]
        StatusHistoryTable[("StatusHistory Table")]
        AIPredictionsTable[("AIPredictions Table")]
        AssignmentsTable[("Assignments Table")]
        AuditLogsTable[("AuditLogs Table")]
    end

    StudentUI -->|REST / JSON| AuthMiddleware
    TechUI -->|REST / JSON| AuthMiddleware
    AdminUI -->|REST / JSON| AuthMiddleware
    AIChatbot -->|Queries Real Complaints| ComplaintService

    AuthMiddleware --> ComplaintService
    AuthMiddleware --> AnalyticsEngine

    ComplaintService -->|POST /predict| AIService
    AIService --> NLPPreprocessor
    NLPPreprocessor --> CategoryClassifier
    NLPPreprocessor --> PriorityClassifier
    CategoryClassifier -->|Confidence & Predictions| ComplaintService

    ComplaintService --> RoutingEngine
    RoutingEngine --> AssignmentService
    AssignmentService --> Database
    ComplaintService --> Database
    AnalyticsEngine --> Database
    NotificationService --> Database
```

## Data Flow Lifecycle

1. **Submission**: Student submits complaint (`title`, `description`, `location`).
2. **Backend Validation**: Express & Zod validate parameters and check JWT identity.
3. **AI Prediction**: Backend sends text payload to FastAPI AI Service (`POST /predict`).
4. **Confidence Check**:
   - `confidence >= 0.75`: Complaint is auto-classified and routed.
   - `confidence < 0.75` or AI down: Complaint is flagged as `AI_REVIEW_REQUIRED` for Admin verification.
5. **Department Routing**: Deterministic mapping links category to database Department.
6. **Technician Assignment**: Finds available technician in department with lowest active workload.
7. **Status Transitions**: Tracks transitions (`SUBMITTED` &rarr; `ASSIGNED` &rarr; `IN_PROGRESS` &rarr; `RESOLVED` &rarr; `CLOSED` / `REOPENED`).
8. **Real-time Notifications & Audit**: Logs audit events and sends internal user notifications.
