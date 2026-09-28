from pydantic import BaseModel, Field
from typing import List, Optional

class PredictRequest(BaseModel):
    title: str = Field(..., min_length=2, example="Wi-Fi not working")
    description: str = Field(..., min_length=5, example="Internet has stopped in Lab 3")
    location: Optional[str] = Field(None, example="Computer Lab 3")

class PredictResponse(BaseModel):
    category: str
    priority: str
    department: str
    confidence: float
    modelVersion: str
    indicators: List[str]

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    version: str
