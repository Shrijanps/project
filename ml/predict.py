import os
import sys
import json
import sqlite3
import numpy as np
import pandas as pd
import joblib

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, 'models')
DB_PATH = os.path.join(BASE_DIR, 'data', 'real_estate.db')

FEATURE_COLUMNS = [
    'Square_Feet',
    'Num_Bedrooms',
    'Num_Bathrooms',
    'Num_Floors',
    'Year_Built',
    'Has_Garden',
    'Has_Pool',
    'Garage_Size',
    'Location_Score',
    'Distance_to_Center'
]

def load_artifacts():
    metadata_path = os.path.join(MODELS_DIR, 'model_metadata.json')
    scaler_path = os.path.join(MODELS_DIR, 'full_scaler.joblib')
    model_path = os.path.join(MODELS_DIR, 'knn_full_model.joblib')

    if not os.path.exists(model_path):
        model_path = os.path.join(MODELS_DIR, 'knn_model.joblib')
        scaler_path = os.path.join(MODELS_DIR, 'scaler.joblib')

    with open(metadata_path, 'r') as f:
        metadata = json.load(f)

    model = joblib.load(model_path)
    scaler = joblib.load(scaler_path)
    return model, scaler, metadata

def predict_property(features_dict, k_value=None):
    """
    Predict property price and return nearest neighbors.
    features_dict: dict containing the 10 feature values
    k_value: optional integer to override K (default: optimal K from metadata)
    """
    model, scaler, metadata = load_artifacts()

    # Determine K
    if k_value is None or int(k_value) <= 0:
        k_value = metadata.get('best_k', 8)
    else:
        k_value = min(max(int(k_value), 1), 50)

    # Prepare input vector
    input_vector = []
    for col in FEATURE_COLUMNS:
        val = features_dict.get(col)
        if val is None:
            # Fallback to feature mean
            val = metadata['feature_stats'][col]['mean']
        input_vector.append(float(val))

    input_df = pd.DataFrame([input_vector], columns=FEATURE_COLUMNS)
    input_scaled = scaler.transform(input_df)

    # If custom K differs from model's n_neighbors, set n_neighbors
    original_k = model.n_neighbors
    model.n_neighbors = k_value

    # Predict
    predicted_price = float(model.predict(input_scaled)[0])

    # Find k nearest neighbors
    distances, indices = model.kneighbors(input_scaled, n_neighbors=k_value)
    distances = distances[0].tolist()
    indices = indices[0].tolist()

    # Reset original K
    model.n_neighbors = original_k

    # Fetch details for the nearest neighbor properties from SQLite DB
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
    SELECT 
        id, square_feet, num_bedrooms, num_bathrooms, num_floors,
        year_built, has_garden, has_pool, garage_size, location_score,
        distance_to_center, price
    FROM properties
    ORDER BY id ASC;
    """)
    all_properties = cursor.fetchall()
    conn.close()

    neighbors = []
    for dist, idx in zip(distances, indices):
        if idx < len(all_properties):
            p = all_properties[idx]
            neighbors.append({
                'property_id': p[0],
                'distance': round(float(dist), 4),
                'similarity_pct': round(max(0, 100 - (float(dist) * 15)), 1),
                'square_feet': round(float(p[1]), 2),
                'num_bedrooms': int(p[2]),
                'num_bathrooms': int(p[3]),
                'num_floors': int(p[4]),
                'year_built': int(p[5]),
                'has_garden': int(p[6]),
                'has_pool': int(p[7]),
                'garage_size': int(p[8]),
                'location_score': round(float(p[9]), 2),
                'distance_to_center': round(float(p[10]), 2),
                'actual_price': round(float(p[11]), 2)
            })

    result = {
        'predicted_price': round(predicted_price, 2),
        'k_used': k_value,
        'model_name': 'KNN Regressor (Distance Weighted)',
        'metric': 'Euclidean Distance (StandardScaler)',
        'input_features': {col: features_dict[col] for col in FEATURE_COLUMNS if col in features_dict},
        'nearest_neighbors': neighbors
    }
    return result

if __name__ == '__main__':
    # Test sample prediction
    sample_input = {
        'Square_Feet': 200.0,
        'Num_Bedrooms': 3,
        'Num_Bathrooms': 2,
        'Num_Floors': 2,
        'Year_Built': 1995,
        'Has_Garden': 1,
        'Has_Pool': 0,
        'Garage_Size': 30,
        'Location_Score': 7.5,
        'Distance_to_Center': 5.0
    }
    res = predict_property(sample_input, k_value=5)
    print(json.dumps(res, indent=2))
