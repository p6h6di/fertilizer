from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import numpy as np
import json

app = FastAPI(title="AgroIntelX Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CropRecommendationRequest(BaseModel):
    soil_type: str
    soil_ph: Optional[float] = 7.0
    nitrogen: Optional[float] = 50.0
    phosphorus: Optional[float] = 50.0
    potassium: Optional[float] = 50.0
    rainfall: Optional[float] = 100.0
    temperature: Optional[float] = 25.0
    humidity: Optional[float] = 60.0
    season: Optional[str] = "Kharif"
    latitude: Optional[float] = None
    longitude: Optional[float] = None

# Rule-based crop recommendation engine
CROP_RULES = {
    "rice": {"min_temp": 20, "max_temp": 35, "min_rain": 150, "max_rain": 300, "soil_types": ["clay", "loamy"], "seasons": ["Kharif"]},
    "wheat": {"min_temp": 10, "max_temp": 25, "min_rain": 30, "max_rain": 100, "soil_types": ["loamy", "clay"], "seasons": ["Rabi"]},
    "maize": {"min_temp": 18, "max_temp": 32, "min_rain": 50, "max_rain": 150, "soil_types": ["loamy", "sandy"], "seasons": ["Kharif", "Rabi"]},
    "sugarcane": {"min_temp": 20, "max_temp": 35, "min_rain": 100, "max_rain": 200, "soil_types": ["loamy", "clay"], "seasons": ["Kharif", "Rabi"]},
    "cotton": {"min_temp": 21, "max_temp": 35, "min_rain": 50, "max_rain": 100, "soil_types": ["loamy", "black"], "seasons": ["Kharif"]},
    "soybean": {"min_temp": 20, "max_temp": 30, "min_rain": 60, "max_rain": 150, "soil_types": ["loamy", "clay"], "seasons": ["Kharif"]},
    "groundnut": {"min_temp": 20, "max_temp": 30, "min_rain": 50, "max_rain": 125, "soil_types": ["sandy", "loamy"], "seasons": ["Kharif"]},
    "chickpea": {"min_temp": 15, "max_temp": 25, "min_rain": 30, "max_rain": 80, "soil_types": ["loamy", "clay"], "seasons": ["Rabi"]},
    "mustard": {"min_temp": 10, "max_temp": 25, "min_rain": 25, "max_rain": 75, "soil_types": ["loamy", "sandy"], "seasons": ["Rabi"]},
    "millet": {"min_temp": 20, "max_temp": 35, "min_rain": 40, "max_rain": 100, "soil_types": ["sandy", "loamy"], "seasons": ["Kharif"]},
    "barley": {"min_temp": 12, "max_temp": 25, "min_rain": 25, "max_rain": 75, "soil_types": ["loamy", "sandy"], "seasons": ["Rabi"]},
    "potato": {"min_temp": 10, "max_temp": 20, "min_rain": 50, "max_rain": 120, "soil_types": ["loamy", "sandy"], "seasons": ["Rabi", "Zaid"]},
    "tomato": {"min_temp": 18, "max_temp": 30, "min_rain": 40, "max_rain": 100, "soil_types": ["loamy", "sandy"], "seasons": ["Rabi", "Zaid"]},
    "onion": {"min_temp": 13, "max_temp": 24, "min_rain": 30, "max_rain": 80, "soil_types": ["loamy", "clay"], "seasons": ["Rabi", "Kharif"]},
}

DISEASE_DATABASE = {
    "leaf_blight": {
        "name": "Leaf Blight",
        "crops": ["rice", "wheat", "maize"],
        "symptoms": "Brown lesions on leaves with yellow halos",
        "treatment": ["Apply copper-based fungicide", "Remove infected plant material", "Improve drainage"],
        "prevention": ["Use resistant varieties", "Avoid overhead irrigation", "Practice crop rotation"],
        "severity_levels": ["mild", "moderate", "severe"],
    },
    "powdery_mildew": {
        "name": "Powdery Mildew",
        "crops": ["wheat", "barley", "pea"],
        "symptoms": "White powdery coating on leaves and stems",
        "treatment": ["Apply sulfur-based fungicide", "Use potassium bicarbonate spray", "Prune affected areas"],
        "prevention": ["Ensure proper air circulation", "Avoid excessive nitrogen", "Use resistant varieties"],
        "severity_levels": ["mild", "moderate", "severe"],
    },
    "rust": {
        "name": "Rust Disease",
        "crops": ["wheat", "barley", "coffee"],
        "symptoms": "Orange-brown pustules on leaves",
        "treatment": ["Apply triazole fungicides", "Remove infected plants", "Apply systemic fungicide"],
        "prevention": ["Plant rust-resistant varieties", "Early sowing", "Monitor regularly"],
        "severity_levels": ["mild", "moderate", "severe"],
    },
    "healthy": {
        "name": "Healthy Plant",
        "crops": ["all"],
        "symptoms": "No visible disease symptoms",
        "treatment": ["Continue regular care", "Maintain proper nutrition"],
        "prevention": ["Regular monitoring", "Balanced fertilization", "Adequate irrigation"],
        "severity_levels": ["none"],
    },
}

@app.get("/")
def root():
    return {"message": "AgroIntelX Backend API", "version": "1.0.0"}

@app.post("/recommend")
def recommend_crops(request: CropRecommendationRequest):
    recommendations = []

    for crop_name, rules in CROP_RULES.items():
        score = 0.0
        reasons = []

        # Temperature check
        if rules["min_temp"] <= request.temperature <= rules["max_temp"]:
            score += 0.3
            reasons.append(f"Temperature {request.temperature}°C is suitable")

        # Rainfall check
        if rules["min_rain"] <= request.rainfall <= rules["max_rain"]:
            score += 0.3
            reasons.append(f"Rainfall {request.rainfall}mm is adequate")

        # Soil type check
        if request.soil_type.lower() in rules["soil_types"]:
            score += 0.25
            reasons.append(f"{request.soil_type} soil is compatible")

        # Season check
        if request.season in rules["seasons"]:
            score += 0.15
            reasons.append(f"Suitable for {request.season} season")

        if score >= 0.5:
            recommendations.append({
                "crop": crop_name,
                "confidence": round(score, 2),
                "reasons": reasons,
                "season": rules["seasons"],
            })

    # Sort by confidence
    recommendations.sort(key=lambda x: x["confidence"], reverse=True)
    top_recommendations = recommendations[:5] if recommendations else [
        {"crop": "millet", "confidence": 0.6, "reasons": ["Hardy crop suitable for various conditions"], "season": ["Kharif"]}
    ]

    return {
        "recommendations": top_recommendations,
        "input_summary": {
            "soil_type": request.soil_type,
            "temperature": request.temperature,
            "rainfall": request.rainfall,
            "season": request.season,
        }
    }

@app.post("/detect")
async def detect_disease(file: UploadFile = File(...), crop_type: str = "unknown"):
    # Simulated disease detection (in production, use a trained CNN model)
    import random

    contents = await file.read()
    file_size = len(contents)

    # Simulate ML inference based on file characteristics
    diseases = list(DISEASE_DATABASE.keys())
    detected_key = random.choice(diseases)
    disease_info = DISEASE_DATABASE[detected_key]

    confidence = round(random.uniform(0.72, 0.97), 2)
    severity_idx = int((1 - confidence) * len(disease_info["severity_levels"]))
    severity = disease_info["severity_levels"][min(severity_idx, len(disease_info["severity_levels"]) - 1)]

    return {
        "disease": disease_info["name"],
        "disease_key": detected_key,
        "confidence": confidence,
        "severity": severity,
        "crop_type": crop_type,
        "symptoms": disease_info["symptoms"],
        "treatment": disease_info["treatment"],
        "prevention": disease_info["prevention"],
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "AgroIntelX Backend"}
