# CampusFix AI — Intelligent Campus Issue Resolution Platform

> **Integrated Full-Stack AI Application** featuring React 18, TypeScript, Tailwind CSS, Express.js, PostgreSQL with Prisma ORM, and Python FastAPI Machine Learning Microservice.

---

## 🚀 Key Features

- **End-to-End Complaint Lifecycle**: Submitted &rarr; AI Analyzed &rarr; Assigned &rarr; In Progress &rarr; Resolved &rarr; Student Confirmed / Reopened.
- **AI Complaint Classification**: Trained Machine Learning model (TF-IDF + Logistic Regression) that predicts **Category**, **Priority**, and **Department Recommendation** with **Confidence Scores** and **Keyword Indicators**.
- **Deterministic Routing & Workload Balancing**: Auto-assigns complaints to eligible department technicians based on lowest active workload.
- **Graceful Fallback Handling**: If the AI microservice is unavailable or returns low confidence (<75%), the system automatically flags the ticket for Admin Review (`AI_REVIEW_REQUIRED`) without crashing.
- **Role-Based Access Control (RBAC)**: Enforced JWT authentication with explicit role permissions for `STUDENT`, `TECHNICIAN`, and `ADMIN`.
- **Real Database Analytics**: Admin dashboard rendering PostgreSQL data aggregations (Category distribution, Priority breakdown, Department workload, and Recurring Issue pattern detection).
- **Context-Aware AI Assistant**: Interactive chatbot that queries authenticated backend database state for real complaint status tracking.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Recharts, Lucide Icons, React Router DOM, Axios, React Hook Form |
| **Backend API** | Node.js, TypeScript, Express.js, Prisma ORM, Zod, JWT, bcryptjs, Helmet, Rate Limiting |
| **Database** | PostgreSQL 16 (Relational models with status history, predictions, assignments, audit logs) |
| **AI Service** | Python 3.11+, FastAPI, scikit-learn, pandas, NumPy, joblib, Pydantic, uvicorn |
| **Containerization** | Docker, Docker Compose |

---

## 🔑 Demo Login Credentials

Use these pre-seeded demo accounts to test the platform:

| Role | Email | Password | Access / Capabilities |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@campusfix.local` | `Password123!` | System overview, AI review queue, user directory, analytics |
| **Technician (Network)** | `tech.network@campusfix.local` | `Password123!` | IT / Network assigned tasks, status updates, work notes |
| **Technician (Electrical)** | `tech.elec@campusfix.local` | `Password123!` | Electrical maintenance tasks |
| **Technician (Plumbing)** | `tech.plumb@campusfix.local` | `Password123!` | Plumbing & sanitation tasks |
| **Student (Rahul)** | `student1@campusfix.local` | `Password123!` | Log complaints, track status, confirm resolution, reopen |
| **Student (Priya)** | `student2@campusfix.local` | `Password123!` | Log complaints & track status |

---

## ⚙️ Quick Start Setup Instructions

### 1. Database & Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install npm dependencies
npm install

# Run Prisma Database Migrations (PostgreSQL)
npx prisma migrate dev --name init

# Seed database with default departments, demo users, and complaints
npx prisma db seed

# Start Express Backend server (Port 5000)
npm run dev
```

### 2. Python AI Service Setup

```bash
# Navigate to ai-service directory
cd ai-service

# Install Python dependencies
pip install -r requirements.txt

# Train Machine Learning classification models
python training/train.py

# Start FastAPI AI microservice (Port 8000)
python -m uvicorn app.main:app --port 8000
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install npm dependencies
npm install

# Start Vite Development Server (Port 5173)
npm run dev
```

Access the application in your browser at: **`http://localhost:5173`**

---

## 📡 Core API Endpoints

### Authentication
- `POST /api/auth/register` — Student registration
- `POST /api/auth/login` — Authenticate and receive JWT token
- `GET /api/auth/me` — Fetch current user profile

### Complaints
- `POST /api/complaints` — Create new complaint (triggers AI classification & auto-routing)
- `GET /api/complaints` — Get paginated complaints with search & filters
- `GET /api/complaints/:id` — Get detailed complaint with timeline & comments
- `POST /api/complaints/:id/status` — Update status (`IN_PROGRESS`, `RESOLVED`, `CLOSED`)
- `POST /api/complaints/:id/reopen` — Reopen resolved complaint
- `POST /api/complaints/:id/review-ai` — Admin override for low-confidence AI predictions

### Analytics & System Health
- `GET /api/health` — System health check (Backend, Database, AI service, Model state)
- `GET /api/analytics/overview` — Overall complaint statistics
- `GET /api/analytics/categories` — Complaint count by category
- `GET /api/analytics/departments` — Department workload breakdown
- `GET /api/analytics/recurring` — Location + Category recurring issue clusters

---

## 🧪 Integration Testing Verified

1. **High-Confidence AI Routing Flow**: Student logs Wi-Fi issue &rarr; AI classifies as `IT_NETWORK` with High Priority &rarr; Auto-routed to IT & assigned to Alex Network.
2. **Low-Confidence AI Review Flow**: Nonspecific query logged &rarr; Flagged as `AI_REVIEW_REQUIRED` &rarr; Admin reviews in queue, selects department, and approves.
3. **AI Fallback Resilience**: System functions normally with fallback state if AI service is paused.
4. **Resolution Confirmation & Reopen Lifecycle**: Technician marks resolved &rarr; Student verifies fix &rarr; Confirms closure or reopens ticket.
