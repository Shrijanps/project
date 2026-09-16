import os
import json
import sqlite3
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split, cross_val_score, KFold
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import KNeighborsRegressor
from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, 'data', 'real_estate.db')
MODELS_DIR = os.path.join(BASE_DIR, 'models')
os.makedirs(MODELS_DIR, exist_ok=True)

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
TARGET_COLUMN = 'Price'

def load_data_from_db():
    conn = sqlite3.connect(DB_PATH)
    query = """
    SELECT 
        id,
        square_feet as Square_Feet,
        num_bedrooms as Num_Bedrooms,
        num_bathrooms as Num_Bathrooms,
        num_floors as Num_Floors,
        year_built as Year_Built,
        has_garden as Has_Garden,
        has_pool as Has_Pool,
        garage_size as Garage_Size,
        location_score as Location_Score,
        distance_to_center as Distance_to_Center,
        price as Price
    FROM properties
    ORDER BY id ASC;
    """
    df = pd.read_sql_query(query, conn)
    conn.close()
    return df

def train_and_evaluate():
    print("1. Loading dataset from SQLite database...")
    df = load_data_from_db()
    print(f"Loaded {len(df)} records.")

    X = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN]

    # Calculate Pearson correlations with Price
    correlations = {}
    for col in FEATURE_COLUMNS:
        corr = float(df[col].corr(df[TARGET_COLUMN]))
        correlations[col] = round(corr, 4)
    print("Feature Correlations with Price:", correlations)

    # 2. Train-Test Split (80% Train, 20% Test)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42
    )
    print(f"Train size: {len(X_train)} rows, Test size: {len(X_test)} rows")

    # 3. Feature Scaling (StandardScaler)
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # 4. Hyperparameter Tuning: K from 1 to 30
    print("4. Tuning Hyperparameter K (1 to 30) via 5-Fold Cross-Validation...")
    k_range = list(range(1, 31))
    cv = KFold(n_splits=5, shuffle=True, random_state=42)
    
    k_curve_data = []
    best_k = 5
    best_val_rmse = float('inf')
    best_weights = 'distance'

    for k in k_range:
        # Cross validation with distance weights
        model_dist = KNeighborsRegressor(n_neighbors=k, weights='distance', metric='euclidean')
        scores_dist_rmse = -cross_val_score(model_dist, X_train_scaled, y_train, cv=cv, scoring='neg_root_mean_squared_error')
        scores_dist_mae = -cross_val_score(model_dist, X_train_scaled, y_train, cv=cv, scoring='neg_mean_absolute_error')
        scores_dist_r2 = cross_val_score(model_dist, X_train_scaled, y_train, cv=cv, scoring='r2')

        # Cross validation with uniform weights
        model_uni = KNeighborsRegressor(n_neighbors=k, weights='uniform', metric='euclidean')
        scores_uni_rmse = -cross_val_score(model_uni, X_train_scaled, y_train, cv=cv, scoring='neg_root_mean_squared_error')
        scores_uni_mae = -cross_val_score(model_uni, X_train_scaled, y_train, cv=cv, scoring='neg_mean_absolute_error')
        scores_uni_r2 = cross_val_score(model_uni, X_train_scaled, y_train, cv=cv, scoring='r2')

        avg_dist_rmse = float(np.mean(scores_dist_rmse))
        avg_dist_mae = float(np.mean(scores_dist_mae))
        avg_dist_r2 = float(np.mean(scores_dist_r2))

        avg_uni_rmse = float(np.mean(scores_uni_rmse))
        avg_uni_mae = float(np.mean(scores_uni_mae))
        avg_uni_r2 = float(np.mean(scores_uni_r2))

        k_curve_data.append({
            'k': k,
            'distance_rmse': round(avg_dist_rmse, 2),
            'distance_mae': round(avg_dist_mae, 2),
            'distance_r2': round(avg_dist_r2, 4),
            'uniform_rmse': round(avg_uni_rmse, 2),
            'uniform_mae': round(avg_uni_mae, 2),
            'uniform_r2': round(avg_uni_r2, 4)
        })

        if avg_dist_rmse < best_val_rmse:
            best_val_rmse = avg_dist_rmse
            best_k = k
            best_weights = 'distance'

        if avg_uni_rmse < best_val_rmse:
            best_val_rmse = avg_uni_rmse
            best_k = k
            best_weights = 'uniform'

    print(f"Optimal K found: K={best_k}, weights='{best_weights}', Validation RMSE: ${best_val_rmse:,.2f}")

    # 5. Train Best Model on Full Training Set
    best_model = KNeighborsRegressor(n_neighbors=best_k, weights=best_weights, metric='euclidean')
    best_model.fit(X_train_scaled, y_train)

    # 6. Evaluation on Test Set
    y_pred = best_model.predict(X_test_scaled)
    mae = float(mean_absolute_error(y_test, y_pred))
    mse = float(mean_squared_error(y_test, y_pred))
    rmse = float(np.sqrt(mse))
    r2 = float(r2_score(y_test, y_pred))

    print("\n--- Test Set Evaluation Results ---")
    print(f"Mean Absolute Error (MAE)       : ${mae:,.2f}")
    print(f"Mean Squared Error (MSE)        : {mse:,.2f}")
    print(f"Root Mean Squared Error (RMSE)  : ${rmse:,.2f}")
    print(f"R-squared Score (R²)            : {r2:.4f}")

    # Benchmark Model Comparisons: Linear Regression, Decision Tree, Random Forest
    print("\nEvaluating Benchmark Comparison Models (Linear Regression, Decision Tree, Random Forest)...")
    lr = LinearRegression().fit(X_train_scaled, y_train)
    y_pred_lr = lr.predict(X_test_scaled)
    lr_mae = float(mean_absolute_error(y_test, y_pred_lr))
    lr_mse = float(mean_squared_error(y_test, y_pred_lr))
    lr_rmse = float(np.sqrt(lr_mse))
    lr_r2 = float(r2_score(y_test, y_pred_lr))

    dt = DecisionTreeRegressor(random_state=42, max_depth=6).fit(X_train_scaled, y_train)
    y_pred_dt = dt.predict(X_test_scaled)
    dt_mae = float(mean_absolute_error(y_test, y_pred_dt))
    dt_mse = float(mean_squared_error(y_test, y_pred_dt))
    dt_rmse = float(np.sqrt(dt_mse))
    dt_r2 = float(r2_score(y_test, y_pred_dt))

    rf = RandomForestRegressor(n_estimators=100, random_state=42, max_depth=8).fit(X_train_scaled, y_train)
    y_pred_rf = rf.predict(X_test_scaled)
    rf_mae = float(mean_absolute_error(y_test, y_pred_rf))
    rf_mse = float(mean_squared_error(y_test, y_pred_rf))
    rf_rmse = float(np.sqrt(rf_mse))
    rf_r2 = float(r2_score(y_test, y_pred_rf))

    model_comparisons = [
        {
            'name': 'K-Nearest Neighbors (K=8, Weighted)',
            'type': 'KNN Regressor (Selected)',
            'mae': round(mae, 2),
            'mse': round(mse, 2),
            'rmse': round(rmse, 2),
            'r2_score': round(r2, 4),
            'notes': 'Best local neighbor capture; directly provides comparable property identification'
        },
        {
            'name': 'Linear Regression',
            'type': 'Parametric Linear',
            'mae': round(lr_mae, 2),
            'mse': round(lr_mse, 2),
            'rmse': round(lr_rmse, 2),
            'r2_score': round(lr_r2, 4),
            'notes': 'Simple baseline, assumes linear feature relationships'
        },
        {
            'name': 'Decision Tree Regressor',
            'type': 'Non-linear Tree (Depth=6)',
            'mae': round(dt_mae, 2),
            'mse': round(dt_mse, 2),
            'rmse': round(dt_rmse, 2),
            'r2_score': round(dt_r2, 4),
            'notes': 'Piecewise constant approximations, prone to high variance'
        },
        {
            'name': 'Random Forest Regressor',
            'type': 'Ensemble (100 Trees)',
            'mae': round(rf_mae, 2),
            'mse': round(rf_mse, 2),
            'rmse': round(rf_rmse, 2),
            'r2_score': round(rf_r2, 4),
            'notes': 'Strong ensemble baseline, higher computational complexity'
        }
    ]

    # Baseline comparison: Mean prediction baseline
    y_mean = np.mean(y_train)
    baseline_mae = float(mean_absolute_error(y_test, np.full_like(y_test, y_mean)))
    baseline_rmse = float(np.sqrt(mean_squared_error(y_test, np.full_like(y_test, y_mean))))

    # 7. Save Model and Scaler
    model_path = os.path.join(MODELS_DIR, 'knn_model.joblib')
    scaler_path = os.path.join(MODELS_DIR, 'scaler.joblib')
    metadata_path = os.path.join(MODELS_DIR, 'model_metadata.json')

    joblib.dump(best_model, model_path)
    joblib.dump(scaler, scaler_path)

    # Also fit a model on all data for production deployment while retaining validation metrics
    full_scaler = StandardScaler()
    X_all_scaled = full_scaler.fit_transform(X)
    full_model = KNeighborsRegressor(n_neighbors=best_k, weights=best_weights, metric='euclidean')
    full_model.fit(X_all_scaled, y)
    joblib.dump(full_model, os.path.join(MODELS_DIR, 'knn_full_model.joblib'))
    joblib.dump(full_scaler, os.path.join(MODELS_DIR, 'full_scaler.joblib'))

    metadata = {
        'model_name': 'K-Nearest Neighbors Regressor',
        'algorithm': 'KNeighborsRegressor',
        'best_k': best_k,
        'weights': best_weights,
        'metric': 'euclidean',
        'feature_columns': FEATURE_COLUMNS,
        'target_column': TARGET_COLUMN,
        'total_samples': len(df),
        'train_samples': len(X_train),
        'test_samples': len(X_test),
        'metrics': {
            'mae': round(mae, 2),
            'mse': round(mse, 2),
            'rmse': round(rmse, 2),
            'r2_score': round(r2, 4),
            'baseline_mae': round(baseline_mae, 2),
            'baseline_rmse': round(baseline_rmse, 2),
            'variance_explained_pct': round(r2 * 100, 2)
        },
        'feature_correlations': correlations,
        'feature_stats': {
            col: {
                'min': float(df[col].min()),
                'max': float(df[col].max()),
                'mean': round(float(df[col].mean()), 2),
                'median': round(float(df[col].median()), 2),
                'std': round(float(df[col].std()), 2)
            } for col in FEATURE_COLUMNS
        },
        'k_vs_error_curve': k_curve_data,
        'model_comparisons': model_comparisons
    }

    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)

    print(f"\nArtifacts successfully saved to {MODELS_DIR}:")
    print(f" - Model: {model_path}")
    print(f" - Scaler: {scaler_path}")
    print(f" - Metadata: {metadata_path}")

if __name__ == '__main__':
    train_and_evaluate()
