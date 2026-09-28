import os
import re
import joblib
import numpy as np

MODEL_VERSION = "campusfix-v1"

class PredictorService:
    @classmethod
    def load_models(cls):
        app_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        project_dir = os.path.dirname(app_dir)
        models_dir = os.path.join(project_dir, 'saved_models')

        try:
            cls.vectorizer = joblib.load(os.path.join(models_dir, 'tfidf_vectorizer.joblib'))
            cls.category_model = joblib.load(os.path.join(models_dir, 'category_model.joblib'))
            cls.priority_model = joblib.load(os.path.join(models_dir, 'priority_model.joblib'))
            cls.dept_map = joblib.load(os.path.join(models_dir, 'dept_map.joblib'))
            cls.is_loaded = True
            print("AI Models successfully loaded into memory.")
        except Exception as e:
            cls.is_loaded = False
            print(f"Warning: Could not load AI model artifacts: {e}")

    @classmethod
    def clean_text(cls, text: str) -> str:
        text = text.lower()
        text = re.sub(r'[^a-z0-9\s]', ' ', text)
        return re.sub(r'\s+', ' ', text).strip()

    @classmethod
    def extract_indicators(cls, text: str, vectorizer) -> list:
        try:
            feature_names = vectorizer.get_feature_names_out()
            words = text.lower().split()
            found = [w for w in words if w in feature_names and len(w) > 3]
            return list(set(found))[:5]
        except:
            return []

    @classmethod
    def predict(cls, title: str, description: str, location: str = ""):
        if not getattr(cls, 'is_loaded', False):
            cls.load_models()

        if not getattr(cls, 'is_loaded', False):
            return {
                "category": "OTHER",
                "priority": "MEDIUM",
                "department": "Infrastructure & Facilities",
                "confidence": 0.50,
                "modelVersion": MODEL_VERSION,
                "indicators": ["Fallback Mode"]
            }

        combined_text = f"{title} {description} {location}"
        clean_input = cls.clean_text(combined_text)

        X = cls.vectorizer.transform([clean_input])

        # Category Prediction
        cat_probs = cls.category_model.predict_proba(X)[0]
        max_cat_idx = np.argmax(cat_probs)
        predicted_cat = cls.category_model.classes_[max_cat_idx]
        cat_confidence = float(cat_probs[max_cat_idx])

        # Priority Prediction
        prio_probs = cls.priority_model.predict_proba(X)[0]
        max_prio_idx = np.argmax(prio_probs)
        predicted_prio = cls.priority_model.classes_[max_prio_idx]

        # Department Mapping
        department = cls.dept_map.get(predicted_cat, "Infrastructure & Facilities")

        # Extract indicators
        indicators = cls.extract_indicators(clean_input, cls.vectorizer)

        return {
            "category": predicted_cat,
            "priority": predicted_prio,
            "department": department,
            "confidence": round(cat_confidence, 2),
            "modelVersion": MODEL_VERSION,
            "indicators": indicators
        }

# Initial load on module import
PredictorService.load_models()
