export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
  properties_count?: number;
  predictions_count?: number;
}

export interface Property {
  id: number;
  square_feet: number;
  num_bedrooms: number;
  num_bathrooms: number;
  num_floors: number;
  year_built: number;
  has_garden: number;
  has_pool: number;
  garage_size: number;
  location_score: number;
  distance_to_center: number;
  price: number;
  created_by?: number | null;
  created_at?: string;
  creator_name?: string;
}

export interface NearestNeighbor {
  property_id: number;
  distance: number;
  similarity_pct: number;
  square_feet: number;
  num_bedrooms: number;
  num_bathrooms: number;
  num_floors: number;
  year_built: number;
  has_garden: number;
  has_pool: number;
  garage_size: number;
  location_score: number;
  distance_to_center: number;
  actual_price: number;
}

export interface PredictionResult {
  predicted_price: number;
  k_used: number;
  model_name: string;
  metric: string;
  input_features: Record<string, number>;
  nearest_neighbors: NearestNeighbor[];
  prediction_id?: number;
  saved_to_history?: boolean;
}

export interface PredictionHistoryItem {
  id: number;
  user_id: number | null;
  input_features: Record<string, number>;
  predicted_price: number;
  selected_model: string;
  k_value: number;
  distance_metric: string;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

export interface PropertyStats {
  total_properties: number;
  avg_price: number;
  min_price: number;
  max_price: number;
  median_price: number;
  avg_square_feet: number;
  avg_bedrooms: number;
  avg_bathrooms: number;
  avg_year_built: number;
  avg_location_score: number;
  total_with_garden: number;
  total_with_pool: number;
}

export interface FeatureStats {
  min: number;
  max: number;
  mean: number;
  median: number;
  std: number;
}

export interface KCurveItem {
  k: number;
  distance_rmse: number;
  distance_mae: number;
  distance_r2: number;
  uniform_rmse: number;
  uniform_mae: number;
  uniform_r2: number;
}

export interface ModelComparisonItem {
  name: string;
  type: string;
  mae: number;
  mse: number;
  rmse: number;
  r2_score: number;
  notes: string;
}

export interface ModelMetadata {
  model_name: string;
  algorithm: string;
  best_k: number;
  weights: string;
  metric: string;
  feature_columns: string[];
  target_column: string;
  total_samples: number;
  train_samples: number;
  test_samples: number;
  metrics: {
    mae: number;
    mse: number;
    rmse: number;
    r2_score: number;
    baseline_mae: number;
    baseline_rmse: number;
    variance_explained_pct: number;
  };
  feature_correlations: Record<string, number>;
  feature_stats: Record<string, FeatureStats>;
  k_vs_error_curve: KCurveItem[];
  model_comparisons?: ModelComparisonItem[];
}
