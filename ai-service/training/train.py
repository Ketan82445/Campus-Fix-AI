import os
import pandas as pd
import numpy as np
import joblib
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report

def clean_text(text: str) -> str:
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def train():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(script_dir)
    data_path = os.path.join(project_dir, 'data', 'dataset.csv')
    saved_models_dir = os.path.join(project_dir, 'saved_models')

    os.makedirs(saved_models_dir, exist_ok=True)

    print(f"Loading training dataset from {data_path}...")
    df = pd.read_csv(data_path)

    df['combined_text'] = df['title'] + " " + df['description']
    df['clean_text'] = df['combined_text'].apply(clean_text)

    # TF-IDF Vectorizer
    vectorizer = TfidfVectorizer(max_features=1000, ngram_range=(1, 2), stop_words='english')
    X = vectorizer.fit_transform(df['clean_text'])

    # 1. Category Model
    y_category = df['category']
    cat_model = LogisticRegression(C=1.0, max_iter=200, random_state=42)
    cat_model.fit(X, y_category)
    cat_preds = cat_model.predict(X)
    print(f"Category Model Accuracy: {accuracy_score(y_category, cat_preds):.2%}")

    # 2. Priority Model
    y_priority = df['priority']
    prio_model = LogisticRegression(C=1.0, max_iter=200, random_state=42)
    prio_model.fit(X, y_priority)
    prio_preds = prio_model.predict(X)
    print(f"Priority Model Accuracy: {accuracy_score(y_priority, prio_preds):.2%}")

    # Department Map per Category
    dept_map = df.set_index('category')['department'].to_dict()

    # Save artifacts
    joblib.dump(vectorizer, os.path.join(saved_models_dir, 'tfidf_vectorizer.joblib'))
    joblib.dump(cat_model, os.path.join(saved_models_dir, 'category_model.joblib'))
    joblib.dump(prio_model, os.path.join(saved_models_dir, 'priority_model.joblib'))
    joblib.dump(dept_map, os.path.join(saved_models_dir, 'dept_map.joblib'))

    print(f"Model artifacts successfully saved in {saved_models_dir}")

if __name__ == '__main__':
    train()
