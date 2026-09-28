import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.schemas.prediction import PredictRequest, PredictResponse, HealthResponse
from app.services.predictor import PredictorService, MODEL_VERSION

app = FastAPI(
    title="CampusFix AI Microservice",
    description="Machine Learning service for intelligent campus complaint classification & priority prediction",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", response_model=HealthResponse)
def health_check():
    loaded = getattr(PredictorService, 'is_loaded', False)
    return HealthResponse(
        status="ok" if loaded else "degraded",
        model_loaded=loaded,
        version=MODEL_VERSION
    )

@app.post("/predict", response_model=PredictResponse)
def predict_complaint(request: PredictRequest):
    try:
        result = PredictorService.predict(
            title=request.title,
            description=request.description,
            location=request.location or ""
        )
        return PredictResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.get("/model-info")
def get_model_info():
    return {
        "modelVersion": MODEL_VERSION,
        "loaded": getattr(PredictorService, 'is_loaded', False),
        "supportedCategories": [
            "IT_NETWORK", "ELECTRICAL", "PLUMBING", "CLEANING", "HOSTEL",
            "CLASSROOM", "LABORATORY", "LIBRARY", "SECURITY", "TRANSPORT",
            "CANTEEN", "INFRASTRUCTURE", "OTHER"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("AI_SERVICE_PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
