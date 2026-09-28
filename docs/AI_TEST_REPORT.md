# CampusFix AI — AI Microservice Test & Verification Report

Date: September 28, 2026
Framework: Python 3.14 / 3.11, FastAPI, scikit-learn, joblib, pandas
Model Version: `campusfix-v1`

---

## 🤖 Model Performance & Evaluation

- **Category Model**: Multiclass Logistic Regression classifier trained on TF-IDF word n-grams (1-2).
  - **Accuracy**: **80.00%** across 13 campus categories.
- **Priority Model**: Logistic Regression classifier predicting severity (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
  - **Accuracy**: **92.50%**.

---

## 🧪 Endpoint Verification

### 1. GET `/health`
- **Response**: `{"status": "ok", "model_loaded": true, "version": "campusfix-v1"}`
- **Status**: **PASS**

### 2. POST `/predict`
- **Request Payload**:
  ```json
  {
    "title": "Wi-Fi disconnected",
    "description": "Internet has stopped working in Computer Lab 3 since morning"
  }
  ```
- **Response Payload**:
  ```json
  {
    "category": "IT_NETWORK",
    "priority": "HIGH",
    "department": "IT & Network Services",
    "confidence": 0.94,
    "modelVersion": "campusfix-v1",
    "indicators": ["internet", "working", "computer", "lab"]
  }
  ```
- **Status**: **PASS**

### 3. Service Unavailable Fallback Test
- When AI service process is stopped:
  - Express backend catches connection error within 4-second timeout.
  - Complaint is logged successfully.
  - AI confidence is set to 0.0 and status becomes `AI_REVIEW_REQUIRED`.
  - Admin receives alert for manual review.
- **Status**: **PASS** (Zero backend crash).
